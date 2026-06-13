import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateSessionId, setSessionCookie } from '@/lib/session';
import { screenForCrisis } from '@/lib/safety/guard';
import {
  saveJournalEntry,
  updateJournalReflection,
  getUserJournalEntries,
  getMoodLogs,
} from '@/lib/db/queries';
import { buildInsightContext } from '@/lib/insights';
import { generateReflection } from '@/lib/ai/gemini';
import { checkRateLimit } from '@/lib/rate-limit';

/** Zod schema for journal submission */
const JournalSubmitSchema = z.object({
  content: z
    .string()
    .min(10, 'Please write at least 10 characters')
    .max(5000, 'Entry too long (max 5000 characters)')
    .trim(),
  moodScore: z
    .number()
    .int()
    .min(1)
    .max(5),
});

/**
 * POST /api/journal
 * Orchestration: safety guard → save → insights → AI reflection
 * Rate limited: 10 entries per minute per session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  // Rate limiting
  const rateCheck = checkRateLimit(`journal:${sessionId}`, 10, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and breathe. 🌿' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)),
        },
      }
    );
  }

  // Parse and validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = JournalSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { content, moodScore } = parsed.data;

  // ── Step 1: Safety guard (MUST run first) ────────────────────────────────
  const safetyResult = screenForCrisis(content);
  if (safetyResult.isCrisis) {
    // Save the entry (so we don't lose it) but return crisis response
    const entry = await saveJournalEntry({
      userId: sessionId,
      content,
      moodScore,
      aiReflection: safetyResult.response,
    }).catch(() => null);

    const response = NextResponse.json({
      isCrisis: true,
      severity: safetyResult.severity,
      reflection: safetyResult.response,
      entryId: entry?.id ?? null,
    });
    if (isNew) setSessionCookie(response, sessionId);
    return response;
  }

  // ── Step 2: Save entry ───────────────────────────────────────────────────
  const entry = await saveJournalEntry({
    userId: sessionId,
    content,
    moodScore,
  });

  // ── Step 3: Build insight context ────────────────────────────────────────
  const [recentEntries, recentMoodLogs] = await Promise.all([
    getUserJournalEntries(sessionId, 30),
    getMoodLogs(sessionId, 30),
  ]);
  const insights = buildInsightContext(recentEntries, recentMoodLogs);

  // ── Step 4: Generate AI reflection ──────────────────────────────────────
  const reflection = await generateReflection(content, moodScore, insights);

  // Update entry with reflection
  await updateJournalReflection(entry.id, reflection);

  const response = NextResponse.json({
    isCrisis: false,
    entryId: entry.id,
    reflection,
    insights: {
      topTriggers: insights.topTriggers.slice(0, 2),
      averageMood: insights.averageMood,
    },
  });

  if (isNew) setSessionCookie(response, sessionId);
  return response;
}

/**
 * GET /api/journal
 * Returns recent journal entries for the session
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  const entries = await getUserJournalEntries(sessionId, 20);

  const response = NextResponse.json({ entries });
  if (isNew) setSessionCookie(response, sessionId);
  return response;
}
