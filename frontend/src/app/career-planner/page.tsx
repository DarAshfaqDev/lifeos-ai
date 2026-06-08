"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { goalsApi } from "@/lib/api";
import { Goal } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Target, Plus, Briefcase, TrendingUp, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CareerPlannerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", description: "", category: "career", target_hours: 50 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data } = await goalsApi.list();
      setGoals(data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const careerGoals = goals.filter((g) => g.category === "career");
  const learningGoals = goals.filter((g) => g.category === "learning");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Career Planner</h1>
          <p className="text-muted-foreground text-sm">Define your career path and track progress</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewGoal(true)}>
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      <Modal open={showNewGoal} onClose={() => setShowNewGoal(false)} title="New Goal">
        <form onSubmit={async (e) => {
          e.preventDefault(); setSubmitting(true);
          try {
            await goalsApi.create(goalForm);
            toast.success("Goal created");
            setShowNewGoal(false);
            setGoalForm({ title: "", description: "", category: "career", target_hours: 50 });
            const { data } = await goalsApi.list();
            setGoals(data);
          } catch { toast.error("Failed to create goal"); }
          finally { setSubmitting(false); }
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Goal Title</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Get a Data Analyst job" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]" placeholder="What does this goal involve?" value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={goalForm.category} onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}>
                <option value="career">Career</option>
                <option value="learning">Learning</option>
                <option value="finance">Finance</option>
                <option value="health">Health</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target Hours</label>
              <input type="number" min={1} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={goalForm.target_hours} onChange={(e) => setGoalForm({ ...goalForm, target_hours: parseInt(e.target.value) || 50 })} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !goalForm.title.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowNewGoal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{careerGoals.length}</p>
                <p className="text-sm text-muted-foreground">Career Goals</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${careerGoals.length > 0 ? Math.round(careerGoals.reduce((a, g) => a + g.progress, 0) / careerGoals.length) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{learningGoals.length}</p>
                <p className="text-sm text-muted-foreground">Learning Goals</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${learningGoals.length > 0 ? Math.round(learningGoals.reduce((a, g) => a + g.progress, 0) / learningGoals.length) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goals.length}</p>
                <p className="text-sm text-muted-foreground">Total Goals</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Career Roadmap</CardTitle>
          <CardDescription>Your path to becoming a Data Analyst</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { step: 1, title: "Master SQL & Excel", duration: "2-3 weeks", status: "in_progress", skills: ["SQL Joins", "Subqueries", "Pivot Tables"] },
              { step: 2, title: "Learn Python for Data Analysis", duration: "3-4 weeks", status: "pending", skills: ["Pandas", "NumPy", "Matplotlib"] },
              { step: 3, title: "Build Portfolio Projects", duration: "2-3 weeks", status: "pending", skills: ["Data Cleaning", "EDA", "Dashboards"] },
              { step: 4, title: "Interview Preparation", duration: "2 weeks", status: "pending", skills: ["SQL Problems", "Statistics", "Behavioral"] },
              { step: 5, title: "Apply & Interview", duration: "Ongoing", status: "pending", skills: ["Resume", "Networking", "Mock Interviews"] },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold text-sm ${
                    item.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                    item.status === "in_progress" ? "border-primary text-primary" :
                    "border-muted text-muted-foreground"
                  }`}>
                    {item.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : item.step}
                  </div>
                  {item.step < 5 && <div className="w-0.5 h-8 bg-border" />}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.duration}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {item.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
