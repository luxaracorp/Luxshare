const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function processUrl(url: string) {
  const res = await fetch(`${BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Processing failed');
  return data as { slug: string };
}

export async function getPlayerData(slug: string) {
  const res = await fetch(`${BASE}/player/${slug}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function getAllSlugs(): Promise<string[]> {
  const res = await fetch(`${BASE}/slugs`);
  return res.json();
}
