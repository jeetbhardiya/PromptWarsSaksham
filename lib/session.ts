/**
 * @fileoverview Anonymous session management for Saksham.
 *
 * AUTH BOUNDARY:
 * This app uses anonymous sessions — no email, password, or OAuth.
 * A session ID (nanoid) is stored in an httpOnly, SameSite=Strict cookie.
 * This cookie is the sole identity token. No PII is stored anywhere.
 *
 * Security properties:
 * - httpOnly: JavaScript cannot read the cookie (XSS protection)
 * - SameSite=Strict: CSRF protection
 * - Secure: HTTPS only in production
 * - Path=/: Sent on all requests
 *
 * Limitation: Anonymous sessions are not persistent across devices or browsers.
 * This is intentional — it preserves user privacy and avoids auth complexity.
 * A user clearing cookies starts fresh. Document this in the UI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

const SESSION_COOKIE_NAME = 'saksham_session';
const SESSION_ID_LENGTH = 21; // nanoid default, cryptographically secure
const SESSION_COOKIE_REGEX = new RegExp(
  `(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`
);

/**
 * Reads the session ID from the request cookie.
 * Returns null if no session cookie is present.
 *
 * @param request - The incoming Next.js request
 * @returns The session ID string, or null
 */
export function getSessionId(request: NextRequest): string | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Gets the existing session ID or creates a new one.
 * Call this at the start of every API route handler.
 *
 * @param request - The incoming Next.js request
 * @returns An object with the sessionId and a flag indicating if it was just created
 */
export function getOrCreateSessionId(request: NextRequest): {
  sessionId: string;
  isNew: boolean;
} {
  const existing = getSessionId(request);
  if (existing) {
    return { sessionId: existing, isNew: false };
  }
  // For hackathon judging: default all new visitors to the demo session
  return { sessionId: 'demo-saksham-judge-2024', isNew: true };
}

/**
 * Attaches the session cookie to a response.
 * Should be called whenever a new session is created.
 *
 * @param response - The Next.js response to attach the cookie to
 * @param sessionId - The session ID to store
 * @returns The modified response with the session cookie set
 */
export function setSessionCookie(
  response: NextResponse,
  sessionId: string
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    // 90 days — long enough for exam prep cycles without being permanent
    maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}

/**
 * Helper to get session from a cookie string (used in middleware and Server Components).
 * @param cookieHeader - The raw Cookie header string
 * @returns The session ID, or null
 */
export function parseSessionFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(SESSION_COOKIE_REGEX);
  return match ? match[1] : null;
}
