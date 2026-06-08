export interface User {
  id: number;
  email: string;
  name?: string;
  age?: number;
  education?: string;
  occupation?: string;
  career_goal?: string;
  skills_learning?: string[];
  daily_study_hours: number;
  sleep_schedule: { bed: string; wake: string };
  biggest_distractions?: string[];
  monthly_income: number;
  life_goals?: string[];
  xp_points: number;
  level: number;
  onboarding_completed: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  is_deep_work: boolean;
  is_recurring: boolean;
  sort_order: number;
  tags?: string;
  created_at: string;
  completed_at?: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  target_date?: string;
  progress: number;
  priority: number;
  is_high_priority: boolean;
  milestones: Milestone[];
  created_at: string;
}

export interface Milestone {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  order: number;
}

export interface Habit {
  id: number;
  title: string;
  description?: string;
  category: string;
  icon: string;
  target_time?: string;
  is_active: boolean;
  streak: number;
  longest_streak: number;
  created_at: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  date: string;
  is_completed: boolean;
  note?: string;
  completed_at: string;
}

export interface Skill {
  id: number;
  name: string;
  custom_name?: string;
  level: number;
  progress: number;
  total_hours: number;
  target_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface FinancialGoal {
  id: number;
  title: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  monthly_contribution: number;
  progress: number;
  is_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface DashboardData {
  tasks_today: { total: number; completed: number; pending: number };
  deep_work_hours_this_week: number;
  focus_score: number;
  productivity_score: number;
  goal_progress: number;
  total_learning_hours: number;
  habit_streak_count: number;
  active_goals: number;
}

export interface TimeBlock {
  id: number;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time?: string;
  color: string;
  is_recurring: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
