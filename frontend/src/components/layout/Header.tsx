"use client";

import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import {
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  Zap,
} from "lucide-react";
import { useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Welcome back,
        </h2>
        <span className="font-semibold">{user?.name || "User"}</span>
        {user && (
          <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Zap className="h-3 w-3" />
            Lvl {user.level} &middot; {user.xp_points} XP
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name ? getInitials(user.name) : "U"}
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <div className="border-t my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
