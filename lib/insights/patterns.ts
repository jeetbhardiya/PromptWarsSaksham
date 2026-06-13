/**
 * @fileoverview Emotional pattern detection from mood log history.
 *
 * Analyzes mood trends over time to detect concerning patterns:
 * - Declining mood trend (linear regression slope < -0.1)
 * - Sustained low mood (3+ consecutive days ≤ 2/5)
 * - High volatility (large swings day-to-day)
 * - Weekend/weekday differential
 *
 * All functions are pure (no I/O), deterministic, and unit-testable.
 */

import type { MoodLog } from '../db/schema';

/** A detected emotional pattern with severity and description */
export interface DetectedPattern {
  /** Machine-readable pattern type */
  patternType: string;
  /** Human-readable label */
  label: string;
  /** Severity of the pattern */
  severity: 'mild' | 'moderate' | 'severe';
  /** Human-readable description */
  description: string;
  /** Supporting data for the pattern */
  metadata: Record<string, unknown>;
}

/**
 * Computes a simple linear regression slope over an array of values.
 * A negative slope indicates a downward trend.
 *
 * @param values - Array of numeric values (in chronological order)
 * @returns The slope (positive = upward, negative = downward)
 */
function computeSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Computes the standard deviation of an array of numbers.
 * Used to detect mood volatility.
 *
 * @param values - Array of numeric values
 * @returns Standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Detects emotional patterns from mood log history.
 * Uses statistical analysis to identify concerning trends.
 *
 * @param moodLogs - Array of mood logs to analyze (should be sorted newest first from DB)
 * @returns Array of detected patterns, ordered by severity
 *
 * @example
 * const patterns = detectPatterns(moodLogs);
 * // [{ patternType: 'declining_mood', severity: 'moderate', ... }]
 */
export function detectPatterns(moodLogs: MoodLog[]): DetectedPattern[] {
  if (moodLogs.length < 3) return []; // Need at least 3 data points

  const patterns: DetectedPattern[] = [];

  // Sort chronologically (oldest first) for trend analysis
  const sorted = [...moodLogs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scores = sorted.map((m) => m.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // ── Pattern 1: Declining mood trend ──────────────────────────────────────
  const slope = computeSlope(scores);

  if (slope < -0.15) {
    const severity = slope < -0.3 ? 'severe' : slope < -0.2 ? 'moderate' : 'mild';
    patterns.push({
      patternType: 'declining_mood',
      label: 'Declining Mood Trend',
      severity,
      description: `Your mood has been trending downward over the past ${sorted.length} check-ins. This may be a sign that stress is building up.`,
      metadata: {
        slope: Math.round(slope * 100) / 100,
        averageScore: Math.round(avgScore * 10) / 10,
        dataPoints: sorted.length,
      },
    });
  }

  // ── Pattern 2: Sustained low mood ────────────────────────────────────────
  // Check for 3+ consecutive entries with score ≤ 2
  let maxConsecutiveLow = 0;
  let currentConsecutiveLow = 0;
  for (const score of scores) {
    if (score <= 2) {
      currentConsecutiveLow++;
      maxConsecutiveLow = Math.max(maxConsecutiveLow, currentConsecutiveLow);
    } else {
      currentConsecutiveLow = 0;
    }
  }

  if (maxConsecutiveLow >= 3) {
    const severity =
      maxConsecutiveLow >= 5 ? 'severe' : maxConsecutiveLow >= 4 ? 'moderate' : 'mild';
    patterns.push({
      patternType: 'sustained_low_mood',
      label: 'Sustained Low Mood',
      severity,
      description: `You've logged a mood of 2 or below for ${maxConsecutiveLow} consecutive check-ins. Persistent low mood during exam prep deserves extra self-care.`,
      metadata: {
        consecutiveLowDays: maxConsecutiveLow,
        threshold: 2,
      },
    });
  }

  // ── Pattern 3: High mood volatility ──────────────────────────────────────
  const stdDev = standardDeviation(scores);
  if (stdDev > 1.4 && sorted.length >= 5) {
    patterns.push({
      patternType: 'high_volatility',
      label: 'Mood Volatility',
      severity: stdDev > 1.8 ? 'moderate' : 'mild',
      description: `Your mood is fluctuating significantly — swinging between highs and lows. This kind of volatility can be draining and may be linked to inconsistent study patterns or sleep.`,
      metadata: {
        standardDeviation: Math.round(stdDev * 100) / 100,
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
      },
    });
  }

  // ── Pattern 4: Consistently low average ──────────────────────────────────
  if (avgScore < 2.2 && sorted.length >= 5) {
    patterns.push({
      patternType: 'chronically_low',
      label: 'Chronically Low Mood',
      severity: avgScore < 1.8 ? 'severe' : 'moderate',
      description: `Your average mood over ${sorted.length} check-ins is ${Math.round(avgScore * 10) / 10}/5. Chronic low mood during exam prep can affect both wellbeing and performance.`,
      metadata: {
        averageScore: Math.round(avgScore * 100) / 100,
        dataPoints: sorted.length,
      },
    });
  }

  // ── Pattern 5: Improving trend (positive) ────────────────────────────────
  if (slope > 0.2 && avgScore >= 3) {
    patterns.push({
      patternType: 'improving_mood',
      label: 'Improving Mood Trend',
      severity: 'mild', // repurposing severity for UI — this is positive
      description: `Great news — your mood has been trending upward! Keep up whatever you're doing. 🌱`,
      metadata: {
        slope: Math.round(slope * 100) / 100,
        averageScore: Math.round(avgScore * 10) / 10,
      },
    });
  }

  // Sort by severity (severe first)
  const severityOrder = { severe: 0, moderate: 1, mild: 2 };
  return patterns.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}
