import { NextResponse } from 'next/server';
import { insert } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { collection, data } = await request.json();
  if (!collection || data === undefined) {
    return NextResponse.json({ success: false, error: 'Missing collection or data' }, { status: 400 });
  }
  const result = await insert(collection, data);
  return NextResponse.json({ success: true, result });
}
