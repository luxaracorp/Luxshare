'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioPlayer(audioUrl: string) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const a = new Audio(audioUrl);
    a.preload = 'auto';
    ref.current = a;
    const onT = () => setCurrentTime(a.currentTime);
    const onD = () => setDuration(a.duration);
    const onR = () => setReady(true);
    const onE = () => setPlaying(false);
    a.addEventListener('timeupdate', onT);
    a.addEventListener('durationchange', onD);
    a.addEventListener('canplay', onR);
    a.addEventListener('ended', onE);
    return () => {
      a.removeEventListener('timeupdate', onT);
      a.removeEventListener('durationchange', onD);
      a.removeEventListener('canplay', onR);
      a.removeEventListener('ended', onE);
      a.pause(); a.src = '';
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const a = ref.current; if (!a) return;
    if (a.paused) { a.play().catch(() => {}); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  }, []);

  const skip = useCallback((sec: number) => {
    const a = ref.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.currentTime + sec, a.duration));
  }, []);

  return { playing, currentTime, duration, ready, togglePlay, skip };
}
