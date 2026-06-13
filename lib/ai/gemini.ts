/**
 * @fileoverview AI Service — Gemini integration for Saksham.
 *
 * SECURITY:
 * - GEMINI_API_KEY is read only from server-side env vars.
 * - This module must NEVER be imported in client components.
 * - The API key is never included in any response or log.
 *
 * SAFETY:
 * - All callers MUST run screenForCrisis() before calling these functions.
 * - These functions are only called when the safety guard has cleared the input.
 * - The system prompt explicitly instructs Gemini to never diagnose or prescribe.
 *
 * PERSONALIZATION:
 * - InsightContext from the insight engine is injected into every prompt.
 * - This ensures coping strategies are tailored to detected stress triggers.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Content,
} from '@google/generative-ai';
import type { InsightContext } from '../insights/index';

// ── Gemini client initialization ──────────────────────────────────────────────
// Key is read server-side only. Will throw at runtime if invalid.
const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey ?? 'missing-key-use-env');

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// ── System prompt ─────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are Saksham, a warm and compassionate mental wellness companion for students preparing for competitive exams in India (NEET, JEE, UPSC, GATE, CAT, CUET).

Your core principles:
1. You are NOT a therapist, doctor, or mental health professional. Never diagnose, prescribe, or give medical advice.
2. Be warm, empathetic, and understanding — like a caring older sibling who has been through the exam journey.
3. Acknowledge the unique pressures of Indian competitive exam preparation: family expectations, societal pressure, peer comparison, the years of sacrifice.
4. Keep responses concise and actionable — students are busy. Aim for 100–200 words unless the user needs more.
5. Use a conversational, friendly tone. Occasional Hindi phrases are welcome but always explain them.
6. Never be preachy or lecture the student. Meet them where they are.
7. Always end with something hopeful or a small actionable step.
8. If anything feels like a crisis, gently mention that professional support is available.`;

/**
 * Builds a context block from the insight engine output to inject into prompts.
 * This is what makes responses hyper-personalized.
 */
function buildContextBlock(insights: InsightContext): string {
  const parts: string[] = [];

  parts.push(`Student context:`);
  parts.push(`- Current mood: ${insights.currentMood ?? 'unknown'}/5`);
  parts.push(`- Average mood (recent): ${insights.averageMood}/5`);
  parts.push(`- Journal entries logged: ${insights.entryCount}`);
  parts.push(`- Days tracking: ${insights.streakDays}`);

  if (insights.topTriggers.length > 0) {
    parts.push(`- Top stress triggers detected:`);
    for (const t of insights.topTriggers) {
      parts.push(
        `  • ${t.label} (mentioned in ${t.frequency} entries, confidence: ${Math.round(t.confidenceScore * 100)}%)`
      );
    }
  }

  if (insights.patterns.length > 0) {
    parts.push(`- Emotional patterns detected:`);
    for (const p of insights.patterns) {
      parts.push(`  • ${p.label} (${p.severity}): ${p.description}`);
    }
  }

  return parts.join('\n');
}

/** Chat message type for history */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Exported AI functions ─────────────────────────────────────────────────────

/**
 * Generates a personalized AI reflection on a journal entry.
 * Context-aware: uses insight engine output to tailor the reflection.
 *
 * MUST only be called after screenForCrisis() has returned isCrisis: false.
 *
 * @param entry - The journal entry text
 * @param mood - Mood score 1–5
 * @param insights - InsightContext from the insight engine
 * @returns AI-generated reflection (100–200 words)
 */
export async function generateReflection(
  entry: string,
  mood: number,
  insights: InsightContext
): Promise<string> {
  const contextBlock = buildContextBlock(insights);

  const prompt = `${BASE_SYSTEM_PROMPT}

${contextBlock}

The student just wrote this journal entry (mood: ${mood}/5):
"${entry}"

Write a warm, empathetic reflection on what they've shared. Acknowledge their feelings specifically, validate the exam pressure context, and offer one small, practical coping suggestion tailored to their detected stress patterns. Keep it under 180 words. Be genuine, not generic.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('[Gemini] generateReflection error:', error);
    // Graceful fallback — never show error to user
    return `Thank you for sharing your thoughts today. Writing about how you feel is a powerful act of self-awareness, especially during exam preparation. Remember that every step forward, no matter how small, matters. Take a moment to breathe — you are doing better than you think. 💛`;
  }
}

/**
 * Generates a tailored coping strategy for a specific stress trigger.
 * The strategy is grounded in the student's actual detected patterns.
 *
 * @param triggerLabel - Human-readable trigger name (e.g., "Mock Tests & Score Anxiety")
 * @param triggerKey - Machine-readable trigger key (e.g., "mock_scores")
 * @param insights - Full InsightContext for personalization
 * @returns A practical, personalized coping strategy (80–150 words)
 */
export async function generateCopingStrategy(
  triggerLabel: string,
  triggerKey: string,
  insights: InsightContext
): Promise<string> {
  const contextBlock = buildContextBlock(insights);

  const prompt = `${BASE_SYSTEM_PROMPT}

${contextBlock}

The student's most prominent stress trigger is: "${triggerLabel}" (${triggerKey}).

Write ONE specific, actionable coping strategy for this trigger. It should:
- Be concise (under 120 words)
- Feel immediately doable, not overwhelming  
- Be specifically relevant to Indian competitive exam preparation culture
- Reference their actual situation based on the context above if relevant
- End with one encouraging sentence

Do not use bullet points. Write in warm, conversational prose.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('[Gemini] generateCopingStrategy error:', error);
    return `Focus on one small task at a time. Instead of thinking about everything you need to do, pick just one chapter or topic for the next study session. Celebrate completing it. Progress, not perfection, is what carries you forward. You've got this. 🌟`;
  }
}

/**
 * Powers the companion chat with full insight context injection.
 * The conversation history and insight context combine to create
 * context-aware, personalized responses.
 *
 * MUST only be called after screenForCrisis() has returned isCrisis: false.
 *
 * @param history - Chat message history (last 10 messages recommended)
 * @param insights - InsightContext for personalization
 * @returns AI companion response
 */
export async function chatCompanion(
  history: ChatMessage[],
  insights: InsightContext
): Promise<string> {
  const contextBlock = buildContextBlock(insights);

  // Build system prompt with injected insights
  const systemPromptWithContext = `${BASE_SYSTEM_PROMPT}

${contextBlock}

You have this context about the student from their journal and mood tracking. Use it naturally in conversation — don't be robotic about it. If they mention something that matches their detected triggers, gently acknowledge the pattern. Keep responses conversational and under 200 words unless they need more.`;

  // Convert history to Gemini format
  const geminiHistory: Content[] = history.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const lastMessage = history[history.length - 1];

  try {
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPromptWithContext }],
        },
        {
          role: 'model',
          parts: [
            {
              text: `Understood. I'm here as a warm, supportive companion. I can see this student's context and I'll tailor my support to what they're actually going through.`,
            },
          ],
        },
        ...geminiHistory,
      ],
    });

    const result = await chat.sendMessage(lastMessage?.content ?? '');
    return result.response.text();
  } catch (error) {
    console.error('[Gemini] chatCompanion error:', error);
    return `I'm here with you. Sometimes the pressure of exams can feel like too much — and that's completely understandable. Want to tell me more about what's on your mind? I'm listening. 💙`;
  }
}

/**
 * Recommends a mindfulness exercise based on current mood and detected patterns.
 *
 * @param mood - Current mood score 1–5
 * @param insights - InsightContext
 * @returns Recommended exercise name and brief rationale
 */
export async function recommendMindfulnessExercise(
  mood: number,
  insights: InsightContext
): Promise<{ exercise: string; rationale: string }> {
  const exercises = ['box_breathing', 'grounding_54321', 'progressive_muscle_relaxation'];

  // Deterministic recommendation based on mood (no LLM needed for this)
  if (mood <= 2) {
    return {
      exercise: 'grounding_54321',
      rationale:
        'When you\'re feeling really low, grounding exercises help bring you back to the present moment. The 5-4-3-2-1 technique gently anchors you in your senses.',
    };
  } else if (mood === 3) {
    return {
      exercise: 'box_breathing',
      rationale:
        'Box breathing is perfect when your mind is racing with exam thoughts. 4 counts in, hold, out, hold — it activates your parasympathetic nervous system in under 2 minutes.',
    };
  } else {
    return {
      exercise: 'progressive_muscle_relaxation',
      rationale:
        'Your mood is decent — PMR will help you maintain it by releasing the physical tension that accumulates during long study sessions.',
    };
  }
}
