"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tasksApi } from "@/lib/api";
import { Task } from "@/types";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  Play,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  CalendarClock,
} from "lucide-react";
import toast from "react-hot-toast";

const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

function TaskItem({
  task,
  onToggle,
  onDelete,
  onFocus,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
  onFocus: (t: Task) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-colors">
      <button
        onClick={() => onToggle(task)}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label={`Mark ${task.title} as ${task.status === "done" ? "not done" : "done"}`}
      >
        {task.status === "done" ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${
            task.status === "done" ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {task.duration_minutes || 25}m
          {task.is_deep_work ? " · deep work" : ""}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onFocus(task)} className="gap-1.5 shrink-0">
        <Play className="h-3.5 w-3.5" />
        Focus
      </Button>
      <button
        onClick={() => onDelete(task)}
        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
        aria-label={`Delete ${task.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    priority: "high",
    date: new Date().toISOString().split("T")[0],
    duration_minutes: 25,
    is_deep_work: false,
  });

  const load = async () => {
    try {
      const { data } = await tasksApi.list();
      setTasks(data);
    } catch {
      toast.error("Couldn't load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const todayTasks = tasks
    .filter((t) => t.date === todayStr)
    .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
  const upcomingTasks = tasks
    .filter((t) => t.date && t.date > todayStr)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const postponedTasks = tasks
    .filter((t) => t.date && t.date < todayStr && t.status !== "done")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const toggle = async (task: Task) => {
    try {
      const next = task.status === "done" ? "todo" : "done";
      await tasksApi.update(task.id, { status: next });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    } catch {
      toast.error("Couldn't update task");
    }
  };

  const remove = async (task: Task) => {
    try {
      await tasksApi.delete(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Task removed");
    } catch {
      toast.error("Couldn't remove task");
    }
  };

  const create = async () => {
    setSubmitting(true);
    try {
      await tasksApi.create(form);
      setShowAdd(false);
      setForm({ ...form, title: "" });
      load();
      toast.success("Task added");
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

  const sections = [
    { title: "Today", items: todayTasks },
    { title: "Overdue", items: postponedTasks, warn: true },
    { title: "Upcoming", items: upcomingTasks },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">Your plan, in one place</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <CalendarClock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No tasks yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your most important task for today — start with one.
              </p>
              <Button onClick={() => setShowAdd(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add your first task
              </Button>
            </div>
          ) : (
            sections.map(
              (section) =>
                section.items.length > 0 && (
                  <div key={section.title} className="mb-4 last:mb-0">
                    <p
                      className={`text-xs uppercase tracking-wide mb-1.5 ${
                        section.warn ? "text-amber-500" : "text-muted-foreground"
                      }`}
                    >
                      {section.title} ({section.items.length})
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggle}
                          onDelete={remove}
                          onFocus={(t) => router.push(`/focus?task=${t.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )
            )
          )}
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add task">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1 block">Task</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="What needs to get done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="urgent">Must do — today</option>
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
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: parseInt(e.target.value) || 25 })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={form.is_deep_work}
              onChange={(e) => setForm({ ...form, is_deep_work: e.target.checked })}
            />
            <span className="text-sm">Deep work session</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !form.title.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add task
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
