"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiCoachApi } from "@/lib/api";
import { Briefcase, Upload, FileText, MessageSquare, CheckCircle2, Loader2, X, File, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function JobPrepPage() {
  const [questions, setQuestions] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"hr" | "sql" | "python" | "stats">("sql");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const skills = activeTab === "sql" ? ["SQL"] : activeTab === "python" ? ["Python"] : activeTab === "stats" ? ["Statistics"] : [];
      const { data } = await aiCoachApi.getInterviewQuestions({
        role: "Data Analyst",
        skills,
        question_type: activeTab === "hr" ? "behavioral" : "technical",
      });
      setQuestions(data.response);
    } catch {
      toast.error("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }
    setResumeFile(file);
    setResumeName(file.name);
    toast.success(`Resume "${file.name}" uploaded`);
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const tabs = [
    { id: "hr" as const, label: "HR Questions" },
    { id: "sql" as const, label: "SQL" },
    { id: "python" as const, label: "Python" },
    { id: "stats" as const, label: "Statistics" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Preparation</h1>
          <p className="text-muted-foreground text-sm">Prepare for interviews and track your resume</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileSelect}
            className="hidden"
          />
          {resumeFile ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card/50">
              <div className="p-3 rounded-lg bg-primary/5">
                <File className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{resumeName}</p>
                <p className="text-xs text-muted-foreground">
                  {(resumeFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={removeResume} className="text-muted-foreground hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Replace
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="font-medium">Upload your resume</p>
              <p className="text-sm text-muted-foreground">PDF or DOCX, max 5MB</p>
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interview Preparation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border hover:bg-accent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button onClick={generateQuestions} disabled={loading} className="gap-2 mb-4">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Generate Questions
          </Button>
          {questions && (
            <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
              {questions}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
