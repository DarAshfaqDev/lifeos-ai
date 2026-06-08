"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  Target,
  Briefcase,
  BookOpen,
  Brain,
  BarChart3,
  DollarSign,
  Bot,
  Shield,
  Zap,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/time-management", label: "Time Management", icon: Clock },
  { href: "/career-planner", label: "Career Planner", icon: Target },
  { href: "/job-prep", label: "Job Preparation", icon: Briefcase },
  { href: "/learning-tracker", label: "Learning Tracker", icon: BookOpen },
  { href: "/anti-procrastination", label: "Focus & Habits", icon: Brain },
  { href: "/financial-goals", label: "Financial Goals", icon: DollarSign },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai-coach", label: "AI Coach", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              LifeOS
            </h1>
            <p className="text-xs text-muted-foreground">AI Productivity System</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Level up your productivity</span>
        </div>
      </div>
    </aside>
  );
}
