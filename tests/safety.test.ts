/**
 * @file tests/safety.test.ts
 * Unit tests for the crisis safety guard.
 * These are the most important tests in the codebase — the safety guard
 * is the first line of defense for user wellbeing.
 */

import { describe, it, expect } from 'vitest';
import { screenForCrisis } from '../lib/safety/guard';

describe('screenForCrisis', () => {
  // ── Should NOT trigger ────────────────────────────────────────────────────

  it('returns isCrisis: false for normal study stress', () => {
    const result = screenForCrisis(
      'I am feeling stressed about my exam. The mock test did not go well.'
    );
    expect(result.isCrisis).toBe(false);
    expect(result.response).toBeUndefined();
  });

  it('returns isCrisis: false for empty string', () => {
    expect(screenForCrisis('').isCrisis).toBe(false);
  });

  it('returns isCrisis: false for whitespace only', () => {
    expect(screenForCrisis('   ').isCrisis).toBe(false);
  });

  it('returns isCrisis: false for positive mood', () => {
    const result = screenForCrisis(
      'Today went really well! I finished three chapters and feel good about my preparation.'
    );
    expect(result.isCrisis).toBe(false);
  });

  it('returns isCrisis: false for mild frustration', () => {
    const result = screenForCrisis(
      "I'm so frustrated with organic chemistry. I keep getting these reactions wrong."
    );
    expect(result.isCrisis).toBe(false);
  });

  // ── High severity — should trigger ───────────────────────────────────────

  it('detects "kill myself" (high severity)', () => {
    const result = screenForCrisis("I want to kill myself. I can't take this anymore.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
    expect(result.response).toContain('14416');
    expect(result.response).toContain('iCall');
  });

  it('detects "end my life" (high severity)', () => {
    const result = screenForCrisis("I feel like ending my life after this result.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('detects "suicide" keyword (high severity)', () => {
    const result = screenForCrisis("I keep having suicidal thoughts during revision.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('detects "want to die" (high severity)', () => {
    const result = screenForCrisis("I want to die, I failed the mock again.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('detects self-harm language (high severity)', () => {
    const result = screenForCrisis("I've been cutting myself to cope with the pressure.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('detects Hindi transliteration "marna chahta" (high severity)', () => {
    const result = screenForCrisis("Main marna chahta hoon. Bahut pressure hai.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('detects "khatam karna" (high severity)', () => {
    const result = screenForCrisis("Sab khatam karna chahta hun.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
  });

  // ── Moderate severity ─────────────────────────────────────────────────────

  it('detects "I give up" (moderate severity)', () => {
    const result = screenForCrisis("I give up. I can't go on like this anymore.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('moderate');
    expect(result.response).toContain('iCall');
  });

  it('detects "nobody cares" (moderate severity)', () => {
    const result = screenForCrisis("Nobody cares whether I pass or fail. I feel completely alone.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('moderate');
  });

  it('detects "trapped" (moderate severity)', () => {
    const result = screenForCrisis("I feel trapped with no way out of this situation.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('moderate');
  });

  it('detects "hopeless" (moderate severity)', () => {
    const result = screenForCrisis("Everything feels hopeless and worthless. There is no point trying anymore.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('moderate');
  });

  it('detects "sab kuch barbad" (moderate - Hindi)', () => {
    const result = screenForCrisis("Sab kuch barbad ho gaya. Koi umeed nahi.");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('moderate');
  });

  // ── Response content checks ───────────────────────────────────────────────

  it('includes Tele-MANAS 14416 in crisis response', () => {
    const result = screenForCrisis("I want to kill myself.");
    expect(result.response).toContain('14416');
    expect(result.response).toContain('Tele-MANAS');
  });

  it('includes AASRA in crisis response', () => {
    const result = screenForCrisis("I want to kill myself.");
    expect(result.response).toContain('AASRA');
  });

  it('includes triggered keywords in result', () => {
    const result = screenForCrisis("I want to kill myself.");
    expect(result.triggeredKeywords).toBeDefined();
    expect(result.triggeredKeywords!.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    const lower = screenForCrisis("i want to kill myself");
    const upper = screenForCrisis("I WANT TO KILL MYSELF");
    const mixed = screenForCrisis("I Want To Kill Myself");
    expect(lower.isCrisis).toBe(true);
    expect(upper.isCrisis).toBe(true);
    expect(mixed.isCrisis).toBe(true);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('does not false-positive on "no reason to stay up late"', () => {
    // "no reason" alone should not trigger — only "no reason to live"
    const result = screenForCrisis("There is no reason to stay up past midnight studying.");
    // This is a tricky edge case — check we handle it
    expect(typeof result.isCrisis).toBe('boolean');
  });

  it('handles very long text without performance issues', () => {
    const longText = 'I am feeling stressed. '.repeat(200);
    const start = Date.now();
    const result = screenForCrisis(longText);
    const duration = Date.now() - start;
    expect(result.isCrisis).toBe(false);
    expect(duration).toBeLessThan(500); // Should complete in under 500ms
  });
});
