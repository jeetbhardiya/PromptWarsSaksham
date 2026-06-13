'use client';

import { TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface TriggerCardProps {
  label: string;
  trigger: string;
  frequency: number;
  confidenceScore: number;
  description: string;
  copingStrategy?: string;
  rank: number;
}

const TRIGGER_ICONS: Record<string, string> = {
  exam_dates: '📅',
  peer_comparison: '👥',
  sleep: '😴',
  parental_pressure: '👨‍👩‍👧',
  mock_scores: '📝',
  time_pressure: '⏰',
  self_doubt: '💭',
};

const TRIGGER_COLORS: Record<number, { bg: string; border: string; badge: string }> = {
  1: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  2: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  3: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
};

/**
 * Displays a detected stress trigger with its AI-generated coping strategy.
 * Ranked and color-coded by severity (confidence score).
 */
export function TriggerCard({
  label,
  trigger,
  frequency,
  confidenceScore,
  description,
  copingStrategy,
  rank,
}: TriggerCardProps) {
  const colors = TRIGGER_COLORS[rank] ?? TRIGGER_COLORS[3];
  const icon = TRIGGER_ICONS[trigger] ?? '⚡';
  const confidencePct = Math.round(confidenceScore * 100);

  return (
    <article
      className={`rounded-2xl p-5 border ${colors.bg} ${colors.border} transition-all duration-200 hover:shadow-soft`}
      aria-label={`Stress trigger: ${label}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">{label}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}
                aria-label={`Mentioned in ${frequency} journal entries`}
              >
                {frequency} {frequency === 1 ? 'entry' : 'entries'}
              </span>
              <span className="text-xs text-muted-foreground">
                {confidencePct}% confidence
              </span>
            </div>
          </div>
        </div>

        {/* Rank badge */}
        <div
          className="w-7 h-7 rounded-full bg-white/80 border flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0"
          aria-label={`Ranked #${rank}`}
        >
          #{rank}
        </div>
      </div>

      {/* Confidence bar */}
      <div
        className="w-full bg-white/60 rounded-full h-1.5 mb-3"
        role="progressbar"
        aria-valuenow={confidencePct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${confidencePct}%`}
      >
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">{description}</p>

      {/* AI Coping strategy */}
      {copingStrategy && (
        <div className="bg-white/70 rounded-xl p-3 border border-white">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-700">
              Tailored Coping Strategy
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{copingStrategy}</p>
        </div>
      )}
    </article>
  );
}
