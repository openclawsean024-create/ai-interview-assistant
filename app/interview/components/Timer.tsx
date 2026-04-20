'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerProps {
  initialMinutes: number;
  onComplete?: () => void;
  isEnglish: boolean;
}

const TIMER_OPTIONS = [1, 3, 5, 10];

export function Timer({ initialMinutes, onComplete, isEnglish }: TimerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const playAlert = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch {
      // fallback: just show visual
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            setIsComplete(true);
            playAlert();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return () => clearTimer();
  }, [isRunning, isPaused, clearTimer, playAlert, onComplete, timeLeft]);

  const handleStart = () => {
    setTimeLeft(selectedMinutes * 60);
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
  };

  const handlePauseResume = () => {
    setIsPaused((p) => !p);
  };

  const handleReset = () => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setTimeLeft(selectedMinutes * 60);
  };

  const handleSelectTime = (minutes: number) => {
    setSelectedMinutes(minutes);
    if (!isRunning) {
      setTimeLeft(minutes * 60);
    }
  };

  const progressPercent = ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100;
  const isWarning = timeLeft <= 60 && timeLeft > 0;
  const isCritical = timeLeft <= 30 && timeLeft > 0;

  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-900/70 rounded-xl border border-zinc-800/60">
      {/* Timer display */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={`text-5xl font-mono font-bold tracking-widest transition-colors duration-300 ${
            isComplete
              ? 'text-emerald-400'
              : isCritical
              ? 'text-red-400 animate-pulse'
              : isWarning
              ? 'text-amber-400'
              : 'text-zinc-50'
          }`}
        >
          {formatTime(timeLeft)}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isComplete
                ? 'bg-emerald-500'
                : isCritical
                ? 'bg-red-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isComplete && (
          <div className="text-emerald-400 text-sm font-semibold animate-pulse">
            {isEnglish ? '⏰ Time is up!' : '⏰ 時間到！'}
          </div>
        )}
      </div>

      {/* Time preset buttons */}
      {!isRunning && !isComplete && (
        <div className="flex justify-center gap-2 flex-wrap">
          {TIMER_OPTIONS.map((min) => (
            <button
              key={min}
              onClick={() => handleSelectTime(min)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                selectedMinutes === min
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-zinc-800/50 border-zinc-700/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {min} {isEnglish ? 'min' : '分鐘'}
            </button>
          ))}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center gap-3 flex-wrap">
        {!isRunning ? (
          <button onClick={handleStart} className="btn-brand px-6 py-2.5 text-sm">
            ▶ {isEnglish ? 'Start' : '開始'}
          </button>
        ) : (
          <>
            <button
              onClick={handlePauseResume}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                isPaused
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              {isPaused ? '▶ ' + (isEnglish ? 'Resume' : '繼續') : '⏸ ' + (isEnglish ? 'Pause' : '暫停')}
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-zinc-300 bg-zinc-800/60 border border-zinc-700/40 hover:bg-zinc-800 transition-all"
            >
              ↺ {isEnglish ? 'Reset' : '重置'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
