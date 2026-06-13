import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSessionId, setSessionCookie } from '@/lib/session';
import { getMoodLogs, getUserJournalEntries, saveWellnessCheckin } from '@/lib/db/queries';
import { recommendMindfulnessExercise } from '@/lib/ai/gemini';
import { buildInsightContext } from '@/lib/insights';
import { z } from 'zod';

const CheckinSchema = z.object({
  exercise: z.enum(['box_breathing', 'grounding_54321', 'progressive_muscle_relaxation']),
  duration: z.number().int().min(60).max(1800),
  moodBefore: z.number().int().min(1).max(5).optional(),
  moodAfter: z.number().int().min(1).max(5).optional(),
});

/**
 * GET /api/mindfulness
 * Returns AI-recommended exercise based on current mood
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  const [entries, moodLogs] = await Promise.all([
    getUserJournalEntries(sessionId, 10),
    getMoodLogs(sessionId, 7),
  ]);
  const insights = buildInsightContext(entries, moodLogs);

  const recommendation = await recommendMindfulnessExercise(
    insights.currentMood ?? 3,
    insights
  );

  const response = NextResponse.json({ recommendation, insights: { currentMood: insights.currentMood } });
  if (isNew) setSessionCookie(response, sessionId);
  return response;
}

/**
 * POST /api/mindfulness
 * Records a completed mindfulness exercise
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 422 });
  }

  await saveWellnessCheckin({
    userId: sessionId,
    ...parsed.data,
    moodBefore: parsed.data.moodBefore ?? null,
    moodAfter: parsed.data.moodAfter ?? null,
  });

  const response = NextResponse.json({ success: true });
  if (isNew) setSessionCookie(response, sessionId);
  return response;
}
