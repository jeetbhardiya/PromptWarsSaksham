/**
 * @fileoverview Stress trigger extraction from journal entries.
 *
 * This is the core "uncovers hidden patterns standard trackers miss" feature.
 * It uses keyword taxonomy + frequency scoring + recency weighting to identify
 * recurring stress themes specific to Indian competitive exam preparation.
 *
 * Categories tracked:
 * 1. exam_dates    — anxiety about upcoming exams, dates, results
 * 2. peer_comparison — comparison with classmates, toppers, rank anxiety
 * 3. sleep         — sleep deprivation, insomnia, fatigue
 * 4. parental_pressure — family expectations, parent-driven anxiety
 * 5. mock_scores   — mock test performance, score fluctuations
 * 6. time_pressure — not enough time, syllabus coverage anxiety
 * 7. self_doubt    — imposter syndrome, intelligence doubts
 *
 * All functions are pure (no I/O), deterministic, and unit-testable.
 */

import type { JournalEntry } from '../db/schema';

/** A detected stress trigger with frequency and confidence data */
export interface DetectedTrigger {
  /** Trigger category key */
  trigger: string;
  /** Human-readable category name */
  category: string;
  /** Human-readable display label */
  label: string;
  /** How many entries mention this trigger */
  frequency: number;
  /** Confidence score 0–1 based on keyword matches and context */
  confidenceScore: number;
  /** Sample phrases from entries (anonymized) */
  samplePhrases: string[];
  /** Brief description of what was detected */
  description: string;
}

/** Trigger taxonomy: each category has keyword arrays with weights */
const TRIGGER_TAXONOMY: Record<
  string,
  {
    label: string;
    keywords: Array<{ term: string; weight: number }>;
    description: string;
  }
> = {
  exam_dates: {
    label: 'Upcoming Exams & Deadlines',
    description: 'Anxiety around exam dates, registration deadlines, and results',
    keywords: [
      { term: 'exam', weight: 0.6 },
      { term: 'neet', weight: 1.0 },
      { term: 'jee', weight: 1.0 },
      { term: 'upsc', weight: 1.0 },
      { term: 'gate', weight: 1.0 },
      { term: 'cat exam', weight: 1.0 },
      { term: 'cuet', weight: 1.0 },
      { term: 'result', weight: 0.7 },
      { term: 'countdown', weight: 0.8 },
      { term: 'days left', weight: 0.9 },
      { term: 'cutoff', weight: 0.8 },
      { term: 'deadline', weight: 0.7 },
      { term: 'exam date', weight: 1.0 },
      { term: 'admission', weight: 0.6 },
      { term: 'rank', weight: 0.7 },
    ],
  },
  peer_comparison: {
    label: 'Comparison with Peers',
    description: 'Stress from comparing progress with classmates or "toppers"',
    keywords: [
      { term: 'topper', weight: 1.0 },
      { term: 'classmate', weight: 0.8 },
      { term: 'friend scored', weight: 1.0 },
      { term: 'everyone else', weight: 0.9 },
      { term: 'better than me', weight: 1.0 },
      { term: 'behind everyone', weight: 1.0 },
      { term: 'others are', weight: 0.7 },
      { term: 'comparison', weight: 0.8 },
      { term: 'they got', weight: 0.7 },
      { term: 'rank better', weight: 0.8 },
      { term: 'coaching batch', weight: 0.7 },
      { term: 'percentile', weight: 0.7 },
      { term: 'ahead of', weight: 0.6 },
    ],
  },
  sleep: {
    label: 'Sleep & Fatigue',
    description: 'Sleep deprivation, insomnia, and physical exhaustion from study',
    keywords: [
      { term: 'can\'t sleep', weight: 1.0 },
      { term: 'insomnia', weight: 1.0 },
      { term: 'tired', weight: 0.6 },
      { term: 'exhausted', weight: 0.8 },
      { term: 'no sleep', weight: 1.0 },
      { term: 'sleep deprived', weight: 1.0 },
      { term: 'stayed up', weight: 0.8 },
      { term: 'all night', weight: 0.8 },
      { term: 'can\'t focus', weight: 0.6 },
      { term: 'brain fog', weight: 0.7 },
      { term: 'fatigued', weight: 0.8 },
      { term: 'not sleeping', weight: 0.9 },
      { term: 'sleep at 3', weight: 0.8 },
      { term: 'wake up late', weight: 0.5 },
    ],
  },
  parental_pressure: {
    label: 'Parental & Family Expectations',
    description: 'Stress from family expectations, parental pressure, and fear of disappointing',
    keywords: [
      { term: 'parents', weight: 0.7 },
      { term: 'mummy', weight: 0.8 },
      { term: 'papa', weight: 0.8 },
      { term: 'mom', weight: 0.6 },
      { term: 'dad', weight: 0.6 },
      { term: 'family expects', weight: 1.0 },
      { term: 'disappoint', weight: 0.9 },
      { term: 'they sacrificed', weight: 1.0 },
      { term: 'family pressure', weight: 1.0 },
      { term: 'fees', weight: 0.5 },
      { term: 'coaching fees', weight: 0.9 },
      { term: 'let them down', weight: 1.0 },
      { term: 'ashamed', weight: 0.7 },
      { term: 'proud of me', weight: 0.6 },
      { term: 'told relatives', weight: 0.8 },
    ],
  },
  mock_scores: {
    label: 'Mock Tests & Score Anxiety',
    description: 'Anxiety from poor mock test scores and performance fluctuations',
    keywords: [
      { term: 'mock', weight: 0.9 },
      { term: 'practice test', weight: 0.8 },
      { term: 'test series', weight: 0.9 },
      { term: 'score dropped', weight: 1.0 },
      { term: 'bad score', weight: 0.9 },
      { term: 'scored badly', weight: 0.9 },
      { term: 'negative marking', weight: 0.8 },
      { term: 'silly mistakes', weight: 0.8 },
      { term: 'blanked out', weight: 0.8 },
      { term: 'panic during', weight: 0.9 },
      { term: 'failed the mock', weight: 1.0 },
      { term: 'accuracy', weight: 0.5 },
      { term: 'percentile dropped', weight: 1.0 },
    ],
  },
  time_pressure: {
    label: 'Time & Syllabus Pressure',
    description: 'Not enough time to cover syllabus, revision anxiety',
    keywords: [
      { term: 'not enough time', weight: 1.0 },
      { term: 'syllabus', weight: 0.7 },
      { term: 'revision', weight: 0.6 },
      { term: 'running out of time', weight: 1.0 },
      { term: 'behind schedule', weight: 0.9 },
      { term: 'chapters left', weight: 0.8 },
      { term: 'can\'t finish', weight: 0.8 },
      { term: 'so much to study', weight: 0.9 },
      { term: 'overwhelmed', weight: 0.7 },
      { term: 'procrastinating', weight: 0.7 },
      { term: 'wasted time', weight: 0.8 },
      { term: 'distracted', weight: 0.5 },
    ],
  },
  self_doubt: {
    label: 'Self-Doubt & Confidence',
    description: 'Imposter syndrome, intelligence doubts, and confidence erosion',
    keywords: [
      { term: 'not smart enough', weight: 1.0 },
      { term: 'stupid', weight: 0.8 },
      { term: 'can\'t do this', weight: 0.9 },
      { term: 'not cut out', weight: 1.0 },
      { term: 'why am i even', weight: 0.9 },
      { term: 'not capable', weight: 0.9 },
      { term: 'giving up', weight: 0.8 },
      { term: 'imposter', weight: 1.0 },
      { term: 'don\'t deserve', weight: 0.9 },
      { term: 'what\'s the point', weight: 0.8 },
      { term: 'never going to', weight: 0.7 },
      { term: 'failure', weight: 0.7 },
      { term: 'loser', weight: 0.8 },
    ],
  },
};

/** Precomputed max possible score per entry for confidence normalization (1.5 = max recency weight) */
const MAX_POSSIBLE_SCORE =
  Math.max(
    ...Object.values(TRIGGER_TAXONOMY).map((t) =>
      t.keywords.reduce((sum, k) => sum + k.weight, 0)
    )
  ) * 1.5;

/** Recency weight — entries from the last 7 days count more */
function getRecencyWeight(createdAt: Date): number {
  const daysSince =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 3) return 1.5;
  if (daysSince <= 7) return 1.2;
  if (daysSince <= 14) return 1.0;
  return 0.7;
}

/**
 * Extracts stress triggers from a list of journal entries.
 * Uses keyword frequency + recency weighting to rank triggers.
 *
 * This is the "uncovers hidden patterns standard trackers miss" feature.
 * It identifies recurring themes that a user may not consciously notice.
 *
 * @param entries - Array of journal entries to analyze
 * @returns Array of detected triggers, sorted by confidence score (highest first)
 *
 * @example
 * const triggers = extractTriggers(userEntries);
 * // [{ trigger: 'mock_scores', frequency: 5, confidenceScore: 0.87, ... }]
 */
export function extractTriggers(entries: JournalEntry[]): DetectedTrigger[] {
  if (entries.length === 0) return [];

  const triggerScores: Record<
    string,
    {
      weightedScore: number;
      frequency: number;
      samplePhrases: string[];
    }
  > = {};

  // Initialize all trigger categories
  for (const key of Object.keys(TRIGGER_TAXONOMY)) {
    triggerScores[key] = { weightedScore: 0, frequency: 0, samplePhrases: [] };
  }

  // Score each entry against each trigger category
  for (const entry of entries) {
    const text = entry.content.toLowerCase();
    const recencyWeight = getRecencyWeight(new Date(entry.createdAt));

    for (const [categoryKey, taxonomy] of Object.entries(TRIGGER_TAXONOMY)) {
      let entryScore = 0;
      for (const { term, weight } of taxonomy.keywords) {
        if (text.includes(term)) {
          entryScore += weight;
          // Collect sample phrase (first 60 chars around the match)
          const idx = text.indexOf(term);
          const start = Math.max(0, idx - 20);
          const end = Math.min(text.length, idx + term.length + 40);
          const phrase = entry.content.slice(start, end).trim();
          if (
            triggerScores[categoryKey].samplePhrases.length < 2 &&
            !triggerScores[categoryKey].samplePhrases.includes(phrase)
          ) {
            triggerScores[categoryKey].samplePhrases.push(`"...${phrase}..."`);
          }
        }
      }

      if (entryScore > 0) {
        triggerScores[categoryKey].weightedScore +=
          entryScore * recencyWeight;
        triggerScores[categoryKey].frequency += 1;
      }
    }
  }

  const results: DetectedTrigger[] = [];

  for (const [key, taxonomy] of Object.entries(TRIGGER_TAXONOMY)) {
    const scores = triggerScores[key];
    if (scores.frequency === 0) continue;

    const rawConfidence = scores.weightedScore / (entries.length * MAX_POSSIBLE_SCORE);
    const confidenceScore = Math.min(1, rawConfidence * 3); // scale up for visibility

    if (confidenceScore > 0.05) {
      results.push({
        trigger: key,
        category: key,
        label: taxonomy.label,
        frequency: scores.frequency,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        samplePhrases: scores.samplePhrases,
        description: taxonomy.description,
      });
    }
  }

  // Sort by confidence score descending
  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}
