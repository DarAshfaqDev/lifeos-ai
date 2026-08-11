"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type TimerMode = "focus" | "break";
export type TimerState = "idle" | "running" | "paused";
export type TimerType = "countdown" | "countup" | "open";

const SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgH9/f3+Af39/gIB/f39/gH9/f4CAf39/f4B/f3+AgICA";
const FOCUS_DEFAULT = 25 * 60;
const BREAK_DEFAULT = 5 * 60;

export function useTimer(
  initialFocus = FOCUS_DEFAULT,
  initialBreak = BREAK_DEFAULT,
  timerType: TimerType = "countdown"
) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [state, setState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(initialFocus);
  const [sessions, setSessions] = useState(0);
  const [focusElapsed, setFocusElapsed] = useState(0);
  const [type, setType] = useState<TimerType>(timerType);
  const typeRef = useRef<TimerType>(timerType);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const durations = useRef({ focus: initialFocus, break: initialBreak });

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUND_URL);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  const tick = useCallback(() => {
    if (mode === "focus") {
      setFocusElapsed((e) => e + 1);
    }

    // Count-up / open timers never auto-complete; they only track elapsed time.
    if (typeRef.current !== "countdown") return;

    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearTimer();
        playSound();
        setState("idle");
        if (mode === "focus") {
          setSessions((s) => s + 1);
        }
        return durations.current[mode === "focus" ? "break" : "focus"];
      }
      return prev - 1;
    });
  }, [mode, clearTimer, playSound]);

  const start = useCallback(() => {
    setState("running");
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }, [clearTimer, tick]);

  const pause = useCallback(() => {
    setState("paused");
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setState("running");
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const reset = useCallback(() => {
    clearTimer();
    setState("idle");
    setTimeLeft(durations.current[mode]);
    setFocusElapsed(0);
  }, [clearTimer, mode]);

  const restore = useCallback((elapsedSeconds: number) => {
    clearTimer();
    setState("running");
    setFocusElapsed(elapsedSeconds);
    const planned = durations.current.focus;
    setTimeLeft(Math.max(1, planned - elapsedSeconds));
    intervalRef.current = setInterval(tick, 1000);
  }, [clearTimer, tick]);

  const switchMode = useCallback((newMode: TimerMode) => {
    clearTimer();
    setState("idle");
    setMode(newMode);
    setTimeLeft(durations.current[newMode]);
  }, [clearTimer]);

  const addMinutes = useCallback((minutes: number) => {
    setTimeLeft((prev) => Math.min(prev + minutes * 60, 3600));
  }, []);

  const setDuration = useCallback((m: TimerMode, seconds: number) => {
    durations.current[m] = seconds;
    if (mode === m && state === "idle") {
      setTimeLeft(seconds);
    }
  }, [mode, state]);

  const setTimerType = useCallback((t: TimerType) => {
    typeRef.current = t;
    setType(t);
    setState("idle");
    clearTimer();
    setTimeLeft(durations.current[mode]);
    setFocusElapsed(0);
  }, [clearTimer, mode]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const plannedSeconds = durations.current.focus;

  const progress =
    type === "countdown"
      ? mode === "focus"
        ? 1 - timeLeft / plannedSeconds
        : 1 - timeLeft / durations.current.break
      : Math.min(1, focusElapsed / plannedSeconds);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const fmt = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const display =
    type === "countdown"
      ? fmt(timeLeft)
      : fmt(focusElapsed);

  return {
    mode,
    state,
    timeLeft,
    display,
    progress,
    sessions,
    focusElapsed,
    start,
    pause,
    resume,
    reset,
    restore,
    switchMode,
    addMinutes,
    setDuration,
    setTimerType,
  };
}
