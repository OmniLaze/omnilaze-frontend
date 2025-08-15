import { useEffect, useRef } from 'react';

type Timer = ReturnType<typeof setTimeout>;

export const useSafeTimeout = () => {
  const timersRef = useRef<Timer[]>([]);

  // Register and track a timeout; returns the timer id
  const setSafeTimeout = (fn: () => void, delay: number): Timer => {
    const id = setTimeout(() => {
      // 执行前先从集合中移除，避免重复清理
      removeTimer(id);
      fn();
    }, delay) as Timer;
    timersRef.current.push(id);
    return id;
  };

  const removeTimer = (id: Timer) => {
    timersRef.current = timersRef.current.filter((t) => t !== id);
  };

  const clearTimeoutById = (id: Timer) => {
    try { clearTimeout(id as any); } catch {}
    removeTimer(id);
  };

  const clearAllTimeouts = () => {
    for (const id of timersRef.current) {
      try { clearTimeout(id as any); } catch {}
    }
    timersRef.current = [];
  };

  useEffect(() => () => clearAllTimeouts(), []);

  return { setSafeTimeout, clearTimeoutById, clearAllTimeouts };
};

