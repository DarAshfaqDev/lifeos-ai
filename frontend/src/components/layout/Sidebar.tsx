"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Target,
  BookOpen,
  Briefcase,
  Timer,
  Bot,
  Clock,
  Brain,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const primaryNav = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/career-planner", label: "Goals", icon: Target },
  { href: "/learning-tracker", label: "Learn", icon: BookOpen },
  { href: "/job-prep", label: "Career", icon: Briefcase },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/ai-coach", label: "AI Coach", icon: Bot },
];

const moreNav = [
  { href: "/time-management", label: "Time Management", icon: Clock },
  { href: "/anti-procrastination", label: "Habits", icon: Brain },
  { href: "/financial-goals", label: "Finance", icon: DollarSign },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Shield },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

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
            <p className="text-xs text-muted-foreground">Personal execution system</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {primaryNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href}
          />
        ))}

        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", showMore && "rotate-180")}
          />
          More
        </button>
        {showMore &&
          moreNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
            />
          ))}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground px-3">
          Do the work that matters.
        </p>
      </div>
    </aside>
  );
}
