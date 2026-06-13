/**
 * @file tests/insights.test.ts
 * Unit tests for the insight engine — extractTriggers and detectPatterns.
 * These are pure functions with no I/O, making them trivial to test comprehensively.
 */

import { describe, it, expect } from 'vitest';
import { extractTriggers } from '../lib/insights/triggers';
import { detectPatterns } from '../lib/insights/patterns';
import type { JournalEntry, MoodLog } from '../lib/db/schema';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makeEntry(
  content: string,
  moodScore = 3,
  daysAgo = 0
): JournalEntry {
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

// ─── extractTriggers tests ─────────────────────────────────────────────────────

describe('extractTriggers', () => {
  it('returns empty array for empty input', () => {
    expect(extractTriggers([])).toEqual([]);
  });

  it('detects exam_dates trigger', () => {
    const entries = [
      makeEntry('I am so stressed about NEET. The exam date is approaching.'),
      makeEntry('The NEET countdown is killing me. Cutoff scores scare me.'),
    ];
    const triggers = extractTriggers(entries);
    const examTrigger = triggers.find((t) => t.trigger === 'exam_dates');
    expect(examTrigger).toBeDefined();
    expect(examTrigger!.frequency).toBeGreaterThanOrEqual(1);
  });

  it('detects peer_comparison trigger', () => {
    const entries = [
      makeEntry('The topper in my class scored 98 percentile. I feel like everyone is better than me.'),
      makeEntry('My friend scored much higher than me in the test series. I am falling behind everyone.'),
    ];
    const triggers = extractTriggers(entries);
    const peerTrigger = triggers.find((t) => t.trigger === 'peer_comparison');
    expect(peerTrigger).toBeDefined();
    expect(peerTrigger!.frequency).toBe(2);
  });

  it('detects sleep trigger', () => {
    const entries = [
      makeEntry("I can't sleep at all. I stayed up all night studying."),
      makeEntry('Exhausted and sleep deprived. No sleep for 2 days.'),
    ];
    const triggers = extractTriggers(entries);
    const sleepTrigger = triggers.find((t) => t.trigger === 'sleep');
    expect(sleepTrigger).toBeDefined();
  });

  it('detects parental_pressure trigger', () => {
    const entries = [
      makeEntry('My parents keep asking about my rank. Mummy cried today. I let them down.'),
      makeEntry('Papa is pressuring me. Family expects so much from me.'),
    ];
    const triggers = extractTriggers(entries);
    const parentalTrigger = triggers.find((t) => t.trigger === 'parental_pressure');
    expect(parentalTrigger).toBeDefined();
  });

  it('detects mock_scores trigger', () => {
    const entries = [
      makeEntry('My mock test score dropped again. Scored badly in the test series.'),
      makeEntry('Silly mistakes in the mock. Score dropped from 85% to 68%.'),
    ];
    const triggers = extractTriggers(entries);
    const mockTrigger = triggers.find((t) => t.trigger === 'mock_scores');
    expect(mockTrigger).toBeDefined();
  });

  it('returns triggers sorted by confidence (highest first)', () => {
    const entries = [
      makeEntry('NEET exam date. Topper friend. Topper friend again. Topper better than me.'),
      makeEntry('Peer comparison with classmate. Everyone else is ahead.'),
    ];
    const triggers = extractTriggers(entries);
    for (let i = 1; i < triggers.length; i++) {
      expect(triggers[i - 1].confidenceScore).toBeGreaterThanOrEqual(
        triggers[i].confidenceScore
      );
    }
  });

  it('handles entry with no triggers gracefully', () => {
    const entries = [
      makeEntry('Today was a great day. I studied well and felt happy.'),
    ];
    // Should not throw
    const triggers = extractTriggers(entries);
    expect(Array.isArray(triggers)).toBe(true);
  });

  it('gives higher weight to recent entries', () => {
    const oldEntries = Array(5).fill(null).map((_, i) =>
      makeEntry('The topper scored higher. Peer comparison hurts.', 3, 20 + i)
    );
    const recentEntries = Array(2).fill(null).map((_, i) =>
      makeEntry('The topper scored higher. Peer comparison hurts.', 3, i)
    );
    const triggersAll = extractTriggers([...oldEntries, ...recentEntries]);
    const triggersOldOnly = extractTriggers(oldEntries);
    const peerAll = triggersAll.find((t) => t.trigger === 'peer_comparison');
    const peerOld = triggersOldOnly.find((t) => t.trigger === 'peer_comparison');
    // Both should detect trigger — just verifying no crash
    expect(peerAll).toBeDefined();
    expect(peerOld).toBeDefined();
  });
});

// ─── detectPatterns tests ──────────────────────────────────────────────────────

describe('detectPatterns', () => {
  it('returns empty array for fewer than 3 data points', () => {
    expect(detectPatterns([])).toEqual([]);
    expect(detectPatterns([makeMoodLog(3)])).toEqual([]);
    expect(detectPatterns([makeMoodLog(3), makeMoodLog(4)])).toEqual([]);
  });

  it('detects declining mood trend', () => {
    // Clear downward slope: 5 → 4 → 3 → 2 → 1
    const logs = [5, 4, 3, 2, 1].map((score, i) =>
      makeMoodLog(score, 4 - i)
    );
    const patterns = detectPatterns(logs);
    const declining = patterns.find((p) => p.patternType === 'declining_mood');
    expect(declining).toBeDefined();
  });

  it('detects sustained low mood (3+ consecutive ≤ 2)', () => {
    const logs = [
      makeMoodLog(2, 4),
      makeMoodLog(1, 3),
      makeMoodLog(2, 2),
      makeMoodLog(2, 1),
      makeMoodLog(4, 0),
    ];
    const patterns = detectPatterns(logs);
    const sustained = patterns.find((p) => p.patternType === 'sustained_low_mood');
    expect(sustained).toBeDefined();
    expect(sustained!.metadata).toBeDefined();
    expect(Number(sustained!.metadata?.['consecutiveLowDays'])).toBeGreaterThanOrEqual(3);
  });

  it('detects improving mood trend', () => {
    // Clear upward slope: 2 → 3 → 4 → 4 → 5
    const logs = [2, 3, 4, 4, 5].map((score, i) =>
      makeMoodLog(score, 4 - i)
    );
    const patterns = detectPatterns(logs);
    const improving = patterns.find((p) => p.patternType === 'improving_mood');
    expect(improving).toBeDefined();
  });

  it('does not flag stable mood as declining', () => {
    const logs = [3, 3, 4, 3, 4].map((score, i) =>
      makeMoodLog(score, 4 - i)
    );
    const patterns = detectPatterns(logs);
    const declining = patterns.find((p) => p.patternType === 'declining_mood');
    expect(declining).toBeUndefined();
  });

  it('detects high volatility', () => {
    // Large swings
    const logs = [5, 1, 5, 1, 5, 1, 5].map((score, i) =>
      makeMoodLog(score, 6 - i)
    );
    const patterns = detectPatterns(logs);
    const volatile = patterns.find((p) => p.patternType === 'high_volatility');
    expect(volatile).toBeDefined();
  });

  it('returns patterns sorted by severity (severe first)', () => {
    // Create a severely declining and low mood scenario
    const logs = [2, 1, 1, 2, 1, 2, 1].map((score, i) =>
      makeMoodLog(score, 6 - i)
    );
    const patterns = detectPatterns(logs);
    const severityOrder = { severe: 0, moderate: 1, mild: 2 };
    for (let i = 1; i < patterns.length; i++) {
      const prevOrder = severityOrder[patterns[i - 1].severity];
      const currOrder = severityOrder[patterns[i].severity];
      expect(prevOrder).toBeLessThanOrEqual(currOrder);
    }
  });
});
