"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tasksApi } from "@/lib/api";
import { Task, TimeBlock } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Clock, Plus, Play, Pause, RotateCcw, CheckCircle2, Brain, Coffee, Zap, Loader2 } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import toast from "react-hot-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 4;
  return `${hour.toString().padStart(2, "0")}:00`;
});

function FocusTimer() {
  const {
    mode, state, display, progress, sessions,
    start, pause, resume, reset, switchMode, addMinutes,
  } = useTimer(25 * 60, 5 * 60);

  const circumference = 220;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Focus Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="relative w-44 h-44 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="40" cy="40" r="35" fill="none"
              stroke={mode === "focus" ? "hsl(var(--primary))" : "hsl(142, 76%, 36%)"}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono tracking-wider">{display}</span>
            <span className="text-xs text-muted-foreground mt-1 capitalize">{mode} mode</span>
          </div>
        </div>

        <div className="flex gap-2 justify-center mb-3">
          {state === "idle" && (
            <Button size="sm" onClick={start} className="gap-2 min-w-[100px]">
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}
          {state === "running" && (
            <Button size="sm" variant="secondary" onClick={pause} className="gap-2 min-w-[100px]">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {state === "paused" && (
            <>
              <Button size="sm" onClick={resume} className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button size="sm" variant="outline" onClick={reset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}
          {(state === "idle" || state === "running") && (
            <Button size="sm" variant="outline" onClick={() => addMinutes(5)} className="gap-2">
              <Plus className="h-4 w-4" />
              +5
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => switchMode("focus")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "focus" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            Focus
          </button>
          <button
            onClick={() => switchMode("break")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === "break" ? "bg-green-500/10 text-green-500" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Coffee className="h-3.5 w-3.5" />
            Break
          </button>
        </div>

        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Zap className="h-3 w-3" />
          <span>{sessions} session{sessions !== 1 ? "s" : ""} completed today</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TimeManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [loading, setLoading] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ title: "", day_of_week: new Date().getDay() || 7, start_time: "09:00", color: "#3B82F6" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, blocksRes] = await Promise.all([
        tasksApi.list(),
        tasksApi.getTimeBlocks(),
      ]);
      setTasks(tasksRes.data);
      setBlocks(blocksRes.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDay = (dayIndex: number) => {
    const date = new Date();
    const currentDay = date.getDay() || 7;
    const diff = dayIndex - currentDay;
    date.setDate(date.getDate() + diff);
    return tasks.filter(
      (t) => t.date === date.toISOString().split("T")[0]
    );
  };

  const getBlocksForDay = (dayIndex: number) =>
    blocks.filter((b) => b.day_of_week === dayIndex || (b.day_of_week === null && true));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Management</h1>
          <p className="text-muted-foreground text-sm">Plan your deep work and focus blocks</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddBlock(true)}>
          <Plus className="h-4 w-4" />
          Add Block
        </Button>
      </div>

      <Modal open={showAddBlock} onClose={() => setShowAddBlock(false)} title="Add Time Block">
        <form onSubmit={async (e) => {
          e.preventDefault(); setSubmitting(true);
          try {
            await tasksApi.createTimeBlock(blockForm);
            toast.success("Block added");
            setShowAddBlock(false);
            setBlockForm({ title: "", day_of_week: selectedDay, start_time: "09:00", color: "#3B82F6" });
            const { data } = await tasksApi.getTimeBlocks();
            setBlocks(data);
          } catch { toast.error("Failed to add block"); }
          finally { setSubmitting(false); }
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Block Title</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Deep Work, SQL Practice" value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Day</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={blockForm.day_of_week} onChange={(e) => setBlockForm({ ...blockForm, day_of_week: parseInt(e.target.value) })}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d, i) => (
                  <option key={i} value={i + 1}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Time</label>
              <input type="time" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={blockForm.start_time} onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Color</label>
            <div className="flex gap-2">
              {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"].map((c) => (
                <button key={c} type="button" onClick={() => setBlockForm({ ...blockForm, color: c })}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${blockForm.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting || !blockForm.title.trim()} className="flex-1 gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Block
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddBlock(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i + 1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDay === i + 1
                ? "bg-primary text-primary-foreground"
                : "bg-card border hover:bg-accent"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {timeSlots.map((time) => {
                  const dayBlocks = getBlocksForDay(selectedDay).filter(
                    (b) => b.start_time && time.startsWith(b.start_time.slice(0, 2))
                  );
                  const dayTasks = getTasksForDay(selectedDay).filter(
                    (t) => t.start_time && time.startsWith(t.start_time.slice(0, 2))
                  );
                  return (
                    <div key={time} className="flex group">
                      <div className="w-16 py-2 text-xs text-muted-foreground border-r pr-3">
                        {time}
                      </div>
                      <div className="flex-1 min-h-[40px] border-b border-dashed relative ml-3">
                        {dayBlocks.map((block) => (
                          <div
                            key={block.id}
                            className="absolute inset-1 rounded-lg px-2 py-1 flex items-center gap-2"
                            style={{ backgroundColor: `${block.color}20`, borderLeft: `3px solid ${block.color}` }}
                          >
                            <Brain className="h-3 w-3" style={{ color: block.color }} />
                            <span className="text-xs font-medium">{block.title}</span>
                          </div>
                        ))}
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="absolute inset-1 rounded-lg px-2 py-1 flex items-center gap-2 bg-primary/5 border-l-2 border-primary"
                          >
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium">{task.title}</span>
                            {task.is_deep_work && (
                              <span className="text-xs bg-purple-500/10 text-purple-500 px-1 rounded">
                                Deep
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <FocusTimer />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getTasksForDay(selectedDay).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks planned</p>
                ) : (
                  getTasksForDay(selectedDay).slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-card/50">
                      <div className={`h-2 w-2 rounded-full ${
                        task.priority === "urgent" ? "bg-red-500" :
                        task.priority === "high" ? "bg-orange-500" :
                        task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                      }`} />
                      <span className="text-sm flex-1 truncate">{task.title}</span>
                      <span className="text-xs text-muted-foreground">{task.duration_minutes}m</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
