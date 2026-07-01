import fs from 'fs';
import path from 'path';
import { handleOPTIONS, corsResponse } from '@/lib/cors';

export { handleOPTIONS as OPTIONS };

const DATA_FILE = path.join(process.cwd(), 'data.json');

export async function GET() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return corsResponse(data.map((d: any) => d.slug));
  } catch {
    return corsResponse([]);
  }
}
