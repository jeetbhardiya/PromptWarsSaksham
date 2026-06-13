/**
 * @fileoverview Typed query helpers for all database operations.
 * All queries are scoped to a userId (anonymous session ID).
 * Never expose raw SQL — use these typed helpers throughout the app.
 */
import { db } from './index';
import {
  journalEntries,
  moodLogs,
  stressTriggers,
  emotionalPatterns,
  wellnessCheckins,
  type NewJournalEntry,
  type NewMoodLog,
  type NewStressTrigger,
  type NewEmotionalPattern,
  type NewWellnessCheckin,
  type JournalEntry,
  type MoodLog,
  type StressTrigger,
  type EmotionalPattern,
} from './schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { subDays } from 'date-fns';

// ─── Journal Entry Queries ────────────────────────────────────────────────────

/**
 * Retrieves the most recent journal entries for a user.
 * @param userId - Anonymous session ID
 * @param limit - Max entries to return (default 30)
 * @returns Array of journal entries, newest first
 */
export async function getUserJournalEntries(
  userId: string,
  limit = 30
): Promise<JournalEntry[]> {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(limit);
}

/**
 * Saves a new journal entry and returns the created record.
 * @param entry - Journal entry data (userId, content, moodScore required)
 * @returns The created journal entry
 */
export async function saveJournalEntry(
  entry: NewJournalEntry
): Promise<JournalEntry> {
  const [created] = await db
    .insert(journalEntries)
    .values(entry)
    .returning();
  return created;
}

/**
 * Updates the AI reflection on an existing journal entry.
 * @param id - Journal entry ID
 * @param reflection - AI-generated reflection text
 */
export async function updateJournalReflection(
  id: string,
  reflection: string
): Promise<void> {
  await db
    .update(journalEntries)
    .set({ aiReflection: reflection, updatedAt: new Date() })
    .where(eq(journalEntries.id, id));
}

// ─── Mood Log Queries ─────────────────────────────────────────────────────────

/**
 * Returns mood logs for a user over the past N days.
 * @param userId - Anonymous session ID
 * @param days - Number of days to look back (default 30)
 * @returns Array of mood logs, newest first
 */
export async function getMoodLogs(
  userId: string,
  days = 30
): Promise<MoodLog[]> {
  const since = subDays(new Date(), days);
  return db
    .select()
    .from(moodLogs)
    .where(
      and(
        eq(moodLogs.userId, userId),
        gte(moodLogs.createdAt, since)
      )
    )
    .orderBy(desc(moodLogs.createdAt));
}

/**
 * Saves a mood log entry.
 * @param log - Mood log data
 * @returns The created mood log
 */
export async function saveMoodLog(log: NewMoodLog): Promise<MoodLog> {
  const [created] = await db.insert(moodLogs).values(log).returning();
  return created;
}

// ─── Stress Trigger Queries ───────────────────────────────────────────────────

/**
 * Retrieves detected stress triggers for a user, ordered by frequency.
 * @param userId - Anonymous session ID
 * @returns Array of stress triggers, most frequent first
 */
export async function getStressTriggers(
  userId: string
): Promise<StressTrigger[]> {
  return db
    .select()
    .from(stressTriggers)
    .where(eq(stressTriggers.userId, userId))
    .orderBy(desc(stressTriggers.frequency));
}

/**
 * Upserts stress trigger records from insight engine analysis.
 * @param triggers - Array of triggers to save
 */
export async function saveTriggers(
  triggers: NewStressTrigger[]
): Promise<void> {
  if (triggers.length === 0) return;
  await db.insert(stressTriggers).values(triggers).onConflictDoNothing();
}

// ─── Emotional Pattern Queries ────────────────────────────────────────────────

/**
 * Retrieves recent emotional patterns detected for a user.
 * @param userId - Anonymous session ID
 * @returns Array of emotional patterns
 */
export async function getEmotionalPatterns(
  userId: string
): Promise<EmotionalPattern[]> {
  return db
    .select()
    .from(emotionalPatterns)
    .where(eq(emotionalPatterns.userId, userId))
    .orderBy(desc(emotionalPatterns.detectedAt))
    .limit(10);
}

/**
 * Saves a detected emotional pattern.
 * @param pattern - Pattern to save
 */
export async function savePattern(
  pattern: NewEmotionalPattern
): Promise<void> {
  await db.insert(emotionalPatterns).values(pattern);
}

// ─── Wellness Checkin Queries ─────────────────────────────────────────────────

/**
 * Saves a completed mindfulness exercise.
 * @param checkin - Wellness checkin data
 */
export async function saveWellnessCheckin(
  checkin: NewWellnessCheckin
): Promise<void> {
  await db.insert(wellnessCheckins).values(checkin);
}
