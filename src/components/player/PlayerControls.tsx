'use client';

export function PlayerControls({ playing, onToggle, onSkip }: {
  playing: boolean;
  onToggle: () => void;
  onSkip: (sec: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-8">
      <button onClick={() => onSkip(-10)} className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 hover:text-white" aria-label="Back 10s">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12.5 8c-2.65 0-4.05.99-4.05.99L6.5 7.5V12h4.5l-1.7-1.5s1.26-1 3.2-1c2.48 0 4.5 2.02 4.5 4.5s-2.02 4.5-4.5 4.5c-1.82 0-3.38-.78-4.33-2H6.21c.99 2.42 3.36 4 6.29 4 3.59 0 6.5-2.91 6.5-6.5S16.09 8 12.5 8z" />
          <path d="M10 10l-2-2.5" />
        </svg>
      </button>
      <button onClick={onToggle} className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200" aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <button onClick={() => onSkip(10)} className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 hover:text-white" aria-label="Forward 10s">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M11.5 8c2.65 0 4.05.99 4.05.99L17.5 7.5V12H13l1.7-1.5s-1.26-1-3.2-1C9.02 9.5 7 11.52 7 14s2.02 4.5 4.5 4.5c1.82 0 3.38-.78 4.33-2h1.96c-.99 2.42-3.36 4-6.29 4C7.91 20.5 5 17.59 5 14s2.91-6 6.5-6z" />
          <path d="M14 10l2-2.5" />
        </svg>
      </button>
    </div>
  );
}
