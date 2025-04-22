import { NextResponse } from 'next/server';
import { update } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: Request) {
  const { collection, query, updateData } = await request.json();
  if (!collection || !query || updateData === undefined) {
    return NextResponse.json({ success: false, error: 'Missing collection, query, or updateData' }, { status: 400 });
  }
  const results = await update(collection, query, updateData);
  return NextResponse.json({ success: true, results });
}
