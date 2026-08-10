"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analyticsApi, tasksApi } from "@/lib/api";
import { TodayData, Task } from "@/types";
import { Modal } from "@/components/ui/modal";
import {
  Target,
  Play,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Loader2,
  Flag,
  CalendarClock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (task: Task) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-colors">
      <button
        onClick={() => onToggle(task)}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label={`Mark ${task.title} as done`}
      >
        {task.status === "done" ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <span
        className={`flex-1 text-sm ${
          task.status === "done" ? "line-through text-muted-foreground" : ""
        }`}
      >
        {task.title}
      </span>
      <span className="text-xs text-muted-foreground shrink-0">
        {task.duration_minutes || 25}m
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [today, setToday] = useState<TodayData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "high",
    date: new Date().toISOString().split("T")[0],
    duration_minutes: 25,
    is_deep_work: false,
  });

  const loadData = async () => {
    try {
      const [todayRes, tasksRes] = await Promise.all([
        analyticsApi.getToday(),
        tasksApi.list({ date: new Date().toISOString().split("T")[0] }),
      ]);
      setToday(todayRes.data);
      setTasks(tasksRes.data);
    } catch {
      toast.error("Couldn't load your day");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTask = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    try {
      await tasksApi.update(task.id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      loadData();
    } catch {
      toast.error("Couldn't update task");
    }
  };

  const createQuickTask = async () => {
    setSubmitting(true);
    try {
      await tasksApi.create(taskForm);
      toast.success("Task added to today");
      setShowQuickTask(false);
      setTaskForm({
        title: "",
        priority: "high",
        date: new Date().toISOString().split("T")[0],
        duration_minutes: 25,
        is_deep_work: false,
      });
      loadData();
    } catch {
      toast.error("Couldn't add task");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const nextAction = today?.next_action;
  const plan = today?.plan || { must_do: [], should_do: [], optional: [] };
  const pendingTasks = tasks.filter((t) => t.status !== "done");

  const grouped = {
    must_do: tasks.filter(
      (t) => t.status !== "done" && (t.priority === "urgent" || t.priority === "high")
    ),
    should_do: tasks.filter(
      (t) => t.status !== "done" && t.priority === "medium"
    ),
    optional: tasks.filter((t) => t.status !== "done" && t.priority === "low"),
  };

  const sectionGroups: { key: keyof typeof grouped; label: string; accent?: string }[] = [
    { key: "must_do", label: "Must do", accent: "text-red-500" },
    { key: "should_do", label: "Should do" },
    { key: "optional", label: "Optional" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {today?.greeting_name || "there"}.
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {today?.procrastination && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{today.procrastination.message}</p>
          </div>
        </div>
      )}

      {today?.recovery && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <CalendarClock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{today.recovery.message}</p>
            <button
              onClick={() => router.push("/tasks")}
              className="mt-1.5 text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Review old tasks <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {!today?.has_active_goals && !pendingTasks.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Set one goal to begin</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Choose one thing you want to improve or achieve, and LifeOS will
              turn it into a realistic plan you can act on today.
            </p>
            <Button onClick={() => router.push("/career-planner")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create my first goal
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {today?.mission && (
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Today&apos;s mission
            </p>
            <p className="text-lg font-medium">{today.mission}</p>
          </CardContent>
        </Card>
      )}

      {nextAction && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Your next action
              </p>
              <Flag className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-semibold mb-1">{nextAction.title}</p>
            {nextAction.reason && (
              <p className="text-sm text-muted-foreground mb-1">
                {nextAction.reason}
              </p>
            )}
            {nextAction.scaled_suggestion && (
              <p className="text-sm text-amber-600 mb-3">
                {nextAction.scaled_suggestion}
              </p>
            )}
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                ~{nextAction.duration_minutes}m
              </span>
              {today?.focus_stats && (
                <span className="inline-flex items-center gap-1">
                  {today.focus_stats.today_minutes}m focused today
                </span>
              )}
            </div>
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => router.push(`/focus?task=${nextAction.id}`)}
            >
              <Play className="h-5 w-5" />
              Start focus session
            </Button>
          </CardContent>
        </Card>
      )}

      {!nextAction && pendingTasks.length > 0 && (
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              All planned tasks are done. Add your next most important task.
            </p>
            <Button onClick={() => setShowQuickTask(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Focus score</p>
              <span className="text-2xl font-bold">{today?.focus_score || 0}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                style={{ width: `${today?.focus_score || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {today?.focus_explanation ||
                "Your focus score is a guide, not a judgment."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium mb-2">Today so far</p>
            <p className="text-3xl font-bold">
              {today?.tasks_today.completed || 0}
              <span className="text-base text-muted-foreground font-normal">
                {" "}/ {today?.tasks_today.total || 0} tasks done
              </span>
            </p>
            <button
              onClick={() => router.push("/focus")}
              className="mt-3 text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Open focus mode <ChevronRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Today&apos;s plan</p>
            <Button variant="outline" size="sm" onClick={() => setShowQuickTask(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add task
            </Button>
          </div>

          {pendingTasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nothing scheduled. Add one important task and start it.
            </p>
          )}

          {sectionGroups.map((group) => {
            const items = grouped[group.key];
            if (!items.length) return null;
            return (
              <div key={group.key} className="mb-3 last:mb-0">
                <p className={`text-xs uppercase tracking-wide mb-1.5 ${group.accent || "text-muted-foreground"}`}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {today && !today.onboarding_completed && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Personalize your system</p>
              <p className="text-xs text-muted-foreground mb-3">
                Tell us your goal and available time so LifeOS can plan realistically.
              </p>
              <Button size="sm" onClick={() => router.push("/onboarding")}>
                Get started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal open={showQuickTask} onClose={() => setShowQuickTask(false)} title="Add a task for today">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createQuickTask();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1 block">Task</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="What needs to get done?"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="high">Must do</option>
                <option value="medium">Should do</option>
                <option value="low">Optional</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Minutes</label>
              <input
                type="number"
                min={5}
                max={240}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={taskForm.duration_minutes}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, duration_minutes: parseInt(e.target.value) || 25 })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={taskForm.is_deep_work}
              onChange={(e) => setTaskForm({ ...taskForm, is_deep_work: e.target.checked })}
            />
            <span className="text-sm">Deep work session</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !taskForm.title.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add task
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowQuickTask(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
