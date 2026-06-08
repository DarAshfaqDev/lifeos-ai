"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { learningApi } from "@/lib/api";
import { Skill } from "@/types";
import { BookOpen, Plus, Clock, BarChart3, Target, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Modal } from "@/components/ui/modal";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function LearningTrackerPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: "", target_hours: 50 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const { data } = await learningApi.listSkills();
      setSkills(data);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>;

  const totalHours = skills.reduce((a, s) => a + s.total_hours, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning Tracker</h1>
          <p className="text-muted-foreground text-sm">Track your skill development journey</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddSkill(true)}>
          <Plus className="h-4 w-4" />
          Add Skill
        </Button>
      </div>

      <Modal open={showAddSkill} onClose={() => setShowAddSkill(false)} title="Add Skill">
        <form onSubmit={async (e) => {
          e.preventDefault(); setSubmitting(true);
          try {
            await learningApi.createSkill(skillForm);
            toast.success("Skill added");
            setShowAddSkill(false);
            setSkillForm({ name: "", target_hours: 50 });
            const { data } = await learningApi.listSkills();
            setSkills(data);
          } catch { toast.error("Failed to add skill"); }
          finally { setSubmitting(false); }
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Skill Name</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. SQL, Python, Power BI" value={skillForm.name} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Target Hours</label>
            <input type="number" min={1} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={skillForm.target_hours} onChange={(e) => setSkillForm({ ...skillForm, target_hours: parseInt(e.target.value) || 50 })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !skillForm.name.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Skill
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddSkill(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{skills.length}</p>
            <p className="text-xs text-muted-foreground">Skills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{skills.filter((s) => s.progress >= 100).length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.progress, 0) / skills.length) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No skills tracked yet. Add your first skill!</p>
              ) : (
                skills.map((skill, i) => (
                  <div key={skill.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{skill.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {skill.total_hours.toFixed(1)}h / {skill.target_hours}h
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(skill.progress, 100)}%`,
                          background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Level {skill.level}</span>
                      <span className="text-xs text-muted-foreground">{skill.progress.toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skills.map((s, i) => ({
                      name: s.name,
                      value: s.total_hours || 1,
                      color: COLORS[i % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {skills.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
