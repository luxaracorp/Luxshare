'use client';

import { useEffect, useState, useCallback } from 'react';
import { PlayerData, TranscriptSegment } from '@/lib/types';
import { useAudioPlayer } from '@/components/player/useAudioPlayer';
import { PlayerControls } from '@/components/player/PlayerControls';
import { LyricsDisplay } from '@/components/player/LyricsDisplay';

export default function Home() {
  const [view, setView] = useState<'upload' | 'player' | null>(null);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '');
    const m = path.match(/^\/share\/([a-zA-Z0-9]+)$/);
    if (m) { setSlug(m[1]); setView('player'); }
    else { setView('upload'); }
  }, []);

  if (!view) return null;
  if (view === 'player') return <PlayerPage slug={slug} />;
  return <UploadPage />;
}

function UploadPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const process = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true); setResult(''); setError('');
    try {
      const res = await fetch('/api/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setResult(`${window.location.origin}/share/${d.slug}`);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [url]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-2xl font-light tracking-tight">Listen</h1>
        <p className="text-center text-sm text-neutral-500">Paste a YouTube or Instagram link</p>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." disabled={loading}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-600 outline-none transition focus:border-neutral-600 disabled:opacity-50" />
        <button onClick={process} disabled={loading || !url.trim()}
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">
          {loading ? 'Processing...' : 'Process'}
        </button>
        {loading && <p className="text-center text-sm text-neutral-400">Processing... This may take a minute</p>}
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        {result && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-center">
            <p className="mb-2 text-sm text-neutral-400">Shareable link:</p>
            <code className="block rounded bg-neutral-800 px-3 py-2 text-sm text-green-400">{result}</code>
            <a href={result} target="_blank" className="mt-2 inline-block text-xs text-neutral-500 underline underline-offset-2 hover:text-white">Open player</a>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/player/${slug}`).then(r => { if (!r.ok) throw Error('Not found'); return r.json(); }).then(d => { setData(d); setLoading(false); }).catch(e => { setErr(e.message); setLoading(false); });
  }, [slug]);

  if (!data) return <div className="flex min-h-screen items-center justify-center bg-black"><p className="text-sm text-neutral-500">{loading ? 'Loading...' : err || 'Not found'}</p></div>;

  const segments: TranscriptSegment[] = Array.isArray(data.transcript) ? data.transcript : [];
  const { playing, currentTime, ready, togglePlay, skip } = useAudioPlayer(data.audio_url);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col">
          {ready && segments.length > 0 ? <LyricsDisplay segments={segments} currentTime={currentTime} /> : <div className="flex flex-1 items-center justify-center"><p className="text-sm text-neutral-600">{!ready ? 'Loading audio...' : 'No lyrics'}</p></div>}
        </div>
        <div className="border-t border-neutral-900 px-4 py-6"><PlayerControls playing={playing} onToggle={togglePlay} onSkip={skip} /></div>
      </main>
    </div>
  );
}
