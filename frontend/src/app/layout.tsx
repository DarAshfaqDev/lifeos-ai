"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import "./globals.css";

const publicRoutes = ["/login", "/register", "/verify-email", "/auth/callback", "/forgot-password", "/reset-password", "/"];

const fullScreenRoutes = ["/focus", "/onboarding", "/guest/save"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const isPublic = publicRoutes.includes(pathname);
  const isAuth = pathname === "/login" || pathname === "/register";
  const isFullScreen = fullScreenRoutes.includes(pathname);

  if (isLoading && !isPublic) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            <p className="text-muted-foreground animate-pulse">Loading LifeOS...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Toaster position="top-right" />
          {isPublic || isAuth || isFullScreen ? (
            children
          ) : (
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
                  {children}
                </main>
              </div>
              <MobileNav />
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
