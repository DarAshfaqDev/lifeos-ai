"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { goalsApi } from "@/lib/api";
import { Goal } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Target, Plus, Briefcase, BookOpen, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function CareerPlannerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", description: "", category: "career" });
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

  const toggleMilestone = async (milestoneId: number) => {
    try {
      await goalsApi.toggleMilestone(milestoneId);
      loadGoals();
    } catch {
      toast.error("Couldn't update milestone");
    }
  };

  const careerGoals = goals.filter((g) => g.category === "career");
  const learningGoals = goals.filter((g) => g.category === "learning");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-muted-foreground text-sm">One goal at a time, broken into steps</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewGoal(true)}>
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      <Modal open={showNewGoal} onClose={() => setShowNewGoal(false)} title="New Goal">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              await goalsApi.create(goalForm);
              toast.success("Goal created");
              setShowNewGoal(false);
              setGoalForm({ title: "", description: "", category: "career" });
              loadGoals();
            } catch {
              toast.error("Failed to create goal");
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium mb-1 block">Goal</label>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Get a Data Analyst job in 6 months"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Why it matters</label>
            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
              placeholder="What will change when you reach this?"
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <select
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={goalForm.category}
              onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
            >
              <option value="career">Career</option>
              <option value="learning">Learning</option>
              <option value="finance">Finance</option>
              <option value="health">Health</option>
              <option value="life">Life</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !goalForm.title.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowNewGoal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Briefcase className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{careerGoals.length}</p>
              <p className="text-xs text-muted-foreground">Career goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BookOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{learningGoals.length}</p>
              <p className="text-xs text-muted-foreground">Learning goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{goals.length}</p>
              <p className="text-xs text-muted-foreground">Total goals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">You don&apos;t have a goal yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Choose one thing you want to improve or achieve. LifeOS turns it
              into milestones you can act on.
            </p>
            <Button onClick={() => setShowNewGoal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create my first goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const done = goal.milestones.filter((m) => m.is_completed).length;
            const total = goal.milestones.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : Math.round(goal.progress);
            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription className="mt-0.5">{goal.description}</CardDescription>
                      )}
                    </div>
                    <span className="text-sm font-bold shrink-0">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {total === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Add milestones in the app to break this goal into steps.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {goal.milestones.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => toggleMilestone(m.id)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/60 transition-colors text-left"
                        >
                          <CheckCircle2
                            className={`h-4 w-4 shrink-0 ${
                              m.is_completed ? "text-green-500" : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-sm flex-1 ${
                              m.is_completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {m.title}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
