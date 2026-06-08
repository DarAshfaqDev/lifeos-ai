"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analyticsApi, habitsApi } from "@/lib/api";
import { Brain, Ban, Clock, TrendingDown, Target, Zap, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AntiProcrastinationPage() {
  const [data, setData] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [consistency, setConsistency] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dash, habitsRes, consistRes] = await Promise.all([
        analyticsApi.getDashboard(),
        habitsApi.list(),
        analyticsApi.getHabitConsistency(14),
      ]);
      setData(dash.data);
      setHabits(habitsRes.data);
      setConsistency(consistRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await habitsApi.log({ habit_id: habitId, date: today });
      toast.success("Logged!");
      loadData();
    } catch {
      toast.error("Failed to log habit");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Focus & Anti-Procrastination</h1>
          <p className="text-muted-foreground text-sm">Build habits and eliminate distractions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{data?.focus_score || 0}%</p>
            <p className="text-xs text-muted-foreground">Focus Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{data?.habit_streak_count || 0}</p>
            <p className="text-xs text-muted-foreground">Active Habits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{data?.deep_work_hours_this_week || 0}h</p>
            <p className="text-xs text-muted-foreground">Deep Work (Week)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{consistency.filter((c: any) => c.completion_rate > 70).length}</p>
            <p className="text-xs text-muted-foreground">Strong Habits</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Today's Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No habits yet. Create one to start tracking.
                </p>
              ) : (
                habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        habit.streak > 0 ? "bg-green-500 border-green-500" : "border-muted-foreground"
                      }`}>
                        {habit.streak > 0 && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{habit.title}</p>
                        <p className="text-xs text-muted-foreground">{habit.description || habit.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-orange-500">🔥 {habit.streak}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-4 w-4 text-primary" />
              Distraction Killers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Phone Scrolling", solution: "Keep phone in another room during work blocks", icon: "📱" },
                { name: "YouTube", solution: "Use Unhook extension to remove recommendations", icon: "▶️" },
                { name: "Social Media", solution: "Schedule 2x 10-min checks per day only", icon: "📱" },
                { name: "Perfectionism", solution: "Apply the 80% rule - done is better than perfect", icon: "🎯" },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Habit Consistency (Last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consistency}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="habit" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-muted-foreground" unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="completion_rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
