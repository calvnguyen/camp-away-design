import { NextRequest, NextResponse } from 'next/server';
import { intakeAgent } from '@/data/agents';
import type { IntakeAgentInput } from '@/data/agents/types';

export async function POST(req: NextRequest) {
  let body: IntakeAgentInput;
  try {
    body = (await req.json()) as IntakeAgentInput;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.userMessage || typeof body.userMessage !== 'string') {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
  }

  const result = await intakeAgent.run(body);
  return NextResponse.json(result);
}
