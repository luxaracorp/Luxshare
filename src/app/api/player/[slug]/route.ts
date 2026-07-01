import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { corsHeaders, handleOPTIONS, corsResponse } from '@/lib/cors';

export { handleOPTIONS as OPTIONS };

const DATA_FILE = path.join(process.cwd(), 'data.json');

function readDb(): any[] {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return []; }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = readDb();
  const item = db.find((d: any) => d.slug === slug);
  if (!item) return corsResponse({ error: 'Not found' }, { status: 404 });
  return corsResponse(item);
}
