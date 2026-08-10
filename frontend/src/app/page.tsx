"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Zap, ArrowRight, Loader2, Check, Target, Focus, Rocket, TrendingUp, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";

const steps = [
  {
    icon: Target,
    title: "Plan",
    desc: "Turn a vague goal into a realistic plan with clear milestones.",
  },
  {
    icon: Focus,
    title: "Focus",
    desc: "Know exactly what to work on right now — never a wall of options.",
  },
  {
    icon: Rocket,
    title: "Execute",
    desc: "Work in distraction-free focus sessions until it's done.",
  },
  {
    icon: TrendingUp,
    title: "Improve",
    desc: "Learn from your real behavior and build plans that actually stick.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { loginAsGuest } = useAuthStore();
  const [guestLoading, setGuestLoading] = useState(false);

  const startGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      toast.success("Welcome! Let's set your first goal.");
      router.push("/onboarding");
    } catch {
      toast.error("Couldn't start guest mode right now");
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">LifeOS AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-6">
          <Zap className="h-4 w-4" />
          A personal execution system
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto">
          Stop planning your life.
          <br />
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Start progressing through it.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          LifeOS turns your goals into a realistic plan, tells you the one thing
          to do right now, and helps you actually finish it. Built for students,
          job seekers, and professionals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-base"
          >
            Try LifeOS free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <button
            onClick={startGuest}
            disabled={guestLoading}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border bg-background font-medium hover:bg-accent text-base disabled:opacity-50"
          >
            {guestLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
            Continue as guest
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          No credit card. Guest mode needs no account — your data stays on this device.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="p-6 rounded-xl border bg-card/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl border bg-card p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            What the app does every day
          </h2>
          <div className="max-w-xl mx-auto text-left space-y-3 mb-8">
            {[
              "Shows you today's mission and the ONE next action",
              "Starts a distraction-free focus session in one click",
              "Breaks big tasks into steps you can actually start",
              "Recovers missed days without guilt or overload",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Get started free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={startGuest}
              disabled={guestLoading}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border bg-background font-medium hover:bg-accent disabled:opacity-50"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 LifeOS AI. All rights reserved.</span>
          <span>Do the work that matters.</span>
        </div>
      </footer>
    </div>
  );
}
