import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getProgressColor(progress: number): string {
  if (progress >= 75) return "text-green-500";
  if (progress >= 50) return "text-yellow-500";
  if (progress >= 25) return "text-orange-500";
  return "text-red-500";
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "text-red-500 bg-red-500/10";
    case "high": return "text-orange-500 bg-orange-500/10";
    case "medium": return "text-yellow-500 bg-yellow-500/10";
    case "low": return "text-green-500 bg-green-500/10";
    default: return "text-gray-500 bg-gray-500/10";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "done": return "text-green-500 bg-green-500/10";
    case "in_progress": return "text-blue-500 bg-blue-500/10";
    case "todo": return "text-gray-500 bg-gray-500/10";
    default: return "text-gray-500 bg-gray-500/10";
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
