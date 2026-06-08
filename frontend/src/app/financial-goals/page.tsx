"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api";
import { FinancialGoal } from "@/types";
import { DollarSign, Plus, Home, Car, Heart, Target, PiggyBank, Landmark, ArrowUpRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";

const ICONS: Record<string, any> = {
  house: Home,
  car: Car,
  marriage: Heart,
  hajj: Landmark,
  business: Target,
  other: PiggyBank,
};

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", goal_type: "house", target_amount: 0, target_date: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data } = await financeApi.listGoals();
      setGoals(data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;

  const totalSaved = goals.reduce((a, g) => a + g.current_amount, 0);
  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground text-sm">Track your life goals and savings</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewGoal(true)}>
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      <Modal open={showNewGoal} onClose={() => setShowNewGoal(false)} title="New Financial Goal">
        <form onSubmit={async (e) => {
          e.preventDefault(); setSubmitting(true);
          try {
            await financeApi.createGoal(goalForm);
            toast.success("Goal created");
            setShowNewGoal(false);
            setGoalForm({ title: "", goal_type: "house", target_amount: 0, target_date: "" });
            const { data } = await financeApi.listGoals();
            setGoals(data);
          } catch { toast.error("Failed to create goal"); }
          finally { setSubmitting(false); }
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Goal Title</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. House Down Payment" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={goalForm.goal_type} onChange={(e) => setGoalForm({ ...goalForm, goal_type: e.target.value })}>
              <option value="house">House</option>
              <option value="car">Car</option>
              <option value="marriage">Marriage</option>
              <option value="hajj">Hajj</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Target Amount ($)</label>
            <input type="number" min={1} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={goalForm.target_amount || ""} onChange={(e) => setGoalForm({ ...goalForm, target_amount: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Target Date (optional)</label>
            <input type="date" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !goalForm.title.trim() || goalForm.target_amount <= 0} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowNewGoal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Saved</p>
            <p className="text-3xl font-bold">${totalSaved.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Target</p>
            <p className="text-3xl font-bold">${totalTarget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-3xl font-bold">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No financial goals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start tracking your life goals and savings</p>
              <Button onClick={() => setShowNewGoal(true)}>Create Your First Goal</Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const Icon = ICONS[goal.goal_type] || PiggyBank;
            return (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/5">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{goal.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{goal.goal_type}</p>
                      </div>
                    </div>
                    {goal.is_completed && (
                      <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>${goal.current_amount.toLocaleString()}</span>
                    <span className="text-muted-foreground">${goal.target_amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{goal.progress.toFixed(0)}% complete</span>
                    {goal.target_date && <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
