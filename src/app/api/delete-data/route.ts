import { NextResponse } from 'next/server';
import { remove } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  const { collection, query } = await request.json();
  if (!collection || !query) {
    return NextResponse.json({ success: false, error: 'Missing collection or query' }, { status: 400 });
  }
  const results = await remove(collection, query);
  return NextResponse.json({ success: true, results });
}
