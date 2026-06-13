'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, BarChart2 } from 'lucide-react';
import { ChatBubble, TypingIndicator } from '@/components/ChatBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
  severity?: 'moderate' | 'high';
}

const STARTER_PROMPTS = [
  "I'm feeling overwhelmed with my syllabus 😩",
  "My mock score dropped again today",
  "Can't sleep because of exam anxiety",
  "I feel like I'm falling behind everyone",
  "I need some motivation right now",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Namaste! 🌸 I'm Saksham, your wellness companion. I know exam prep can feel like a marathon through fog sometimes.\n\nI'm here to listen — whether you need to vent, need some coping strategies, or just want someone to talk to. What's on your mind today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for context (last 10 messages, excluding welcome)
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-9)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json() as {
        isCrisis: boolean;
        severity?: 'moderate' | 'high';
        reply: string;
        error?: string;
      };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: data.error ?? "I'm having a moment — try again in a bit? 🌿",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          isCrisis: data.isCrisis,
          severity: data.severity,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "I couldn't connect right now. Please check your internet and try again. 🌿",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-64px-80px)]">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center"
            aria-hidden="true"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Companion Chat</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">Saksham is here</span>
            </div>
          </div>
        </div>
        <a
          href="/insights"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
          aria-label="View your insights dashboard"
        >
          <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
          View Insights
        </a>
      </header>

      {/* Context note */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-700 mb-4" role="note">
        💡 Saksham is aware of your stress patterns and mood history — responses are personalized to your journey.
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto space-y-4 pb-4"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            isCrisis={msg.isCrisis}
            severity={msg.severity}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Starter prompts (shown only at the start) */}
      {messages.length <= 1 && (
        <div
          className="flex flex-wrap gap-2 mb-3"
          role="group"
          aria-label="Suggested conversation starters"
        >
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void sendMessage(prompt)}
              className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 bg-card border border-border rounded-2xl p-2"
        aria-label="Send a message"
      >
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          maxLength={2000}
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/60 max-h-32"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 self-end"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Not a substitute for professional mental health support.{' '}
        <a href="tel:14416" className="text-primary hover:underline">Tele-MANAS 14416</a> if in crisis.
      </p>
    </div>
  );
}
