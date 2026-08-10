"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Zap, Loader2, ArrowLeft, ArrowRight, Target, Clock } from "lucide-react";
import toast from "react-hot-toast";

const goalTypes = [
  { id: "career", label: "Get a job", emoji: "💼" },
  { id: "exams", label: "Prepare for exams", emoji: "📚" },
  { id: "skills", label: "Learn new skills", emoji: "🎯" },
  { id: "productivity", label: "Improve productivity", emoji: "⚡" },
  { id: "business", label: "Build a business", emoji: "🚀" },
  { id: "life", label: "Manage my life better", emoji: "🌿" },
];

const timeOptions = [
  { hours: 0.5, label: "~30 min" },
  { hours: 1, label: "~1 hour" },
  { hours: 2, label: "~2 hours" },
  { hours: 3, label: "~3 hours" },
  { hours: 4, label: "~4 hours" },
  { hours: 6, label: "~6 hours" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [goalType, setGoalType] = useState<string | null>(null);
  const [goalText, setGoalText] = useState("");
  const [hours, setHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const goal = goalText.trim() || (goalType ? goalTypes.find((g) => g.id === goalType)?.label : "");

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await usersApi.completeOnboarding({
        career_goal: goal || undefined,
        life_goals: goal ? [goal] : [],
        daily_study_hours: hours,
      });
      if (user) {
        setUser({ ...user, onboarding_completed: true, career_goal: goal || user.career_goal });
      }
      if (data.created_goal || data.created_task) {
        toast.success("Your plan is ready.");
      }
      router.push("/dashboard");
    } catch {
      toast.error("Couldn't save your setup");
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 items-center justify-center mb-4">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set up your system</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Three quick questions. That&apos;s it.
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-xl p-6">
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-lg font-semibold mb-1">What are you working toward?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Pick what matters most right now.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {goalTypes.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGoalType(g.id);
                      setGoalText(g.label);
                    }}
                    className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                      goalType === g.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span className="mr-1.5">{g.emoji}</span>
                    {g.label}
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={!goalType} onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-lg font-semibold mb-1">What&apos;s your most important goal?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Be specific — e.g. &ldquo;Become a job-ready Data Analyst&rdquo;.
              </p>
              <div className="relative mb-6">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="e.g. Get a data analyst job in 6 months"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" disabled={!goalText.trim()} onClick={() => setStep(3)}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                How much time can you give each day?
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Be honest. LifeOS builds a plan you can actually follow.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {timeOptions.map((t) => (
                  <button
                    key={t.hours}
                    onClick={() => setHours(t.hours)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      hours === t.hours ? "border-primary bg-primary/10" : "hover:bg-accent"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2" onClick={submit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Start my plan
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
