"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { tasksApi, aiCoachApi, focusApi } from "@/lib/api";
import { Task } from "@/types";
import { useTimer, TimerType } from "@/hooks/useTimer";
import {
  SOUNDSCAPES,
  SoundscapeId,
  soundscape,
  loadSoundPrefs,
  saveSoundPrefs,
} from "@/lib/soundscapes";
import {
  DURATION_OPTIONS,
  loadFocusPrefs,
  saveFocusPrefs,
  loadFocusSnapshot,
  saveFocusSnapshot,
  clearFocusSnapshot,
  elapsedFromSnapshot,
  FocusSnapshot,
} from "@/lib/focusPrefs";
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
  Coffee,
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

const TIMER_TYPES: { id: TimerType; label: string; hint: string }[] = [
  { id: "countdown", label: "Countdown", hint: "Sets a clear end time." },
  { id: "countup", label: "Count up", hint: "Tracks how long you actually focused." },
  { id: "open", label: "No limit", hint: "Stay until you naturally stop." },
];

export default function FocusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("task");
  const autoStart = searchParams.get("start") === "1";

  const initialPrefs = loadFocusPrefs();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"setup" | "recover" | "countdown" | "focusing" | "complete" | "break">("setup");

  const [sound, setSound] = useState<SoundscapeId>(initialPrefs.sound);
  const [volume, setVolume] = useState(initialPrefs.volume);
  const [fade, setFade] = useState(initialPrefs.fade);
  const [soundOpen, setSoundOpen] = useState(false);

  const [duration, setDuration] = useState(initialPrefs.durationMinutes);
  const [timerType, setTimerType] = useState<TimerType>(initialPrefs.timerType);
  const [avgMinutes, setAvgMinutes] = useState<number | null>(null);

  const [quickCapture, setQuickCapture] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [savedThoughts, setSavedThoughts] = useState<string[]>([]);

  const THOUGHTS_KEY = "lifeos_captured_thoughts";

  const [breakdown, setBreakdown] = useState<string[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [stuckText, setStuckText] = useState<string | null>(null);
  const [stuckLoading, setStuckLoading] = useState(false);

  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [recovery, setRecovery] = useState<FocusSnapshot | null>(null);

  const [breakMinutes, setBreakMinutes] = useState(10);
  const [breakLeft, setBreakLeft] = useState(0);
  const [breakSound, setBreakSound] = useState<SoundscapeId>("ocean");

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
    setDuration: setTimerDuration,
    setTimerType: setTimerTypeHook,
    restore,
  } = useTimer(initialPrefs.durationMinutes * 60, 5 * 60, initialPrefs.timerType);

  const prefersReduced = useRef(false);
  useEffect(() => {
    prefersReduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const prefs = loadSoundPrefs();
    setSound(prefs.sound);
    setVolume(prefs.volume);
    setFade(prefs.fade);
    try {
      const stored = JSON.parse(localStorage.getItem(THOUGHTS_KEY) || "[]");
      if (Array.isArray(stored)) setSavedThoughts(stored.filter((t) => typeof t === "string").slice(0, 20));
    } catch {}
    loadData();
  }, []);

  useEffect(() => {
    return () => soundscape.stop();
  }, []);

  useEffect(() => {
    setTimerDuration("focus", duration * 60);
  }, [duration, setTimerDuration]);

  const loadData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        tasksApi.list({ date: new Date().toISOString().split("T")[0] }),
        focusApi.stats().catch(() => null),
      ]);
      const pendingTasks = (tasksRes.data as Task[]).filter(
        (t) => t.status !== "done" && t.status !== "cancelled"
      );
      setTasks(pendingTasks);
      const preselect =
        pendingTasks.find((t) => String(t.id) === taskIdParam) ||
        pendingTasks[0] ||
        null;
      setSelectedTask(preselect);

      const avg = statsRes?.data?.avg_session_minutes;
      if (typeof avg === "number" && avg > 0) {
        setAvgMinutes(avg);
        if (preselect && !preselect.duration_minutes && initialPrefs.durationMinutes === 25 && avg !== 25) {
          const closest = DURATION_OPTIONS.reduce((a, b) =>
            Math.abs(b - avg) < Math.abs(a - avg) ? b : a
          );
          setDuration(closest);
        }
      }

      const snap = loadFocusSnapshot();
      if (
        snap &&
        pendingTasks.some((t) => String(t.id) === String(snap.taskId)) &&
        elapsedFromSnapshot(snap) <= Math.max(snap.plannedMinutes * 60, 3 * 60 * 60)
      ) {
        setRecovery(snap);
        setPhase("recover");
      } else if (autoStart && preselect) {
        beginFocus(preselect);
      } else if (snap) {
        clearFocusSnapshot();
      }
    } catch {
      toast.error("Couldn't load today's plan");
    } finally {
      setLoading(false);
    }
  };

  const savePrefs = useCallback(() => {
    saveFocusPrefs({ timerType, durationMinutes: duration, sound, volume, fade });
  }, [timerType, duration, sound, volume, fade]);

  const pickTask = useCallback(
    (task: Task) => {
      setSelectedTask(task);
      setBreakdown([]);
      setStuckText(null);
      reset();
    },
    [reset]
  );

  const beginFocus = (task?: Task) => {
    const target = task ?? selectedTask;
    if (!target) return;
    soundscape.start(sound, volume, fade);
    savePrefs();
    setPhase("countdown");
  };

  const enterFocusing = useCallback(() => {
    if (!selectedTask) return;
    saveFocusSnapshot({
      taskId: selectedTask.id,
      taskTitle: selectedTask.title,
      startedAt: Date.now(),
      plannedMinutes: duration,
      sound,
      volume,
      fade,
      timerType,
    });
    setPhase("focusing");
    start();
  }, [selectedTask, duration, sound, volume, fade, timerType, start]);

  const prevSessions = useRef(0);
  useEffect(() => {
    if (sessions > prevSessions.current && selectedTask) {
      prevSessions.current = sessions;
      clearFocusSnapshot();
      const actual = Math.min(focusElapsed, duration);
      focusApi
        .record({
          task_id: selectedTask.id,
          planned_minutes: duration,
          actual_minutes: Math.max(1, Math.round(actual)),
          completed: true,
        })
        .catch(() => {});
    }
  }, [sessions, selectedTask, focusElapsed, duration]);

  useEffect(() => {
    if (state === "idle" && phase === "focusing") {
      soundscape.stop();
      clearFocusSnapshot();
      setSessionMinutes(Math.max(1, Math.round(focusElapsed / 60)));
      setPhase("complete");
      setBreakdown([]);
      setStuckText(null);
    }
  }, [state, phase, focusElapsed]);

  const finishSession = async () => {
    if (!selectedTask) return;
    try {
      const actual = Math.min(focusElapsed, duration);
      await focusApi.record({
        task_id: selectedTask.id,
        planned_minutes: duration,
        actual_minutes: Math.max(1, Math.round(actual)),
        completed: true,
      });
      setSessionMinutes(Math.max(1, Math.round(actual)));
      clearFocusSnapshot();
      soundscape.stop();
      setPhase("complete");
    } catch {
      toast.error("Couldn't save the session");
    }
  };

  const markTaskDone = async () => {
    if (!selectedTask) return;
    try {
      await tasksApi.update(selectedTask.id, { status: "done" });
      toast.success("Task marked done");
    } catch {
      toast.error("Couldn't update the task");
    }
  };

  const continueRecovery = () => {
    if (!recovery) return;
    const task = tasks.find((t) => String(t.id) === String(recovery.taskId));
    if (task) {
      setSelectedTask(task);
      setBreakdown([]);
      setStuckText(null);
    }
    setSound(recovery.sound);
    setVolume(recovery.volume);
    setFade(recovery.fade);
    setDuration(recovery.plannedMinutes);
    setTimerType(recovery.timerType);
    setTimerDuration("focus", recovery.plannedMinutes * 60);
    setTimerTypeHook(recovery.timerType);
    soundscape.start(recovery.sound, recovery.volume, recovery.fade);
    const elapsed = elapsedFromSnapshot(recovery);
    setSessionMinutes(Math.max(1, Math.round(elapsed / 60)));
    setPhase("focusing");
    restore(elapsed);
  };

  const finishRecovery = async () => {
    if (!recovery) return;
    try {
      const elapsed = elapsedFromSnapshot(recovery);
      await focusApi.record({
        task_id: recovery.taskId,
        planned_minutes: recovery.plannedMinutes,
        actual_minutes: Math.max(1, Math.round(Math.min(elapsed / 60, recovery.plannedMinutes))),
        completed: true,
      });
      setSelectedTask(
        tasks.find((t) => String(t.id) === String(recovery.taskId)) || null
      );
      setSessionMinutes(Math.max(1, Math.round(Math.min(elapsed / 60, recovery.plannedMinutes))));
    } catch {
      toast.error("Couldn't save the finished session");
    } finally {
      clearFocusSnapshot();
      soundscape.stop();
      setPhase("complete");
    }
  };

  const discardRecovery = () => {
    clearFocusSnapshot();
    setRecovery(null);
    setPhase("setup");
  };

  // Break timer
  useEffect(() => {
    if (phase === "break") setBreakLeft(breakMinutes * 60);
  }, [phase, breakMinutes]);

  useEffect(() => {
    if (phase !== "break" || breakLeft <= 0) return;
    const t = setTimeout(() => setBreakLeft((b) => b - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, breakLeft]);

  useEffect(() => {
    if (phase === "break" && breakLeft === 0) {
      soundscape.stop();
    }
  }, [phase, breakLeft]);

  const startBreak = (minutes: number, withSound: boolean) => {
    setBreakMinutes(minutes);
    if (withSound) soundscape.start(breakSound, Math.min(volume, 40), true);
    setPhase("break");
  };

  const saveThought = () => {
    const t = quickCapture.trim();
    if (!t) return;
    setSavedThoughts((prev) => {
      const next = [t, ...prev].slice(0, 20);
      try {
        localStorage.setItem(THOUGHTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
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

  // ---------------- RECOVER ----------------
  if (phase === "recover" && recovery) {
    const elapsed = elapsedFromSnapshot(recovery);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md text-center"
        >
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wind className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-light mb-2">Focus was paused.</h1>
          <p className="text-muted-foreground mb-6">
            You were working on <span className="text-foreground">{recovery.taskTitle}</span> for{" "}
            {Math.max(1, Math.round(elapsed / 60))} minute
            {Math.max(1, Math.round(elapsed / 60)) !== 1 ? "s" : ""}.
          </p>
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={continueRecovery} className="rounded-full py-5 gap-2">
              <Play className="h-4 w-4" />
              Continue where I left off
            </Button>
            <Button size="lg" variant="outline" onClick={finishRecovery} className="rounded-full py-5">
              Mark as done
            </Button>
            <Button variant="ghost" onClick={discardRecovery} className="rounded-full text-muted-foreground">
              Start over
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
              <p className="text-sm text-muted-foreground mb-6">
                {selectedTask.is_deep_work
                  ? "Deep work — everything else can wait."
                  : "Work toward your goal — this is the next step."}
              </p>

              <div className="mb-5">
                <label className="text-xs text-muted-foreground block mb-2">How long?</label>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {DURATION_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setDuration(m)}
                      className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                        duration === m
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                {avgMinutes && avgMinutes > 0 && avgMinutes !== duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sessions you actually finish run about {avgMinutes} min.
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground block mb-2">Timer style</label>
                <div className="grid grid-cols-3 gap-1.5 max-w-sm mx-auto">
                  {TIMER_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTimerType(t.id);
                        setTimerTypeHook(t.id);
                      }}
                      title={t.hint}
                      className={`px-2 py-2 rounded-lg text-sm border transition-colors ${
                        timerType === t.id
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setSoundOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-full px-4 py-2 transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                  {chosenSound?.label || "Silence"}
                </button>
                <span className="text-sm text-muted-foreground">
                  {timerType === "countdown" ? `~${duration} min` : timerType === "countup" ? "Count up" : "No limit"}
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
                onClick={() => beginFocus()}
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
            enterFocusing();
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
            {!prefersReduced.current && (
              <>
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
              </>
            )}
            {prefersReduced.current && (
              <div className="absolute inset-0 rounded-full border border-primary/15" />
            )}
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
            {timerType === "countdown" && (
              <Button size="lg" variant="outline" onClick={() => addMinutes(5)} className="rounded-full gap-1.5">
                <Plus className="h-4 w-4" />
                5 min
              </Button>
            )}
            <Button size="lg" variant="ghost" onClick={finishSession} className="rounded-full text-muted-foreground">
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

  // ---------------- BREAK ----------------
  if (phase === "break") {
    const bm = Math.floor(breakLeft / 60);
    const bs = breakLeft % 60;
    const breakDisplay = `${bm.toString().padStart(2, "0")}:${bs.toString().padStart(2, "0")}`;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md text-center"
        >
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Coffee className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-light mb-2">Take a real break.</h1>
          <p className="text-muted-foreground mb-8">
            Step away from the screen. Stretch, drink some water, look out a window.
          </p>

          <div className="rounded-2xl border border-border bg-card p-8 mb-8">
            <p className="text-6xl md:text-7xl font-extralight font-mono">{breakDisplay}</p>
            <p className="text-xs text-muted-foreground mt-3">
              {breakLeft > 0 ? "No metrics. Just a pause." : "Break done."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {[5, 10, 20].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setBreakMinutes(m);
                  setBreakLeft(m * 60);
                }}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  breakMinutes === m
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m} min
              </button>
            ))}
            <button
              onClick={() => {
                if (soundscape.isRunning()) soundscape.stop();
                else soundscape.start(breakSound, Math.min(volume, 40), true);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                soundscape.isRunning()
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              {soundscape.isRunning() ? "Sound on" : "Sound"}
            </button>
          </div>

          {breakLeft > 0 ? (
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="rounded-full text-muted-foreground"
            >
              Skip break
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                soundscape.stop();
                router.push("/dashboard");
              }}
              className="rounded-full py-5"
            >
              Return to your day
            </Button>
          )}
        </motion.div>
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
            What&apos;s next
          </p>
          <p className="text-foreground/90">
            Take a short break, then return when you&apos;re ready. Rest is part of doing good work.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => startBreak(10, true)} className="rounded-full py-5 gap-2">
            <Coffee className="h-5 w-5" />
            Take a 10-minute break
          </Button>
          <Button
            onClick={markTaskDone}
            variant="outline"
            className="rounded-full py-5"
          >
            <Check className="h-4 w-4" />
            Mark as done
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="ghost" className="rounded-full py-5 text-muted-foreground">
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
