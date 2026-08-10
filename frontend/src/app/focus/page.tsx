"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { tasksApi, analyticsApi, aiCoachApi } from "@/lib/api";
import { Task, TodayData } from "@/types";
import { useTimer } from "@/hooks/useTimer";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  ChevronLeft,
  Loader2,
  ListRestart,
  Brain,
  HelpCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

function parseBreakdown(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

export default function FocusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("task");

  const [today, setToday] = useState<TodayData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<string[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [stuckText, setStuckText] = useState<string | null>(null);
  const [stuckLoading, setStuckLoading] = useState(false);

  const {
    display,
    progress,
    state,
    sessions,
    start,
    pause,
    resume,
    reset,
    addMinutes,
  } = useTimer(25 * 60, 5 * 60);

  useEffect(() => {
    loadData();
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

  const finishSession = async () => {
    if (!selectedTask) return;
    try {
      await tasksApi.update(selectedTask.id, { status: "done" });
      toast.success("Task completed. Nice work.");
      router.push("/dashboard");
    } catch {
      toast.error("Couldn't save completion");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const goalContext = today?.mission || today?.has_active_goals
    ? "Work toward your goal — this task is the next step."
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 md:px-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Exit focus mode
        </button>
        <span className="text-sm font-medium">{sessions} session{sessions !== 1 ? "s" : ""} completed</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {!selectedTask ? (
          <div className="text-center max-w-md">
            <Brain className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Nothing planned for today</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Add one task to get started, then come back to focus on it.
            </p>
            <Button onClick={() => router.push("/tasks")}>
              Add a task
            </Button>
          </div>
        ) : (
          <>
            <div className="w-full max-w-md mb-6">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                What are you working on?
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedTask.id}
                  onChange={(e) => {
                    const task = tasks.find((t) => t.id === Number(e.target.value));
                    if (task) pickTask(task);
                  }}
                  className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {today?.mission || "Your priority task for today"}
              </p>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 max-w-xl">
              {selectedTask.title}
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              {selectedTask.is_deep_work
                ? "Deep work — everything else can wait."
                : goalContext}
            </p>

            <div className="relative w-52 h-52 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold font-mono tracking-wider">{display}</span>
                <span className="text-xs text-muted-foreground mt-2 capitalize">
                  {state === "idle" ? "Ready" : state === "running" ? "Focusing" : "Paused"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {(state === "idle" || state === "paused") && (
                <Button size="lg" onClick={state === "paused" ? resume : start} className="gap-2 min-w-[140px]">
                  <Play className="h-4 w-4" />
                  {state === "paused" ? "Resume" : "Start focus"}
                </Button>
              )}
              {state === "running" && (
                <Button size="lg" variant="secondary" onClick={pause} className="gap-2 min-w-[140px]">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              {(state === "idle" || state === "running") && (
                <Button size="lg" variant="outline" onClick={() => addMinutes(5)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  +5 min
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={reset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="w-full max-w-md space-y-3 mb-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={breakDown}
                  disabled={breakdownLoading}
                >
                  {breakdownLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListRestart className="h-4 w-4" />}
                  Break into steps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={askStuck}
                  disabled={stuckLoading}
                >
                  {stuckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4" />}
                  I&apos;m stuck
                </Button>
              </div>

              {breakdown.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
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
                <div className="rounded-lg border bg-card p-4 flex gap-3">
                  <Brain className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{stuckText}</p>
                    <button
                      onClick={() => setStuckText(null)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
                    >
                      <X className="h-3 w-3" />
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={finishSession} className="gap-2 min-w-[200px]">
              <Check className="h-4 w-4" />
              Finish session
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
