import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateSessionId, setSessionCookie } from '@/lib/session';
import { screenForCrisis } from '@/lib/safety/guard';
import { getUserJournalEntries, getMoodLogs } from '@/lib/db/queries';
import { buildInsightContext } from '@/lib/insights';
import { chatCompanion, type ChatMessage } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/rate-limit';

const ChatSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(2000)
    .trim(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(20)
    .default([]),
});

/**
 * POST /api/chat
 * Safety guard → insight context → companion chat
 * Rate limited: 20 messages per minute per session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  // Rate limiting (more generous for chat)
  const rateCheck = checkRateLimit(`chat:${sessionId}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error:
          'You\'ve sent a lot of messages! Take a breath and try again in a minute. 🌿',
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { message, history } = parsed.data;

  // ── Safety guard (MUST run first) ────────────────────────────────────────
  const safetyResult = screenForCrisis(message);
  if (safetyResult.isCrisis) {
    const response = NextResponse.json({
      isCrisis: true,
      severity: safetyResult.severity,
      reply: safetyResult.response,
    });
    if (isNew) setSessionCookie(response, sessionId);
    return response;
  }

  // ── Build insight context ─────────────────────────────────────────────────
  const [entries, moodLogs] = await Promise.all([
    getUserJournalEntries(sessionId, 30),
    getMoodLogs(sessionId, 30),
  ]);
  const insights = buildInsightContext(entries, moodLogs);

  // ── Build full conversation history with current message ──────────────────
  const fullHistory: ChatMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  // ── Generate companion response ───────────────────────────────────────────
  const reply = await chatCompanion(fullHistory, insights);

  const response = NextResponse.json({
    isCrisis: false,
    reply,
  });
  if (isNew) setSessionCookie(response, sessionId);
  return response;
}
