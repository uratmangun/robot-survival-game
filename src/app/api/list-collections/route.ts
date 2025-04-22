import { NextResponse } from 'next/server';
import { listCollections } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const collections = await listCollections();
  return NextResponse.json({ success: true, collections });
}
