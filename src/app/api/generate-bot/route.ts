import { NextResponse } from 'next/server';
import Together from 'together-ai';

export async function POST(request: Request) {
  const { prompt } = await request.json();
  const together = new Together();
  const response = await together.images.create({
    model: "black-forest-labs/FLUX.1-schnell-Free",
    prompt,
    steps: 4,
    n: 4,
    response_format: "base64",
  });
  const images = response.data.map((item) => item.b64_json ?? "");
  return NextResponse.json({ images });
}
