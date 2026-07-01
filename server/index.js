const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data.json');
const TEMP_DIR = path.join(__dirname, 'temp');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Simple JSON file storage
function readDb() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return []; }
}
function writeDb(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function exec(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { shell: true, cwd: TEMP_DIR });
    let out = '', err = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => code === 0 ? resolve(out) : reject(new Error(err)));
  });
}

// POST /process — download, extract, transcribe, store
app.post('/process', async (req, res) => {
  try {
    const url = (req.body.url || '').trim();
    if (!url) return res.status(400).json({ error: 'URL required' });

    const jobId = randomUUID();
    const slug = randomUUID().replace(/-/g, '').slice(0, 8);

    // Download + extract audio
    await exec('yt-dlp', [
      url, '-x', '--audio-format', 'mp3', '--audio-quality', '128K',
      '--output', `${jobId}.%(ext)s`, '--no-playlist', '--no-warnings',
      '--print', 'title', '--print', 'duration',
    ]);

    // Find the mp3 file
    const files = fs.readdirSync(TEMP_DIR);
    const mp3 = files.find(f => f.startsWith(jobId) && f.endsWith('.mp3'));
    if (!mp3) throw new Error('Audio extraction failed');

    const audioPath = path.join(TEMP_DIR, mp3);
    const audioBuffer = fs.readFileSync(audioPath);

    // Transcribe with Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error('GROQ_API_KEY not set');

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
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
    const segments = (groqData.segments || []).map(s => ({
      start: s.start, end: s.end, text: s.text.trim()
    }));
    const duration = groqData.duration || 0;
    const language = groqData.language || 'te';

    // Save to DB
    const db = readDb();
    db.push({ id: slug, slug, title: mp3.replace(/\.mp3$/, ''), language, audio_url: `/audio/${slug}.mp3`, transcript: segments, duration, created_at: new Date().toISOString() });
    writeDb(db);

    // Move audio to persistent storage
    const audioDir = path.join(__dirname, 'public', 'audio');
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    fs.copyFileSync(audioPath, path.join(audioDir, `${slug}.mp3`));

    // Cleanup temp
    fs.unlinkSync(audioPath);

    res.json({ success: true, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /player/:slug
app.get('/player/:slug', (req, res) => {
  const db = readDb();
  const item = db.find(d => d.slug === req.params.slug);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const audioUrl = `${req.protocol}://${req.get('host')}/audio/${item.slug}.mp3`;
  res.json({ ...item, audio_url: audioUrl });
});

// GET /slugs
app.get('/slugs', (req, res) => {
  const db = readDb();
  res.json(db.map(d => d.slug));
});

// Serve audio files
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) console.warn('WARNING: GROQ_API_KEY not set');
});
