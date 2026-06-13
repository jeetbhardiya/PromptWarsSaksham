/**
 * @fileoverview Crisis Safety Guard for Saksham.
 *
 * CRITICAL SAFETY FEATURE:
 * This module runs on EVERY journal entry and chat message BEFORE the LLM is called.
 * If crisis signals are detected, the LLM is bypassed entirely and a pre-written
 * compassionate response with India-specific helplines is returned.
 *
 * This is a pure, deterministic function — no network calls, no LLM involvement.
 * It is the primary safety and ethics control in this system.
 *
 * India-specific helplines included:
 * - Tele-MANAS: 14416 (Government of India mental health helpline)
 * - iCall: 9152987821 (TISS - Tata Institute of Social Sciences)
 * - AASRA: 9820466627 (24/7 crisis helpline)
 * - Vandrevala Foundation: 1860-2662-345 (24/7)
 */

/** Result of crisis screening */
export interface CrisisScreenResult {
  /** Whether crisis signals were detected */
  isCrisis: boolean;
  /** Severity level if crisis detected */
  severity?: 'low' | 'moderate' | 'high';
  /** Pre-written compassionate response to return (bypasses LLM) */
  response?: string;
  /** Keywords that triggered the detection (for logging, not shown to user) */
  triggeredKeywords?: string[];
}

/**
 * High-severity crisis keywords — indicate immediate risk.
 * Covers English + common Hindi transliterations.
 */
const HIGH_SEVERITY_PATTERNS: RegExp[] = [
  // English explicit self-harm
  /\b(kill\s+myself|end\s+my\s+life|ending\s+my\s+life|take\s+my\s+own\s+life|want\s+to\s+die|wish\s+i\s+was\s+dead)\b/i,
  /\b(suicide|suicidal|hang\s+myself|overdose\s+on|slit\s+my\s+wrists)\b/i,
  /\b(no\s+reason\s+to\s+live|life\s+is\s+not\s+worth)\b/i,
  /\b(cut\s+myself|cutting\s+myself|hurting\s+myself|self.harm|self.hurt)\b/i,
  // Hindi transliterations
  /\b(khatam\s+karna|mar\s+jana\s+chahta|zindagi\s+khatam|marna\s+chahta)\b/i,
  /\b(jeena\s+nahi|jine\s+ka\s+mann\s+nahi|maut\s+chahiye)\b/i,
  /\b(zyada\s+nahi\s+jee\s+sakta|nahi\s+rehna\s+chahta)\b/i,
];

/**
 * Moderate-severity patterns — significant distress, warrants gentle check-in response.
 */
const MODERATE_SEVERITY_PATTERNS: RegExp[] = [
  /\b(i\s+can't\s+go\s+on|can't\s+take\s+it\s+anymore|i\s+give\s+up)\b/i,
  /\b(nobody\s+cares|completely\s+alone|no\s+one\s+would\s+miss)\b/i,
  /\b(hopeless|worthless|pointless\s+to\s+try|nothing\s+matters)\b/i,
  /\b(trapped|no\s+way\s+out|never\s+get\s+better)\b/i,
  /\b(har\s+gaya|sab\s+kuch\s+barbad|koi\s+umeed\s+nahi)\b/i,
];

/** Pre-written high-severity crisis response with India helplines */
const HIGH_SEVERITY_RESPONSE = `I can hear that you're in a really dark place right now, and I want you to know that what you're feeling matters deeply.

**Please reach out for immediate support:**

🆘 **Tele-MANAS** (Government helpline): **14416** *(24/7, free, multiple languages)*
📞 **iCall** (TISS): **9152987821** *(Mon–Sat, 8am–10pm)*
💙 **AASRA**: **9820466627** *(24/7)*
🌟 **Vandrevala Foundation**: **1860-2662-345** *(24/7)*

You are not alone in this. The pressure of competitive exams can feel unbearable — but this moment will pass. Talking to someone who understands can make a real difference.

If you're in immediate danger, please go to the nearest hospital or call 112.

I'm here with you, and I care about your wellbeing. 💛`;

/** Pre-written moderate distress response */
const MODERATE_SEVERITY_RESPONSE = `It sounds like you're carrying something really heavy right now. The weight of exam pressure, expectations, and uncertainty can feel completely overwhelming sometimes.

You don't have to go through this alone. If things feel too much, please consider reaching out:

📞 **iCall** (TISS): **9152987821**
💙 **Tele-MANAS**: **14416** *(free, 24/7)*

Remember: struggling doesn't mean you're weak. It means you're human, carrying more than anyone should carry alone.

I'm here to listen. Would you like to share more about what's been weighing on you?`;

/**
 * Screens text for crisis signals before passing to the LLM.
 *
 * This function MUST be called on every journal entry and chat message.
 * If it returns isCrisis: true, the caller MUST use the provided response
 * directly and MUST NOT call the LLM.
 *
 * @param text - The raw user input text to screen
 * @returns CrisisScreenResult with isCrisis flag and optional pre-written response
 *
 * @example
 * const screen = screenForCrisis(userMessage);
 * if (screen.isCrisis) {
 *   return Response.json({ reply: screen.response }); // bypass LLM
 * }
 * // safe to call LLM
 */
export function screenForCrisis(text: string): CrisisScreenResult {
  if (!text || text.trim().length === 0) {
    return { isCrisis: false };
  }

  const normalizedText = text.toLowerCase().trim();
  const triggeredKeywords: string[] = [];

  // Check high severity first (most urgent)
  for (const pattern of HIGH_SEVERITY_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      triggeredKeywords.push(match[0]);
      return {
        isCrisis: true,
        severity: 'high',
        response: HIGH_SEVERITY_RESPONSE,
        triggeredKeywords,
      };
    }
  }

  // Check moderate severity
  for (const pattern of MODERATE_SEVERITY_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      triggeredKeywords.push(match[0]);
      return {
        isCrisis: true,
        severity: 'moderate',
        response: MODERATE_SEVERITY_RESPONSE,
        triggeredKeywords,
      };
    }
  }

  return { isCrisis: false };
}
