import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const payload = {
    version: '0.0.1',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev'
  };
  return NextResponse.json(payload, { status: 200 });
}
