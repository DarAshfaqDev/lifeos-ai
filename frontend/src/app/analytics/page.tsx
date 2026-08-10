"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Clock, Target, Brain } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [studyData, setStudyData] = useState<any[]>([]);
  const [habitData, setHabitData] = useState<any[]>([]);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dash, trendsRes, studyRes, habitRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getTrends(30),
        analyticsApi.getStudyHours(),
        analyticsApi.getHabitConsistency(30),
      ]);
      setDashData(dash.data);
      setTrends(trendsRes.data);
      setStudyData(studyRes.data);
      setHabitData(habitRes.data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;

  const completedTotal = trends.reduce((a: number, t: any) => a + (t.tasks_completed || 0), 0);
  const scoredDays = trends.filter((t: any) => t.tasks_completed > 0);
  const avgScore = scoredDays.length
    ? Math.round(scoredDays.reduce((a: number, t: any) => a + t.score, 0) / scoredDays.length)
    : 0;
  const dayScores: Record<string, number[]> = {};
  trends.forEach((t: any) => {
    const day = new Date(t.date).toLocaleDateString("en-US", { weekday: "long" });
    (dayScores[day] = dayScores[day] || []).push(t.score || 0);
  });
  let bestDay = null;
  let bestAvg = -1;
  Object.entries(dayScores).forEach(([day, scores]) => {
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = day;
    }
  });

  const insights: string[] = [];
  if (scoredDays.length) {
    insights.push(`You completed ${completedTotal} task${completedTotal !== 1 ? "s" : ""} in the last 30 days (${avgScore}% average completion).`);
  }
  if (bestDay && bestAvg > 0) {
    insights.push(`Your most productive day of the week is ${bestDay}.`);
  }
  if ((dashData?.focus_score || 0) >= 70) {
    insights.push("Your focus score is high — keep the same pace.");
  }
  if (!scoredDays.length) {
    insights.push("No completed tasks yet. Complete your first task to start seeing insights.");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Track your performance and progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              30-Day Productivity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#3B82F6" fillOpacity={1} fill="url(#colorP)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Study Hours by Skill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#10B981" radius={[4, 4, 0, 0]} />
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
              <Brain className="h-4 w-4 text-primary" />
              Habit Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" unit="%" />
                  <YAxis dataKey="habit" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="completion_rate" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border text-center">
                <p className="text-sm text-muted-foreground">Focus Score</p>
                <p className="text-3xl font-bold text-blue-500">{dashData?.focus_score || 0}%</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center">
                <p className="text-sm text-muted-foreground">Productivity</p>
                <p className="text-3xl font-bold text-green-500">{dashData?.productivity_score || 0}%</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center">
                <p className="text-sm text-muted-foreground">Deep Work</p>
                <p className="text-3xl font-bold text-purple-500">{dashData?.deep_work_hours_this_week || 0}h</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center">
                <p className="text-sm text-muted-foreground">Goal Progress</p>
                <p className="text-3xl font-bold text-orange-500">{dashData?.goal_progress || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              What your data says
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-muted-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
