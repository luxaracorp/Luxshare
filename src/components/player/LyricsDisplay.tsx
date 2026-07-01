'use client';

import { useRef, useEffect } from 'react';
import { TranscriptSegment } from '@/lib/types';

export function LyricsDisplay({ segments, currentTime }: { segments: TranscriptSegment[]; currentTime: number }) {
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const activeIndex = segments.findIndex(s => currentTime >= s.start && currentTime < s.end);
  const idx = activeIndex === -1 ? segments.findLastIndex(s => currentTime >= s.end) : activeIndex;

  useEffect(() => {
    if (idx >= 0 && lineRefs.current[idx]) {
      lineRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [idx]);

  if (!segments.length) {
    return <div className="flex flex-1 items-center justify-center"><p className="text-sm text-neutral-600">No lyrics</p></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-16">
      <div className="mx-auto max-w-lg space-y-6">
        {segments.map((s, i) => {
          let cls = 'transition-all duration-500 ease-out';
          if (i === idx) cls += ' text-2xl font-medium text-white';
          else if (i < idx) cls += i >= idx - 2 ? ' text-base text-neutral-500' : ' text-sm text-neutral-700';
          else cls += i <= idx + 2 ? ' text-lg text-neutral-400' : ' text-base text-neutral-600';
          return <p key={i} ref={el => { lineRefs.current[i] = el; }} className={cls} style={{ transform: i === idx ? 'scale(1)' : 'scale(0.95)', transformOrigin: 'center' }}>{s.text}</p>;
        })}
      </div>
    </div>
  );
}
