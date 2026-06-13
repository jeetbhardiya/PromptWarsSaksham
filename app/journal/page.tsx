'use client';

import { useState } from 'react';
import { Send, Loader2, BookOpen } from 'lucide-react';
import { CrisisAlert } from '@/components/CrisisAlert';

const MOOD_OPTIONS = [
  { score: 1, emoji: '😔', label: 'Very Low' },
  { score: 2, emoji: '😟', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '😊', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
];

const JOURNAL_PROMPTS = [
  "What's weighing on you today?",
  "How did your study session go?",
  "What emotions came up during revision?",
  "What's one thing you're grateful for today?",
  "What's your biggest worry right now?",
];

export default function JournalPage() {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const [crisisData, setCrisisData] = useState<{
    severity: 'moderate' | 'high';
    response: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const randomPrompt =
    JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedMood) return;

    setIsSubmitting(true);
    setReflection(null);
    setIsCrisis(false);
    setCrisisData(null);
    setError(null);

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), moodScore: selectedMood }),
      });

      const data = await res.json() as {
        isCrisis: boolean;
        severity?: 'moderate' | 'high';
        reflection?: string;
        entryId?: string;
      };

      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (data.isCrisis) {
        setIsCrisis(true);
        setCrisisData({
          severity: data.severity ?? 'moderate',
          response: data.reflection ?? '',
        });
      } else {
        setReflection(data.reflection ?? null);
        // Also log the mood
        await fetch('/api/mood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: selectedMood }),
        });
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEntry = () => {
    setContent('');
    setSelectedMood(null);
    setReflection(null);
    setIsCrisis(false);
    setCrisisData(null);
    setCharCount(0);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center"
            aria-hidden="true"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Daily Journal</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Write freely. There are no wrong answers. Your thoughts are safe here.
        </p>
      </header>

      {/* Crisis alert shown above form when detected */}
      {isCrisis && crisisData && (
        <div className="mb-6">
          <CrisisAlert
            severity={crisisData.severity}
            message={crisisData.response}
          />
          <button
            onClick={handleNewEntry}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
          >
            Write another entry
          </button>
        </div>
      )}

      {/* Reflection card shown after successful submission */}
      {reflection && !isCrisis && (
        <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 animate-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl" aria-hidden="true">🌸</span>
            <h2 className="font-semibold text-indigo-900">Saksham&apos;s Reflection</h2>
          </div>
          <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-line">
            {reflection}
          </p>
          <button
            onClick={handleNewEntry}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Write another entry →
          </button>
        </div>
      )}

      {/* Journal Form */}
      {!reflection && !isCrisis && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 shadow-soft"
          aria-label="Journal entry form"
          noValidate
        >
          {/* Prompt suggestion */}
          <p className="text-xs text-muted-foreground mb-3 italic">
            Prompt: {randomPrompt}
          </p>

          {/* Text area */}
          <div className="mb-5">
            <label htmlFor="journal-content" className="sr-only">
              Journal entry text
            </label>
            <textarea
              id="journal-content"
              value={content}
              onChange={handleContentChange}
              placeholder="Write what's on your mind today..."
              rows={8}
              maxLength={5000}
              className="w-full resize-none bg-muted/50 rounded-xl px-4 py-3 text-sm leading-relaxed border border-transparent focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              aria-required="true"
              aria-describedby="char-count"
            />
            <div
              id="char-count"
              className="text-right text-xs text-muted-foreground mt-1"
              aria-live="polite"
            >
              {charCount}/5000
            </div>
          </div>

          {/* Mood selector */}
          <fieldset className="mb-6">
            <legend className="text-sm font-medium mb-3">
              How are you feeling right now?{' '}
              <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </legend>
            <div
              className="flex gap-3 justify-center"
              role="radiogroup"
              aria-required="true"
            >
              {MOOD_OPTIONS.map(({ score, emoji, label }) => (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={selectedMood === score}
                  aria-label={`Mood: ${label} (${score}/5)`}
                  onClick={() => setSelectedMood(score)}
                  className={`mood-btn ${selectedMood === score ? 'selected' : ''}`}
                >
                  <span aria-hidden="true">{emoji}</span>
                </button>
              ))}
            </div>
            {selectedMood && (
              <p
                className="text-center text-xs text-muted-foreground mt-2"
                aria-live="polite"
              >
                {MOOD_OPTIONS.find((m) => m.score === selectedMood)?.label} ({selectedMood}/5)
              </p>
            )}
          </fieldset>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 mb-4" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || !selectedMood}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-disabled={isSubmitting || !content.trim() || !selectedMood}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Getting your reflection...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Save & Get Reflection</span>
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Your entries are private to your session. No account required.
          </p>
        </form>
      )}
    </div>
  );
}
