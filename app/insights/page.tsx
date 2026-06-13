'use client';

import { useEffect, useState } from 'react';
import { MoodChart } from '@/components/MoodChart';
import { TriggerCard } from '@/components/TriggerCard';
import { BarChart2, Loader2, TrendingDown, TrendingUp, Minus, RefreshCw } from 'lucide-react';

interface InsightsData {
  triggers: Array<{
    trigger: string;
    label: string;
    frequency: number;
    confidenceScore: number;
    description: string;
  }>;
  patterns: Array<{
    patternType: string;
    label: string;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  }>;
  copingStrategies: Record<string, string>;
  context: {
    averageMood: number;
    currentMood: number | null;
    entryCount: number;
    streakDays: number;
  };
  moodChart: Array<{ date: string; score: number; emoji: string }>;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  severe: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  moderate: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  mild: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const PATTERN_ICONS: Record<string, string> = {
  declining_mood: '📉',
  sustained_low_mood: '🔵',
  high_volatility: '📊',
  chronically_low: '⚠️',
  improving_mood: '📈',
};

function MoodTrendIcon({ avg }: { avg: number }) {
  if (avg >= 4) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (avg <= 2) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('Failed to load insights');
      const json = await res.json() as InsightsData;
      setData(json);
    } catch {
      setError('Could not load insights. Make sure you have journal entries first.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-live="polite" aria-label="Loading insights">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">Analyzing your patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">📊</p>
        <h2 className="text-xl font-semibold mb-2">No data yet</h2>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <a href="/journal" className="text-primary underline text-sm">
          Write your first journal entry →
        </a>
      </div>
    );
  }

  const ctx = data?.context;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center"
            aria-hidden="true"
          >
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Insights Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              What your journal reveals about you
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchInsights()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
          aria-label="Refresh insights"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Refresh
        </button>
      </header>

      {/* Stats Row */}
      {ctx && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          aria-label="Wellness statistics"
        >
          {[
            {
              label: 'Current Mood',
              value: ctx.currentMood ? `${ctx.currentMood}/5` : '—',
              icon: ctx.currentMood
                ? ['😔', '😟', '😐', '😊', '😄'][ctx.currentMood - 1]
                : '—',
              sub: 'Latest log',
            },
            {
              label: 'Avg. Mood',
              value: `${ctx.averageMood}/5`,
              icon: null,
              sub: 'Recent period',
              extra: <MoodTrendIcon avg={ctx.averageMood} />,
            },
            {
              label: 'Journal Entries',
              value: String(ctx.entryCount),
              icon: '📖',
              sub: 'Total logged',
            },
            {
              label: 'Days Tracking',
              value: String(ctx.streakDays),
              icon: '🗓️',
              sub: 'Since first entry',
            },
          ].map(({ label, value, icon, sub, extra }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-2xl p-4 text-center"
              role="figure"
              aria-label={`${label}: ${value}`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
                {extra}
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-xs text-muted-foreground/60">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mood Chart */}
      <section
        className="bg-card border border-border rounded-2xl p-5 mb-8"
        aria-labelledby="mood-chart-heading"
      >
        <h2 id="mood-chart-heading" className="font-semibold mb-4">
          Mood Trend (Last 30 Days)
        </h2>
        <MoodChart data={data?.moodChart ?? []} />
      </section>

      {/* Two-column: Triggers + Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stress Triggers */}
        <section
          className="lg:col-span-2"
          aria-labelledby="triggers-heading"
        >
          <h2
            id="triggers-heading"
            className="font-semibold text-lg mb-4 flex items-center gap-2"
          >
            <span aria-hidden="true">⚡</span>
            Detected Stress Triggers
          </h2>

          {(data?.triggers.length ?? 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm bg-muted/30 rounded-2xl">
              <p className="text-3xl mb-2">🔍</p>
              <p>Write a few journal entries to uncover your patterns.</p>
            </div>
          ) : (
            <div className="space-y-4" role="list" aria-label="Stress triggers list">
              {data?.triggers.map((trigger, idx) => (
                <TriggerCard
                  key={trigger.trigger}
                  {...trigger}
                  copingStrategy={data.copingStrategies[trigger.trigger]}
                  rank={idx + 1}
                />
              ))}
            </div>
          )}
        </section>

        {/* Emotional Patterns */}
        <section aria-labelledby="patterns-heading">
          <h2
            id="patterns-heading"
            className="font-semibold text-lg mb-4 flex items-center gap-2"
          >
            <span aria-hidden="true">🧠</span>
            Emotional Patterns
          </h2>

          {(data?.patterns.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-2xl">
              <p className="text-3xl mb-2">📈</p>
              <p>Log mood for 3+ days to see patterns.</p>
            </div>
          ) : (
            <div className="space-y-3" role="list">
              {data?.patterns.map((pattern) => {
                const styles = SEVERITY_STYLES[pattern.severity] ?? SEVERITY_STYLES.mild;
                const icon = PATTERN_ICONS[pattern.patternType] ?? '📊';
                return (
                  <div
                    key={pattern.patternType}
                    role="listitem"
                    className={`rounded-2xl p-4 border ${styles.bg} ${styles.border}`}
                    aria-label={`Pattern: ${pattern.label}, severity: ${pattern.severity}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg" aria-hidden="true">{icon}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}>
                        {pattern.severity}
                      </span>
                    </div>
                    <h3 className={`font-semibold text-sm mb-1 ${styles.text}`}>
                      {pattern.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pattern.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action nudge */}
          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <strong>💡 Tip:</strong> The more you journal, the more accurate your insights become. Aim for one entry per day.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
