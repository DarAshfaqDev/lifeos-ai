"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { tasksApi, analyticsApi, aiCoachApi, focusApi } from "@/lib/api";
import { Task, TodayData } from "@/types";
import { useTimer } from "@/hooks/useTimer";
import {
  SOUNDSCAPES,
  SoundscapeId,
  soundscape,
  loadSoundPrefs,
  saveSoundPrefs,
} from "@/lib/soundscapes";
import {
  Play,
  Pause,
  Plus,
  ChevronLeft,
  Volume2,
  Inbox,
  Check,
  Wind,
  ListRestart,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";

function parseBreakdown(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function BreathCountdown({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const phrases = ["Take a breath.", "You don't have to finish everything.", "Just begin."];

  useEffect(() => {
    if (step < phrases.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [step, onDone]);

  if (step < phrases.length) {
    return (
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="text-center"
      >
        <p className="text-xl md:text-2xl text-foreground/80 font-light">
          {phrases[step]}
        </p>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <p className="text-6xl font-extralight text-primary">Begin.</p>
    </motion.div>
  );
}

export default function FocusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("task");

  const [today, setToday] = useState<TodayData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"setup" | "countdown" | "focusing" | "complete">("setup");

  const [sound, setSound] = useState<SoundscapeId>("none");
  const [volume, setVolume] = useState(24);
  const [fade, setFade] = useState(true);
  const [soundOpen, setSoundOpen] = useState(false);

  const [quickCapture, setQuickCapture] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [savedThoughts, setSavedThoughts] = useState<string[]>([]);

  const [breakdown, setBreakdown] = useState<string[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [stuckText, setStuckText] = useState<string | null>(null);
  const [stuckLoading, setStuckLoading] = useState(false);

  const [sessionMinutes, setSessionMinutes] = useState(0);

  const {
    display,
    progress,
    state,
    sessions,
    focusElapsed,
    start,
    pause,
    resume,
    reset,
    addMinutes,
  } = useTimer(25 * 60, 5 * 60);

  useEffect(() => {
    const prefs = loadSoundPrefs();
    setSound(prefs.sound);
    setVolume(prefs.volume);
    setFade(prefs.fade);
    loadData();
  }, []);

  useEffect(() => {
    return () => soundscape.stop();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, tasksRes] = await Promise.all([
        analyticsApi.getToday(),
        tasksApi.list({ date: new Date().toISOString().split("T")[0] }),
      ]);
      setToday(todayRes.data);
      const pendingTasks = (tasksRes.data as Task[]).filter(
        (t) => t.status !== "done" && t.status !== "cancelled"
      );
      setTasks(pendingTasks);
      const preselect =
        pendingTasks.find((t) => String(t.id) === taskIdParam) ||
        pendingTasks[0] ||
        null;
      setSelectedTask(preselect);
    } catch {
      toast.error("Couldn't load today's plan");
    } finally {
      setLoading(false);
    }
  };

  const pickTask = useCallback(
    (task: Task) => {
      setSelectedTask(task);
      setBreakdown([]);
      setStuckText(null);
      reset();
    },
    [reset]
  );

  const beginFocus = () => {
    if (!selectedTask) return;
    soundscape.start(sound, volume, fade);
    setPhase("countdown");
  };

  const prevSessions = useRef(0);
  useEffect(() => {
    if (sessions > prevSessions.current && selectedTask) {
      prevSessions.current = sessions;
      const actual = Math.min(focusElapsed, selectedTask.duration_minutes || 25);
      focusApi
        .record({
          task_id: selectedTask.id,
          planned_minutes: selectedTask.duration_minutes || 25,
          actual_minutes: Math.max(1, Math.round(actual)),
          completed: true,
        })
        .catch(() => {});
    }
  }, [sessions, selectedTask, focusElapsed]);

  useEffect(() => {
    if (state === "idle" && phase === "focusing") {
      soundscape.stop();
      setSessionMinutes(Math.max(1, Math.round(focusElapsed / 60)));
      setPhase("complete");
      setBreakdown([]);
      setStuckText(null);
    }
  }, [state, phase, focusElapsed]);

  const finishSession = async () => {
    if (!selectedTask) return;
    try {
      const actual = Math.min(focusElapsed, selectedTask.duration_minutes || 25);
      await focusApi.record({
        task_id: selectedTask.id,
        planned_minutes: selectedTask.duration_minutes || 25,
        actual_minutes: Math.max(1, Math.round(actual)),
        completed: true,
      });
      await tasksApi.update(selectedTask.id, { status: "done" });
      setSessionMinutes(Math.max(1, Math.round(actual)));
      soundscape.stop();
      setPhase("complete");
    } catch {
      toast.error("Couldn't save completion");
    }
  };

  const exitToComplete = () => {
    soundscape.stop();
    setSessionMinutes(Math.max(1, Math.round(focusElapsed / 60)));
    setPhase("complete");
  };

  const saveThought = () => {
    const t = quickCapture.trim();
    if (!t) return;
    setSavedThoughts((prev) => [t, ...prev].slice(0, 20));
    setQuickCapture("");
    setCaptureOpen(false);
  };

  const breakDown = async () => {
    if (!selectedTask) return;
    setBreakdownLoading(true);
    try {
      const { data } = await aiCoachApi.breakdownTask({
        task_title: selectedTask.title,
        description: selectedTask.description,
      });
      const steps = parseBreakdown(data.response);
      setBreakdown(steps.length ? steps : ["Break the task into your own smaller steps."]);
    } catch {
      setBreakdown([]);
      toast.error("AI breakdown unavailable right now");
    } finally {
      setBreakdownLoading(false);
    }
  };

  const askStuck = async () => {
    if (!selectedTask) return;
    setStuckLoading(true);
    try {
      const { data } = await aiCoachApi.stuck({ task_title: selectedTask.title });
      setStuckText(data.response);
    } catch {
      setStuckText("Try the smallest possible version of this task for 5 minutes.");
    } finally {
      setStuckLoading(false);
    }
  };

  const changeSound = (s: SoundscapeId) => {
    setSound(s);
    saveSoundPrefs(s, volume, fade);
    if (phase === "focusing") soundscape.start(s, volume, fade);
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    saveSoundPrefs(sound, v, fade);
    soundscape.setVolume(v, 0.1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary/60" />
          <p className="text-sm text-muted-foreground">Preparing your space...</p>
        </div>
      </div>
    );
  }

  const chosenSound = SOUNDSCAPES.find((s) => s.id === sound);

  // ---------------- SETUP ----------------
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-sm text-muted-foreground">Focus Space</span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          {!selectedTask ? (
            <div className="text-center max-w-md">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Wind className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-light mb-2">Nothing planned for today</h1>
              <p className="text-muted-foreground text-sm mb-8">
                Add one small task, then come back here to focus on it.
              </p>
              <Button onClick={() => router.push("/tasks")}>Add a task</Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-md text-center"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                One task. Nothing else.
              </p>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground block mb-2">What are you working on?</label>
                <select
                  value={selectedTask.id}
                  onChange={(e) => {
                    const task = tasks.find((t) => t.id === Number(e.target.value));
                    if (task) pickTask(task);
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <h1 className="text-3xl font-light mb-2 max-w-md mx-auto">
                {selectedTask.title}
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                {selectedTask.is_deep_work
                  ? "Deep work — everything else can wait."
                  : "Work toward your goal — this is the next step."}
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setSoundOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-full px-4 py-2 transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                  {chosenSound?.label || "Silence"}
                </button>
                <span className="text-sm text-muted-foreground">
                  ~{selectedTask.duration_minutes || 25} min
                </span>
              </div>

              {soundOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card p-4 mb-8 text-left"
                >
                  <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {SOUNDSCAPES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => changeSound(s.id)}
                        className={`text-left text-sm rounded-lg px-3 py-2 transition-colors ${
                          sound === s.id
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {chosenSound?.description}
                  </p>
                  {chosenSound?.honestNote && (
                    <p className="text-xs text-muted-foreground/70 leading-relaxed mb-3">
                      {chosenSound.honestNote}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12">Volume</span>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={volume}
                      onChange={(e) => changeVolume(parseInt(e.target.value))}
                      className="flex-1 accent-primary"
                      aria-label="Sound volume"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
                  </div>
                </motion.div>
              )}

              <Button
                size="lg"
                onClick={beginFocus}
                className="w-full rounded-full py-6 text-base gap-2"
              >
                <Play className="h-5 w-5" />
                Enter Focus Space
              </Button>
            </motion.div>
          )}
        </main>
      </div>
    );
  }

  // ---------------- COUNTDOWN ----------------
  if (phase === "countdown") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <BreathCountdown
          onDone={() => {
            setPhase("focusing");
            start();
          }}
        />
      </div>
    );
  }

  // ---------------- FOCUSING ----------------
  if (phase === "focusing") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
            Focusing
          </p>

          <h1 className="text-2xl md:text-3xl font-light text-center mb-10 max-w-xl">
            {selectedTask?.title}
          </h1>

          <div className="relative w-72 h-72 md:w-80 md:h-80 mb-10">
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/15"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border border-primary/10"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke="hsl(var(--muted))" strokeWidth="1.5" />
              <circle
                cx="50%" cy="50%" r="45%" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl md:text-7xl font-extralight tracking-tight font-mono">
                {display}
              </span>
              <span className="text-xs text-muted-foreground mt-3 capitalize">
                {state === "running" ? "In flow" : state === "paused" ? "Paused" : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            {state === "paused" ? (
              <Button size="lg" onClick={resume} className="rounded-full px-8 gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={pause} className="rounded-full px-8 gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => addMinutes(5)} className="rounded-full gap-1.5">
              <Plus className="h-4 w-4" />
              5 min
            </Button>
            <Button size="lg" variant="ghost" onClick={exitToComplete} className="rounded-full text-muted-foreground">
              Finish
            </Button>
          </div>

          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <button
                onClick={() => setSoundOpen((o) => !o)}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Volume2 className="h-4 w-4" />
                {chosenSound?.label || "Silence"}
              </button>
              <span className="text-border">·</span>
              <button
                onClick={() => setCaptureOpen((o) => !o)}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Inbox className="h-4 w-4" />
                Save a thought
              </button>
              <span className="text-border">·</span>
              <button
                onClick={breakDown}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <ListRestart className="h-4 w-4" />
                Break down
              </button>
              <span className="text-border">·</span>
              <button
                onClick={askStuck}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                I&apos;m stuck
              </button>
            </div>

            {soundOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4 text-left"
              >
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {SOUNDSCAPES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => changeSound(s.id)}
                      className={`text-left text-sm rounded-lg px-3 py-2 transition-colors ${
                        sound === s.id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12">Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={volume}
                    onChange={(e) => changeVolume(parseInt(e.target.value))}
                    className="flex-1 accent-primary"
                    aria-label="Sound volume"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
                </div>
              </motion.div>
            )}

            {captureOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4 text-left"
              >
                <label className="text-xs text-muted-foreground block mb-2">
                  Something on your mind? Save it, then return to your task.
                </label>
                <div className="flex gap-2">
                  <input
                    value={quickCapture}
                    onChange={(e) => setQuickCapture(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveThought()}
                    placeholder="e.g. Research React Native later"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={saveThought}>
                    Save
                  </Button>
                </div>
                {savedThoughts.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {savedThoughts.map((t, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {breakdown.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4 text-left">
                <p className="text-sm font-medium mb-2">Small steps</p>
                <ol className="space-y-1.5">
                  {breakdown.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {stuckText && (
              <div className="rounded-2xl border border-border bg-card p-4 text-left">
                <p className="text-sm text-muted-foreground">{stuckText}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------------- COMPLETE ----------------
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-light mb-2">You showed up.</h1>
        <p className="text-muted-foreground mb-2">
          {sessionMinutes} minute{sessionMinutes !== 1 ? "s" : ""} of focused time.
        </p>
        {selectedTask && (
          <p className="text-sm text-muted-foreground mb-8">
            {selectedTask.title} — session complete.
          </p>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 mb-8 text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Recommended next step
          </p>
          <p className="text-foreground/90">
            Take a real break. Look away from the screen, stretch, drink some water.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/dashboard")} className="rounded-full py-5">
            Return to your day
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPhase("setup");
              reset();
            }}
            className="rounded-full text-muted-foreground"
          >
            Start another session
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
