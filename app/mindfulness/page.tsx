'use client';

import { useState, useEffect } from 'react';
import { BreathingExercise } from '@/components/BreathingExercise';
import { Wind, Loader2, CheckCircle } from 'lucide-react';

type ExerciseKey = 'box_breathing' | 'grounding_54321' | 'progressive_muscle_relaxation';

const EXERCISES: Record<
  ExerciseKey,
  { title: string; emoji: string; tagline: string; duration: string; benefit: string }
> = {
  box_breathing: {
    title: 'Box Breathing',
    emoji: '🫁',
    tagline: 'Calm your nervous system in 3 minutes',
    duration: '3 min',
    benefit: 'Best for: Exam anxiety, panic before tests',
  },
  grounding_54321: {
    title: '5-4-3-2-1 Grounding',
    emoji: '🌍',
    tagline: 'Anchor yourself to the present moment',
    duration: '5 min',
    benefit: 'Best for: Overwhelm, racing thoughts',
  },
  progressive_muscle_relaxation: {
    title: 'Progressive Muscle Relaxation',
    emoji: '💆',
    tagline: 'Release the physical tension of studying',
    duration: '7 min',
    benefit: 'Best for: After long study sessions',
  },
};

export default function MindfulnessPage() {
  const [recommended, setRecommended] = useState<{
    exercise: ExerciseKey;
    rationale: string;
  } | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseKey | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState(true);
  const [completedToday, setCompletedToday] = useState<ExerciseKey[]>([]);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await fetch('/api/mindfulness');
        const data = await res.json() as {
          recommendation: { exercise: string; rationale: string };
        };
        setRecommended({
          exercise: data.recommendation.exercise as ExerciseKey,
          rationale: data.recommendation.rationale,
        });
        setSelectedExercise(data.recommendation.exercise as ExerciseKey);
      } catch {
        setRecommended({ exercise: 'box_breathing', rationale: 'A great default for any day.' });
        setSelectedExercise('box_breathing');
      } finally {
        setIsLoadingRec(false);
      }
    };
    void fetchRecommendation();
  }, []);

  const handleComplete = async (exerciseKey: ExerciseKey, durationSeconds: number) => {
    setCompletedToday((prev) => [...prev, exerciseKey]);
    await fetch('/api/mindfulness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise: exerciseKey, duration: durationSeconds }),
    }).catch(console.error);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center"
          aria-hidden="true"
        >
          <Wind className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mindfulness</h1>
          <p className="text-muted-foreground text-sm">
            Adaptive exercises based on your current mood
          </p>
        </div>
      </header>

      {/* AI Recommendation */}
      {!isLoadingRec && recommended && (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg" aria-hidden="true">🌿</span>
            <span className="text-sm font-semibold text-green-700">
              Recommended for you right now
            </span>
          </div>
          <h2 className="text-lg font-bold text-green-900 mb-1">
            {EXERCISES[recommended.exercise].title}
          </h2>
          <p className="text-sm text-green-700 leading-relaxed">{recommended.rationale}</p>
        </div>
      )}
      {isLoadingRec && (
        <div
          className="bg-muted/50 rounded-2xl p-5 mb-8 flex items-center gap-3"
          aria-live="polite"
          aria-label="Loading recommendation"
        >
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Getting your recommendation...</p>
        </div>
      )}

      {/* Exercise selector */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        role="tablist"
        aria-label="Choose a mindfulness exercise"
      >
        {(Object.entries(EXERCISES) as [ExerciseKey, typeof EXERCISES[ExerciseKey]][]).map(
          ([key, ex]) => (
            <button
              key={key}
              role="tab"
              aria-selected={selectedExercise === key}
              aria-controls={`exercise-panel-${key}`}
              onClick={() => setSelectedExercise(key)}
              className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedExercise === key
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl" aria-hidden="true">{ex.emoji}</span>
                <div className="flex items-center gap-1">
                  {completedToday.includes(key) && (
                    <CheckCircle
                      className="w-4 h-4 text-green-500"
                      aria-label="Completed today"
                    />
                  )}
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {ex.duration}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-sm">{ex.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{ex.tagline}</p>
              <p className="text-xs text-primary/70 mt-1.5 font-medium">{ex.benefit}</p>
            </button>
          )
        )}
      </div>

      {/* Exercise panel */}
      {selectedExercise && (
        <div
          id={`exercise-panel-${selectedExercise}`}
          role="tabpanel"
          aria-label={`${EXERCISES[selectedExercise].title} exercise`}
          className="bg-card border border-border rounded-2xl p-6"
          key={selectedExercise}
        >
          <BreathingExercise
            type={selectedExercise}
            onComplete={(duration) => void handleComplete(selectedExercise, duration)}
          />
        </div>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4" aria-live="polite">
          <h3 className="text-sm font-semibold text-green-700 mb-2">
            ✅ Completed today ({completedToday.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {completedToday.map((key, idx) => (
              <span
                key={`${key}-${idx}`}
                className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium"
              >
                {EXERCISES[key].emoji} {EXERCISES[key].title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Benefits note */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          Even 3 minutes of mindfulness can reduce cortisol (stress hormone) levels.
          <br />
          Consistent practice across exam prep makes a measurable difference.
        </p>
      </div>
    </div>
  );
}
