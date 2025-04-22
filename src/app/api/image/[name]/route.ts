import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const { name } = params;
  const folder = path.join(process.cwd(), 'data', 'image');
  const filePath = path.join(folder, name);
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': contentType }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 });
  }
}
