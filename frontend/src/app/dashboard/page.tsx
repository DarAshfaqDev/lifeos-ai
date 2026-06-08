"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analyticsApi, tasksApi, habitsApi } from "@/lib/api";
import { DashboardData, Task, Habit } from "@/types";
import { Modal } from "@/components/ui/modal";
import {
  CheckCircle2,
  Clock,
  Target,
  Brain,
  BookOpen,
  TrendingUp,
  Zap,
  ListTodo,
  Flame,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [studyData, setStudyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", priority: "medium", date: new Date().toISOString().split("T")[0], duration_minutes: 25, is_deep_work: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, tasksRes, habitsRes, trendsRes, studyRes] = await Promise.all([
        analyticsApi.getDashboard(),
        tasksApi.list({ date: new Date().toISOString().split("T")[0] }),
        habitsApi.list(),
        analyticsApi.getTrends(14),
        analyticsApi.getStudyHours(),
      ]);
      setData(dashRes.data);
      setTasks(tasksRes.data);
      setHabits(habitsRes.data);
      setTrends(trendsRes.data);
      setStudyData(studyRes.data);
    } catch (err) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const statsCards = [
    {
      title: "Focus Score",
      value: `${data?.focus_score || 0}%`,
      icon: Brain,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Productivity",
      value: `${data?.productivity_score || 0}%`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Tasks Today",
      value: `${data?.tasks_today.completed || 0}/${data?.tasks_today.total || 0}`,
      icon: CheckCircle2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Deep Work",
      value: `${data?.deep_work_hours_this_week || 0}h`,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowQuickTask(true)}>
          <Plus className="h-4 w-4" />
          Quick Task
        </Button>
      </div>

      <Modal open={showQuickTask} onClose={() => setShowQuickTask(false)} title="Quick Task">
        <form onSubmit={async (e) => {
          e.preventDefault(); setSubmitting(true);
          try {
            await tasksApi.create(taskForm);
            toast.success("Task added");
            setShowQuickTask(false);
            setTaskForm({ title: "", priority: "medium", date: new Date().toISOString().split("T")[0], duration_minutes: 25, is_deep_work: false });
            loadData();
          } catch { toast.error("Failed to create task"); }
          finally { setSubmitting(false); }
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Task Title</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="What do you need to do?" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Duration (min)</label>
              <input type="number" min={5} max={240} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={taskForm.duration_minutes} onChange={(e) => setTaskForm({ ...taskForm, duration_minutes: parseInt(e.target.value) || 25 })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <input type="date" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={taskForm.date} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={taskForm.is_deep_work} onChange={(e) => setTaskForm({ ...taskForm, is_deep_work: e.target.checked })} />
            <span className="text-sm">Deep work session</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !taskForm.title.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Task
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowQuickTask(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Productivity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks for today. Add one to get started!
                </p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                  >
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                        task.status === "done"
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground hover:border-primary"
                      }`}
                    >
                      {task.status === "done" && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm ${
                        task.status === "done" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.is_deep_work && (
                      <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full">
                        Deep Work
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              Today's Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No habits tracked yet. Start building one!
                </p>
              ) : (
                habits.slice(0, 5).map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/5">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{habit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {habit.streak} day streak
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className={`h-4 w-4 ${habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{habit.streak}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Career Goal</span>
                <span className="text-sm font-medium">{data?.goal_progress || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                  style={{ width: `${data?.goal_progress || 0}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Learning Hours</span>
                <span className="text-sm font-medium">{data?.total_learning_hours || 0}h</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                  style={{ width: `${Math.min((data?.total_learning_hours || 0) / 100 * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
