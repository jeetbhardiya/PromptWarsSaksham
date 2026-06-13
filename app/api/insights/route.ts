import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSessionId, setSessionCookie } from '@/lib/session';
import {
  getUserJournalEntries,
  getMoodLogs,
  saveTriggers,
  savePattern,
} from '@/lib/db/queries';
import { buildInsightContext, extractTriggers, detectPatterns } from '@/lib/insights';
import { generateCopingStrategy } from '@/lib/ai/gemini';

/**
 * GET /api/insights
 * Runs the full insight pipeline and returns structured data for the dashboard.
 * Orchestration: fetch data → insight engine → AI coping strategies → return
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(request);

  // Fetch raw data
  const [entries, moodLogs] = await Promise.all([
    getUserJournalEntries(sessionId, 30),
    getMoodLogs(sessionId, 30),
  ]);

  // Run insight engine (pure functions)
  const triggers = extractTriggers(entries);
  const patterns = detectPatterns(moodLogs);
  const context = buildInsightContext(entries, moodLogs);

  // Persist detected triggers and patterns
  if (triggers.length > 0) {
    await saveTriggers(
      triggers.map((t) => ({
        userId: sessionId,
        trigger: t.trigger,
        category: t.category,
        frequency: t.frequency,
        confidenceScore: t.confidenceScore,
      }))
    ).catch(console.error);
  }

  if (patterns.length > 0) {
    for (const p of patterns.slice(0, 2)) {
      await savePattern({
        userId: sessionId,
        patternType: p.patternType,
        severity: p.severity,
        description: p.description,
        metadata: p.metadata,
      }).catch(console.error);
    }
  }

  // Generate AI coping strategies for top 3 triggers (in parallel)
  const copingStrategies: Record<string, string> = {};
  await Promise.all(
    triggers.slice(0, 3).map(async (trigger) => {
      const strategy = await generateCopingStrategy(
        trigger.label,
        trigger.trigger,
        context
      );
      copingStrategies[trigger.trigger] = strategy;
    })
  );

  const response = NextResponse.json({
    triggers,
    patterns,
    copingStrategies,
    context: {
      averageMood: context.averageMood,
      currentMood: context.currentMood,
      entryCount: context.entryCount,
      streakDays: context.streakDays,
    },
    // Mood data for chart (chronological order)
    moodChart: [...moodLogs]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((m) => ({
        date: m.createdAt,
        score: m.score,
        emoji: m.emoji,
      })),
  });

  if (isNew) setSessionCookie(response, sessionId);
  return response;
}
