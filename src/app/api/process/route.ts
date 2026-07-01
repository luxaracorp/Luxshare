import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { corsHeaders, handleOPTIONS, corsResponse } from '@/lib/cors';

export const maxDuration = 300;

export { handleOPTIONS as OPTIONS };

const DATA_FILE = path.join(process.cwd(), 'data.json');
const PUBLIC_AUDIO = path.join(process.cwd(), 'public', 'audio');

function readDb(): any[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return []; }
}

function writeDb(data: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function exec(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { shell: true, cwd });
    let out = '', err = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => err += d.toString());
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(err)));
  });
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return corsResponse({ error: 'URL required' }, { status: 400 });

    const jobId = randomUUID();
    const slug = randomUUID().replace(/-/g, '').slice(0, 8);
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    await exec('yt-dlp', [
      url, '-x', '--audio-format', 'mp3', '--audio-quality', '128K',
      '--output', `${jobId}.%(ext)s`, '--no-playlist', '--no-warnings',
      '--print', 'title', '--print', 'duration',
    ], tempDir);

    const files = fs.readdirSync(tempDir);
    const mp3 = files.find(f => f.startsWith(jobId) && f.endsWith('.mp3'));
    if (!mp3) throw new Error('Audio extraction failed');

    const audioPath = path.join(tempDir, mp3);
    const audioBuffer = fs.readFileSync(audioPath);

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error('GROQ_API_KEY not set');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
    formData.append('file', blob, 'audio.mp3');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      throw new Error(`Groq failed: ${groqRes.status} ${text}`);
    }

    const groqData = await groqRes.json();
    const segments = (groqData.segments || []).map((s: any) => ({
      start: s.start, end: s.end, text: s.text.trim()
    }));
    const duration = groqData.duration || 0;
    const language = groqData.language || 'te';

    const db = readDb();
    db.push({
      id: slug, slug, title: mp3.replace(/\.mp3$/, ''),
      language, audio_url: `/api/audio/${slug}`,
      transcript: segments, duration,
      created_at: new Date().toISOString(),
    });
    writeDb(db);

    if (!fs.existsSync(PUBLIC_AUDIO)) fs.mkdirSync(PUBLIC_AUDIO, { recursive: true });
    fs.copyFileSync(audioPath, path.join(PUBLIC_AUDIO, `${slug}.mp3`));
    fs.unlinkSync(audioPath);

    return corsResponse({ success: true, slug });
  } catch (err: any) {
    console.error(err);
    return corsResponse({ error: err.message }, { status: 500 });
  }
}
