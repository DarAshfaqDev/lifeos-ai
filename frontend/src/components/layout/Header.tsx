"use client";

import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import {
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  UserPlus,
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

  const isGuest = user?.is_guest;

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-sm font-medium text-muted-foreground truncate">
          {isGuest ? (
            <span className="flex items-center gap-2">
              Exploring as Guest
            </span>
          ) : (
            "Welcome back,"
          )}
        </h2>
        <span className="font-semibold truncate">{user?.name || "User"}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isGuest && (
          <button
            onClick={() => router.push("/guest/save")}
            className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Save my progress
          </button>
        )}

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle theme"
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
            aria-label="Account menu"
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
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isGuest ? "Guest session — data is temporary" : user?.email}
                  </p>
                </div>
                {isGuest && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      router.push("/guest/save");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create free account
                  </button>
                )}
                <div className="border-t my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {isGuest ? "Leave guest mode" : "Logout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
