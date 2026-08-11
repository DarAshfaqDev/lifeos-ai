"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { email }
      );
      setSent(true);
      const token = res.data?.reset_token;
      if (token) {
        sessionStorage.setItem("reset_token", token);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            LifeOS AI
          </h1>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>

        <Card className="border-primary/10 shadow-xl">
          <CardHeader>
            <CardTitle>{sent ? "Check your email" : "Forgot password?"}</CardTitle>
            <CardDescription>
              {sent
                ? "If an account exists with this email, you'll receive a reset link shortly."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  If an account exists with this email, a reset link has been sent.
                </p>
                {typeof window !== "undefined" && sessionStorage.getItem("reset_token") && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      const t = sessionStorage.getItem("reset_token");
                      sessionStorage.removeItem("reset_token");
                      window.location.href = `/reset-password?token=${t}`;
                    }}
                  >
                    Continue to reset
                  </Button>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  Didn&apos;t receive it?{" "}
                  <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">
                    Try again
                  </button>
                </p>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
