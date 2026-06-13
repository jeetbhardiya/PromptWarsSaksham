/**
 * @fileoverview Insight Engine — re-exports and combined context builder.
 * Aggregates trigger and pattern analysis into a structured InsightContext
 * that the AI service consumes to personalize responses.
 */

export { extractTriggers } from './triggers';
export type { DetectedTrigger } from './triggers';

export { detectPatterns } from './patterns';
export type { DetectedPattern } from './patterns';

import type { JournalEntry, MoodLog } from '../db/schema';
import { extractTriggers } from './triggers';
import { detectPatterns } from './patterns';

/**
 * The structured context object passed to the AI service.
 * Contains all insight engine output needed to personalize Gemini's responses.
 */
export interface InsightContext {
  /** Top stress triggers detected from journal entries */
  topTriggers: Array<{
    label: string;
    trigger: string;
    frequency: number;
    confidenceScore: number;
  }>;
  /** Detected emotional patterns */
  patterns: Array<{
    patternType: string;
    label: string;
    severity: string;
    description: string;
  }>;
  /** Average mood score (1–5) over recent period */
  averageMood: number;
  /** Current mood score from most recent log */
  currentMood: number | null;
  /** Total number of journal entries analyzed */
  entryCount: number;
  /** Days since first entry (study of habit) */
  streakDays: number;
}

/**
 * Builds a comprehensive InsightContext from raw data.
 * This is the single entry point the AI service should call to get personalized context.
 *
 * @param entries - Recent journal entries for trigger analysis
 * @param moodLogs - Recent mood logs for pattern detection
 * @returns Structured InsightContext for AI prompt injection
 */
export function buildInsightContext(
  entries: JournalEntry[],
  moodLogs: MoodLog[]
): InsightContext {
  const triggers = extractTriggers(entries);
  const patterns = detectPatterns(moodLogs);

  const scores = moodLogs.map((m) => m.score);
  const averageMood =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 3;

  const currentMood =
    moodLogs.length > 0
      ? [...moodLogs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0].score
      : null;

  // Calculate streak (days from first entry to now)
  let streakDays = 0;
  if (entries.length > 0) {
    const oldest = entries.reduce((oldest, e) =>
      new Date(e.createdAt) < new Date(oldest.createdAt) ? e : oldest
    );
    streakDays = Math.ceil(
      (Date.now() - new Date(oldest.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    topTriggers: triggers.slice(0, 3).map((t) => ({
      label: t.label,
      trigger: t.trigger,
      frequency: t.frequency,
      confidenceScore: t.confidenceScore,
    })),
    patterns: patterns.map((p) => ({
      patternType: p.patternType,
      label: p.label,
      severity: p.severity,
      description: p.description,
    })),
    averageMood,
    currentMood,
    entryCount: entries.length,
    streakDays,
  };
}
