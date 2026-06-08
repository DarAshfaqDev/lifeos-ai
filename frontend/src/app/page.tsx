import Link from "next/link";
import { Zap, Brain, Target, Clock, BookOpen, TrendingUp, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">LifeOS AI</span>
          </div>
          <div className="flex items-center gap-4">
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

      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-6">
          <Zap className="h-4 w-4" />
          Your Personal Operating System
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Master Your Time.<br />Achieve Your Goals.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          AI-powered time management, career planning, and habit tracking — all in one platform.
          Built for job seekers, students, and professionals who want to level up.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-lg"
          >
            Start Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border bg-background font-medium hover:bg-accent text-lg"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground">A complete productivity ecosystem powered by AI</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Coach", desc: "Personalized guidance for schedules, career plans, and productivity" },
            { icon: Target, title: "Career Planning", desc: "Roadmaps, skill tracking, and interview prep for your dream job" },
            { icon: Clock, title: "Time Management", desc: "Deep work blocks, Pomodoro timer, and smart scheduling" },
            { icon: BookOpen, title: "Learning Tracker", desc: "Track hours, skills, and progress across all subjects" },
            { icon: TrendingUp, title: "Analytics", desc: "Beautiful charts showing productivity trends and habits" },
            { icon: Zap, title: "Anti-Procrastination", desc: "Habit tracking, streak management, and distraction control" },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="p-6 rounded-xl border bg-card/50 hover:bg-card transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 LifeOS AI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
