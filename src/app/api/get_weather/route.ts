import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // In a real scenario, you'd fetch weather data based on the location.
  // This is just a mock implementation.
  const { location } = await req.json();
  const mockTemp = 25;
  return new Response(JSON.stringify({ location, temperature: mockTemp }), {
    headers: { "Content-Type": "application/json" },
  });
}
