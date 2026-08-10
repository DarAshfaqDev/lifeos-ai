"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Activity, Database, Goal, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers({ per_page: 20 }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (user: any) => {
    setTogglingId(user.id);
    try {
      await adminApi.toggleUserActive(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
      toast.success(user.is_active ? "User deactivated" : "User activated");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Active Today", value: stats?.users_today ?? 0, icon: Activity, color: "text-green-500" },
    { label: "Total Tasks", value: stats?.total_tasks ?? 0, icon: Database, color: "text-purple-500" },
    { label: "Total Goals", value: stats?.total_goals ?? 0, icon: Goal, color: "text-orange-500" },
    { label: "Total Habits", value: stats?.total_habits ?? 0, icon: BookOpen, color: "text-cyan-500" },
    { label: "Total Skills", value: stats?.total_skills ?? 0, icon: GraduationCap, color: "text-rose-500" },
  ];

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex flex-col items-start gap-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Level</th>
                    <th className="pb-2 pr-4">Onboarded</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{user.name || "—"}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{user.email}</td>
                      <td className="py-2.5 pr-4">Lv {user.level}</td>
                      <td className="py-2.5 pr-4">{user.onboarding_completed ? "Yes" : "No"}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${user.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => toggleUser(user)}
                          disabled={togglingId === user.id}
                          className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
                        >
                          {togglingId === user.id ? "..." : user.is_active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
