"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiCoachApi } from "@/lib/api";
import { Bot, Send, User, Sparkles, Loader2, Brain, Target, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi! I'm your LifeOS AI Coach. I can help you with:\n\n• Creating personalized schedules\n• Analyzing your productivity\n• Generating interview questions\n• Building career roadmaps\n• Beating procrastination\n\nWhat would you like help with today?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await aiCoachApi.chat({
        message: input,
        conversation_history: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      toast.error("AI service unavailable. Check your API keys.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please make sure an AI provider (OpenAI, Gemini, or Claude) is configured." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Generate Roadmap", icon: Target, action: async () => {
      setLoading(true);
      try {
        const { data } = await aiCoachApi.generateRoadmap();
        setMessages((prev) => [...prev, { role: "user", content: "Generate my personalized roadmap" }, { role: "assistant", content: data.response }]);
      } catch { toast.error("Failed to generate roadmap"); }
      setLoading(false);
    }},
    { label: "Analyze Productivity", icon: TrendingUp, action: async () => {
      setLoading(true);
      try {
        const { data } = await aiCoachApi.analyzeProductivity();
        setMessages((prev) => [...prev, { role: "user", content: "Analyze my productivity" }, { role: "assistant", content: data.response }]);
      } catch { toast.error("Failed to analyze"); }
      setLoading(false);
    }},
    { label: "Interview Questions", icon: Brain, action: () => {
      setInput("Generate 5 technical interview questions for a Data Analyst role covering SQL, Python, and statistics.");
    }},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <p className="text-muted-foreground text-sm">Your personal productivity and career coach</p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.label} variant="outline" size="sm" onClick={action.action} disabled={loading} className="gap-2">
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask your AI Coach anything..."
                className="flex-1 h-10 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
