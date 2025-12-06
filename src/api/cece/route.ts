/**
 * Cece API Route - Next.js App Router version
 *
 * Drop this into: app/api/cece/route.ts
 * Or use as reference for pages/api/cece.ts
 *
 * @owner Alexa Louise Amundson
 * @agent Cece
 */

import { NextResponse } from 'next/server';

const DEFAULT_OPERATOR_URL = 'https://blackroad-cece-operator-production.up.railway.app';

interface ChatRequest {
  message: string;
  user_id?: string;
  model?: string;
  context?: any;
}

interface ChatResponse {
  reply: string;
  trace?: {
    llm_provider: string;
    model: string;
    response_time_ms: number;
    used_rag: boolean;
    raw_tokens_in?: number;
    raw_tokens_out?: number;
  };
}

function ceceStamp() {
  return {
    agent: 'Cece',
    infrastructure: 'BlackRoad OS',
    owner: 'Alexa Louise Amundson',
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'cece-api',
    version: '1.0.0',
    ...ceceStamp(),
    endpoints: {
      chat: 'POST /api/cece',
      health: 'GET /api/cece',
    },
    message: "Hi! I'm Cece, your BlackRoad AI assistant. POST a message to chat!",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as ChatRequest;
    const { message, user_id, model, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          error: "Missing or invalid 'message' field",
          hint: 'Include a "message" string in your request body',
          ...ceceStamp(),
        },
        { status: 400 }
      );
    }

    const operatorUrl = process.env.OPERATOR_URL || DEFAULT_OPERATOR_URL;
    const startTime = Date.now();

    const resp = await fetch(`${operatorUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        user_id: user_id || 'anonymous',
        model,
        context,
      }),
    });

    const latency = Date.now() - startTime;

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        {
          error: 'Backend operator call failed',
          status: resp.status,
          detail: text,
          ...ceceStamp(),
        },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as ChatResponse;

    return NextResponse.json(
      {
        ...data,
        latency_ms: latency,
        ...ceceStamp(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error in /api/cece:', err);
    return NextResponse.json(
      {
        error: 'Internal error in cece handler',
        detail: err.message || 'Unknown error',
        hint: 'The Railway backend may be starting up. Try again in a moment.',
        ...ceceStamp(),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
