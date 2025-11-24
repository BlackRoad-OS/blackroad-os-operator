import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const payload = { status: 'ok', uptime: process.uptime() };
  return NextResponse.json(payload, { status: 200 });
}
