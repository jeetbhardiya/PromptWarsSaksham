import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateSessionId, setSessionCookie } from '@/lib/session';
import { saveMoodLog, getMoodLogs } from '@/lib/db/queries';
import { detectPatterns } from '@/lib/insights/patterns';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😔',
  2: '😟',
  3: '😐',
  4: '😊',
  5: '😄',
};

const MoodLogSchema = z.object({
  score: z.number().int().min(1).max(5),
  note: z.string().max(200).optional(),
});

/**
 * POST /api/mood
 * Saves a mood log and runs pattern detection.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = MoodLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { score, note } = parsed.data;
  const emoji = MOOD_EMOJIS[score] ?? '😐';

  const log = await saveMoodLog({
    userId: sessionId,
    score,
    emoji,
    note: note ?? null,
  });

  // Run pattern detection on updated logs
  const allLogs = await getMoodLogs(sessionId, 30);
  const patterns = detectPatterns(allLogs);

  const response = NextResponse.json({
    log,
    patterns: patterns.slice(0, 3),
  });
  if (isNew) setSessionCookie(response, sessionId);
  return response;
}

/**
 * GET /api/mood
 * Returns mood history for charts.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);
  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get('days') ?? 30), 90);

  const logs = await getMoodLogs(sessionId, days);
  const patterns = detectPatterns(logs);

  const response = NextResponse.json({ logs, patterns });
  if (isNew) setSessionCookie(response, sessionId);
  return response;
}
