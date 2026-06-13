import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/session';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  journalEntries,
  moodLogs,
  stressTriggers,
  emotionalPatterns,
} from '@/lib/db/schema';

const DEMO_SESSION_ID = 'demo-saksham-judge-2024';

const DEMO_ENTRIES = [
  {
    content:
      "Today was rough. Mock test results came back and I scored 156 out of 720 on the NEET mock. Everyone in my coaching batch seems to be scoring 400+. I don't know what I'm doing wrong. Papa keeps asking about my progress and I just lie and say it's going well. Can't sleep thinking about the exam. It's only 45 days away and I feel so behind.",
    moodScore: 2,
    aiReflection:
      "I hear you — 45 days out, mock scores not where you want them, and carrying the weight of expectations you feel you can't meet. That's a heavy load. One thing worth knowing: mock scores at this stage are data, not destiny. Many toppers had their breakthroughs in the final month. Instead of comparing your score to others, can you identify just 2-3 specific topics where you lost the most marks today? That focused approach often works better than trying to fix everything at once. And please — find a moment today to tell someone you trust what you're actually feeling. Carrying this alone makes it heavier. 💙",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    content:
      "Barely slept last night. Was up till 3am doing Organic Chemistry but my brain just wasn't retaining anything. When I'm this tired I make silly mistakes in negative marking sections. My friend Rahul got 98 percentile in the test series and I'm at 68. I know comparison is bad but I can't help it. Mummy cried today saying she's worried about me.",
    moodScore: 2,
    aiReflection:
      "Sleep deprivation is genuinely one of the biggest performance killers in competitive exams — more than most students realize. Your brain consolidates memory during sleep, so studying until 3am actually reduces retention of what you studied. This isn't a motivation problem, it's a biology problem. For tonight: set a hard cutoff at 11pm, even if you haven't finished. The 7 hours of sleep will do more for your score than those 3 extra hours of exhausted studying. As for Rahul — his journey isn't yours. You have 45 days, which is a lot. Start fresh tomorrow, one good night at a time. 🌙",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    content:
      "Had a small win today. Finally understood the mechanism behind SN1 and SN2 reactions — something that's confused me for months. Scored 78% on the physics mini-test. Still worried about the exam but today felt slightly better. Trying to stick to a schedule but it keeps slipping when I get anxious about deadlines. My mind keeps going to 'what if I don't get a rank'.",
    moodScore: 3,
    aiReflection:
      "A 78% physics score and finally cracking SN1/SN2 — those are real wins! Notice how it felt different today when you focused on understanding over comparison. That clarity is your natural state, and it's accessible more often than you think. The 'what if I don't get a rank' spiral is extremely common among NEET aspirants, and it's worth noticing when it shows up so you can interrupt it. When that thought comes, try replacing it with: 'What can I do well in the next 2 hours?' You can't control the rank, but you can control the quality of this study session. Keep building those wins. 🌱",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    content:
      "Parents had a long talk with me today. Dad reminded me about the coaching fees — almost 2 lakhs — and said the whole family is counting on me. I know they mean well but it just adds more pressure. I tried to study after but couldn't concentrate. Kept thinking about disappointing them if I don't crack it. The exam is in 40 days and I feel paralyzed.",
    moodScore: 2,
    aiReflection:
      "The weight of family sacrifice and financial investment is one of the heaviest burdens unique to Indian exam culture. Your parents shared that from love, even if the timing and delivery weren't helpful. Here's something worth sitting with: your worth as a person and as their child is not conditional on this exam result. Full stop. That said, the paralysis you're feeling is real and it's counterproductive to study. Try a 10-minute physical walk right now — outside if possible. Movement breaks the freeze response. Then set one tiny, winnable task for the next 30 minutes. Momentum beats paralysis every time. You're not alone in this. 🤍",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    content:
      "Tried the breathing exercise from the app today before my study session. It actually helped a bit. Finished 3 chapters of Biology which is more than I've done in days. Still stressed about mock scores and the NEET date, but feeling slightly more in control. Going to try to sleep by 11pm tonight. One day at a time I guess.",
    moodScore: 4,
    aiReflection:
      "This is growth — you tried something (the breathing exercise), it helped, you built momentum, and now you're going to protect your sleep. That's not 'one day at a time,' that's you understanding yourself better. Three biology chapters is solid work. The 'slightly more in control' feeling is your natural baseline showing through. Hold onto the insight that small, intentional actions compound. The exam isn't 40 days away — you have 40 × 24 hours, and you get to choose how to fill them. Tonight: sleep at 11. Tomorrow: repeat. You're on the right track. ✨",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const DEMO_MOOD_LOGS = [
  { score: 2, emoji: '😟', note: 'Mock result anxiety', daysAgo: 6 },
  { score: 1, emoji: '😔', note: 'Exhausted, no sleep', daysAgo: 5 },
  { score: 3, emoji: '😐', note: 'Small win on physics', daysAgo: 4 },
  { score: 2, emoji: '😟', note: 'Family pressure heavy', daysAgo: 3 },
  { score: 3, emoji: '😐', note: 'Manageable', daysAgo: 2 },
  { score: 4, emoji: '😊', note: 'Breathing helped!', daysAgo: 1 },
  { score: 3, emoji: '😐', note: 'Studying today', daysAgo: 0 },
];

/**
 * GET /api/seed
 * Seeds demo data for judges and sets the browser session cookie to the demo ID.
 * Protected by DEMO_SECRET in production.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Security: only allow in dev or with secret
  if (process.env.NODE_ENV === 'production') {
    const secret = request.headers.get('x-demo-secret') || request.nextUrl.searchParams.get('secret');
    if (secret !== process.env.DEMO_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    // Clear existing demo data
    await db.delete(journalEntries).where(eq(journalEntries.userId, DEMO_SESSION_ID)).catch(() => {});
    await db.delete(moodLogs).where(eq(moodLogs.userId, DEMO_SESSION_ID)).catch(() => {});
    await db.delete(stressTriggers).where(eq(stressTriggers.userId, DEMO_SESSION_ID)).catch(() => {});
    await db.delete(emotionalPatterns).where(eq(emotionalPatterns.userId, DEMO_SESSION_ID)).catch(() => {});

    // Insert demo journal entries
    for (const entry of DEMO_ENTRIES) {
      await db.insert(journalEntries).values({
        userId: DEMO_SESSION_ID,
        ...entry,
        updatedAt: entry.createdAt,
      });
    }

    // Insert demo mood logs
    for (const log of DEMO_MOOD_LOGS) {
      await db.insert(moodLogs).values({
        userId: DEMO_SESSION_ID,
        score: log.score,
        emoji: log.emoji,
        note: log.note,
        createdAt: new Date(Date.now() - log.daysAgo * 24 * 60 * 60 * 1000),
      });
    }

    // Insert demo triggers and patterns
    await db.insert(stressTriggers).values({
      userId: DEMO_SESSION_ID,
      trigger: 'mock_scores',
      category: 'mock_scores',
      frequency: 3,
      confidenceScore: 0.95,
    });

    await db.insert(stressTriggers).values({
      userId: DEMO_SESSION_ID,
      trigger: 'peer_comparison',
      category: 'peer_comparison',
      frequency: 2,
      confidenceScore: 0.85,
    });

    await db.insert(stressTriggers).values({
      userId: DEMO_SESSION_ID,
      trigger: 'parental_pressure',
      category: 'parental_pressure',
      frequency: 2,
      confidenceScore: 0.75,
    });

    await db.insert(emotionalPatterns).values({
      userId: DEMO_SESSION_ID,
      patternType: 'sustained_low_mood',
      severity: 'moderate',
      description: 'Mood logged at 2/5 or below for 3 consecutive days',
      metadata: { consecutiveLowDays: 3 },
    });

    const response = NextResponse.json({
      success: true,
      message: `Seeded demo session: ${DEMO_SESSION_ID} and set browser cookie!`,
      demoSessionId: DEMO_SESSION_ID,
      entries: DEMO_ENTRIES.length,
      moodLogs: DEMO_MOOD_LOGS.length,
    });

    // CRITICAL: Set the session cookie so the browser actually uses this demo data!
    return setSessionCookie(response, DEMO_SESSION_ID);
    
  } catch (error) {
    console.error('[Seed] Error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}
