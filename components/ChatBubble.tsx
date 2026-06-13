'use client';

import { format } from 'date-fns';
import { CrisisAlert } from './CrisisAlert';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isCrisis?: boolean;
  severity?: 'moderate' | 'high';
}

/**
 * Chat message bubble with distinct styling for user/assistant.
 * Crisis responses trigger the full CrisisAlert component instead of a regular bubble.
 */
export function ChatBubble({
  role,
  content,
  timestamp,
  isCrisis,
  severity,
}: ChatBubbleProps) {
  const isUser = role === 'user';

  // Crisis response — show special alert UI
  if (isCrisis && !isUser) {
    return (
      <div className="animate-in" aria-live="assertive">
        <CrisisAlert severity={severity ?? 'moderate'} message={content} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 animate-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="listitem"
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-400 to-purple-500'
            : 'bg-gradient-to-br from-orange-400 to-pink-400'
        }`}
        aria-hidden="true"
      >
        {isUser ? '🧑' : '🌸'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
              : 'bg-white border border-border text-foreground rounded-bl-sm shadow-soft'
          }`}
          aria-label={`${isUser ? 'You' : 'Saksham'} said: ${content}`}
        >
          {/* Render assistant content with line breaks */}
          {content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        {timestamp && (
          <time
            dateTime={timestamp.toISOString()}
            className="text-xs text-muted-foreground px-1"
          >
            {format(timestamp, 'h:mm a')}
          </time>
        )}
      </div>
    </div>
  );
}

/** Typing indicator for when AI is generating a response */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-in" aria-live="polite" aria-label="Saksham is thinking">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-base" aria-hidden="true">
        🌸
      </div>
      <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft">
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
