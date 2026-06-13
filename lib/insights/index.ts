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
import { extractTriggers, type DetectedTrigger } from './triggers';
import { detectPatterns, type DetectedPattern } from './patterns';

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
 * Accepts optional pre-computed triggers/patterns to avoid redundant computation
 * when callers (e.g. insights route) have already run the insight engine.
 *
 * @param entries - Recent journal entries for trigger analysis
 * @param moodLogs - Recent mood logs for pattern detection
 * @param precomputed - Optional pre-computed triggers and patterns
 * @returns Structured InsightContext for AI prompt injection
 */
export function buildInsightContext(
  entries: JournalEntry[],
  moodLogs: MoodLog[],
  precomputed?: { triggers?: DetectedTrigger[]; patterns?: DetectedPattern[] }
): InsightContext {
  const triggers = precomputed?.triggers ?? extractTriggers(entries);
  const patterns = precomputed?.patterns ?? detectPatterns(moodLogs);

  const scores = moodLogs.map((m) => m.score);
  const averageMood =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 3;

  // moodLogs from DB are ordered newest-first; no sort needed
  const currentMood = moodLogs.length > 0 ? moodLogs[0].score : null;

  // entries from DB are ordered newest-first; last element is oldest
  let streakDays = 0;
  if (entries.length > 0) {
    const oldest = entries[entries.length - 1];
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
