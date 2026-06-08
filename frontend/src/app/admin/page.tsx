"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BarChart3, Settings, Activity, Database } from "lucide-react";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">System management and analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-sm">
          <Shield className="h-4 w-4" />
          Admin Access
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveSection("users")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <p className="text-lg font-bold">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Active Today</p>
              <p className="text-lg font-bold">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-lg font-bold">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">System Load</p>
              <p className="text-lg font-bold">—</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "User Registration", value: "Open", type: "toggle" },
              { label: "AI Coach Enabled", value: "True", type: "toggle" },
              { label: "Email Verification", value: "Required", type: "toggle" },
              { label: "Default Daily Study Hours", value: "2", type: "input" },
              { label: "Max Login Attempts", value: "5", type: "input" },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between py-2">
                <span className="text-sm">{setting.label}</span>
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
                  {setting.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
