import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // params is async in Next.js 15+, so await it
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  const coll = await getCollection('metadata');
  const doc: any = coll.get(id);
  if (!doc) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  const { name, description, image } = doc;
  return NextResponse.json({ name, description, image } );
}
