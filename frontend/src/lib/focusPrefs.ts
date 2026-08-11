"use client";

import { SoundscapeId, SOUNDSCAPES } from "./soundscapes";
import { TimerType } from "@/hooks/useTimer";

export interface FocusPrefs {
  timerType: TimerType;
  durationMinutes: number;
  sound: SoundscapeId;
  volume: number;
  fade: boolean;
}

export interface FocusSnapshot {
  taskId: number;
  taskTitle: string;
  startedAt: number;
  plannedMinutes: number;
  sound: SoundscapeId;
  volume: number;
  fade: boolean;
  timerType: TimerType;
}

const PREFS_KEY = "lifeos_focus_prefs";
const SNAPSHOT_KEY = "lifeos_focus_snapshot";
const DEFAULT_MINUTES = 25;

export const DURATION_OPTIONS = [10, 15, 25, 45, 60];

export function loadFocusPrefs(): FocusPrefs {
  if (typeof window === "undefined") {
    return {
      timerType: "countdown",
      durationMinutes: DEFAULT_MINUTES,
      sound: "none",
      volume: 24,
      fade: true,
    };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        timerType: "countdown",
        durationMinutes: DEFAULT_MINUTES,
        sound: "none",
        volume: 24,
        fade: true,
      };
    }
    const parsed = JSON.parse(raw) as Partial<FocusPrefs>;
    return {
      timerType: parsed.timerType === "countup" || parsed.timerType === "open" ? parsed.timerType : "countdown",
      durationMinutes:
        typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0
          ? Math.min(parsed.durationMinutes, 240)
          : DEFAULT_MINUTES,
      sound: SOUNDSCAPES.some((s) => s.id === parsed.sound) ? parsed.sound! : "none",
      volume: typeof parsed.volume === "number" ? Math.max(0, Math.min(parsed.volume, 60)) : 24,
      fade: parsed.fade !== false,
    };
  } catch {
    return {
      timerType: "countdown",
      durationMinutes: DEFAULT_MINUTES,
      sound: "none",
      volume: 24,
      fade: true,
    };
  }
}

export function saveFocusPrefs(prefs: FocusPrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export function saveFocusSnapshot(snapshot: FocusSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {}
}

export function loadFocusSnapshot(): FocusSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FocusSnapshot;
    if (!parsed.taskId || !parsed.startedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFocusSnapshot() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SNAPSHOT_KEY);
  } catch {}
}

export function elapsedFromSnapshot(snapshot: FocusSnapshot, now = Date.now()): number {
  return Math.max(0, Math.round((now - snapshot.startedAt) / 1000));
}
