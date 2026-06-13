/**
 * @file tests/core.test.ts
 * Unit tests for buildInsightContext, checkRateLimit, and recommendMindfulnessExercise.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildInsightContext } from '../lib/insights/index';
import { checkRateLimit } from '../lib/rate-limit';
import { recommendMindfulnessExercise } from '../lib/ai/gemini';
import type { JournalEntry, MoodLog } from '../lib/db/schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(content: string, moodScore = 3, daysAgo = 0): JournalEntry {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `entry-${Math.random()}`,
    userId: 'test-user',
    content,
    moodScore,
    aiReflection: null,
    createdAt: date,
    updatedAt: date,
  };
}

function makeMoodLog(score: number, daysAgo = 0): MoodLog {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `mood-${Math.random()}`,
    userId: 'test-user',
    score,
    emoji: '😐',
    note: null,
    createdAt: date,
  };
}

// ─── buildInsightContext tests ────────────────────────────────────────────────

describe('buildInsightContext', () => {
  it('returns sensible defaults for empty input', () => {
    const ctx = buildInsightContext([], []);
    expect(ctx.averageMood).toBe(3);
    expect(ctx.currentMood).toBeNull();
    expect(ctx.entryCount).toBe(0);
    expect(ctx.streakDays).toBe(0);
    expect(ctx.topTriggers).toEqual([]);
    expect(ctx.patterns).toEqual([]);
  });

  it('computes averageMood correctly', () => {
    const logs = [makeMoodLog(4), makeMoodLog(2), makeMoodLog(3)];
    const ctx = buildInsightContext([], logs);
    expect(ctx.averageMood).toBe(3);
  });

  it('sets currentMood from the first (newest) mood log', () => {
    // DB returns newest first; first element is most recent
    const logs = [makeMoodLog(5, 0), makeMoodLog(1, 5)];
    const ctx = buildInsightContext([], logs);
    expect(ctx.currentMood).toBe(5);
  });

  it('limits topTriggers to 3', () => {
    const entries = [
      makeEntry('NEET exam date cutoff topper friend scored. No sleep. Syllabus. Papa pressure.', 2, 0),
      makeEntry('NEET cutoff topper friend scored more. Exhausted. Not enough time. Family expects.', 2, 1),
    ];
    const ctx = buildInsightContext(entries, []);
    expect(ctx.topTriggers.length).toBeLessThanOrEqual(3);
  });

  it('counts entries correctly', () => {
    const entries = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
    const ctx = buildInsightContext(entries, []);
    expect(ctx.entryCount).toBe(3);
  });

  it('computes streakDays from newest-first ordered entries', () => {
    // Entries ordered newest-first (as DB returns them)
    const entries = [makeEntry('recent', 3, 0), makeEntry('old', 3, 10)];
    const ctx = buildInsightContext(entries, []);
    expect(ctx.streakDays).toBeGreaterThanOrEqual(10);
    expect(ctx.streakDays).toBeLessThanOrEqual(12);
  });

  it('accepts pre-computed triggers and patterns to skip recomputation', () => {
    const entries = [makeEntry('NEET exam date is near', 3, 0)];
    const logs = [makeMoodLog(3, 0), makeMoodLog(3, 1), makeMoodLog(3, 2)];

    // Call once to get reference values
    const ctxA = buildInsightContext(entries, logs);

    // Call again with pre-computed — must produce identical output
    const ctxB = buildInsightContext(entries, logs, {
      triggers: ctxA.topTriggers as any,
      patterns: ctxA.patterns as any,
    });

    expect(ctxB.averageMood).toBe(ctxA.averageMood);
    expect(ctxB.currentMood).toBe(ctxA.currentMood);
    expect(ctxB.entryCount).toBe(ctxA.entryCount);
  });
});

// ─── checkRateLimit tests ─────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  const uniqueId = () => `rl-test-${Math.random().toString(36).slice(2)}`;

  it('allows the first request', () => {
    const result = checkRateLimit(uniqueId(), 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it('counts remaining tokens down correctly', () => {
    const id = uniqueId();
    const r1 = checkRateLimit(id, 5, 60_000);
    const r2 = checkRateLimit(id, 5, 60_000);
    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(3);
  });

  it('blocks once limit is exhausted', () => {
    const id = uniqueId();
    for (let i = 0; i < 3; i++) checkRateLimit(id, 3, 60_000);
    const blocked = checkRateLimit(id, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('returns resetMs > 0 when blocked', () => {
    const id = uniqueId();
    for (let i = 0; i < 2; i++) checkRateLimit(id, 2, 60_000);
    const blocked = checkRateLimit(id, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it('different session IDs are independent', () => {
    const idA = uniqueId();
    const idB = uniqueId();
    for (let i = 0; i < 2; i++) checkRateLimit(idA, 2, 60_000);
    const blockedA = checkRateLimit(idA, 2, 60_000);
    const allowedB = checkRateLimit(idB, 2, 60_000);
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});

// ─── recommendMindfulnessExercise tests ──────────────────────────────────────

describe('recommendMindfulnessExercise', () => {
  const emptyInsights = {
    topTriggers: [],
    patterns: [],
    averageMood: 3,
    currentMood: null,
    entryCount: 0,
    streakDays: 0,
  };

  it('recommends grounding_54321 for mood <= 2', async () => {
    const result = await recommendMindfulnessExercise(1, emptyInsights);
    expect(result.exercise).toBe('grounding_54321');
    expect(result.rationale).toBeTruthy();
  });

  it('recommends grounding_54321 for mood = 2', async () => {
    const result = await recommendMindfulnessExercise(2, emptyInsights);
    expect(result.exercise).toBe('grounding_54321');
  });

  it('recommends box_breathing for mood = 3', async () => {
    const result = await recommendMindfulnessExercise(3, emptyInsights);
    expect(result.exercise).toBe('box_breathing');
    expect(result.rationale).toBeTruthy();
  });

  it('recommends progressive_muscle_relaxation for mood = 4', async () => {
    const result = await recommendMindfulnessExercise(4, emptyInsights);
    expect(result.exercise).toBe('progressive_muscle_relaxation');
  });

  it('recommends progressive_muscle_relaxation for mood = 5', async () => {
    const result = await recommendMindfulnessExercise(5, emptyInsights);
    expect(result.exercise).toBe('progressive_muscle_relaxation');
  });

  it('always returns a non-empty rationale', async () => {
    for (const mood of [1, 2, 3, 4, 5]) {
      const result = await recommendMindfulnessExercise(mood, emptyInsights);
      expect(result.rationale.length).toBeGreaterThan(0);
    }
  });
});
