'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

type ExerciseType = 'box_breathing' | 'grounding_54321' | 'progressive_muscle_relaxation';

interface BreathingExerciseProps {
  type: ExerciseType;
  onComplete?: (durationSeconds: number) => void;
}

const EXERCISE_CONFIG: Record<
  ExerciseType,
  {
    title: string;
    emoji: string;
    description: string;
    phases?: Array<{ label: string; duration: number; color: string }>;
    steps?: string[];
    durationSeconds: number;
  }
> = {
  box_breathing: {
    title: 'Box Breathing',
    emoji: '🫁',
    description: 'Used by Navy SEALs and athletes to calm the nervous system. 4 counts each phase.',
    phases: [
      { label: 'Inhale', duration: 4, color: '#6366f1' },
      { label: 'Hold', duration: 4, color: '#ff7811' },
      { label: 'Exhale', duration: 4, color: '#22c55e' },
      { label: 'Hold', duration: 4, color: '#ec4899' },
    ],
    durationSeconds: 192, // 3 minutes = ~12 cycles
  },
  grounding_54321: {
    title: '5-4-3-2-1 Grounding',
    emoji: '🌍',
    description: 'Anchors you to the present moment through your 5 senses. Powerful for anxiety spikes.',
    steps: [
      '👁️ Name 5 things you can SEE around you right now',
      '🤚 Name 4 things you can TOUCH (feel their texture)',
      '👂 Name 3 things you can HEAR in this moment',
      '👃 Name 2 things you can SMELL (or like to smell)',
      '👄 Name 1 thing you can TASTE right now',
    ],
    durationSeconds: 300,
  },
  progressive_muscle_relaxation: {
    title: 'Progressive Muscle Relaxation',
    emoji: '💆',
    description: 'Systematically tense and release muscle groups to release physical study tension.',
    steps: [
      '🦶 Feet & Calves — Curl toes tight for 5s, then release. Feel the difference.',
      '🦵 Thighs — Squeeze thigh muscles for 5s, then release completely.',
      '🍑 Core & Glutes — Tighten your abdomen and buttocks for 5s, release.',
      '✊ Hands & Arms — Make tight fists for 5s, then open hands wide and release.',
      '🤷 Shoulders — Shrug shoulders to ears for 5s, drop them and breathe out.',
      '😤 Face — Scrunch all facial muscles for 5s, then soften everything.',
      '✨ Full Body — Take 3 deep breaths. Notice the calm in your whole body.',
    ],
    durationSeconds: 420,
  },
};

/**
 * Animated mindfulness exercise component.
 * Box breathing has animated SVG breathing circle.
 * Other exercises show step-by-step guided instructions.
 */
export function BreathingExercise({ type, onComplete }: BreathingExerciseProps) {
  const config = EXERCISE_CONFIG[type];
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalDuration = config.durationSeconds;
  const phases = config.phases;
  const currentPhase = phases?.[phaseIndex];

  // Timer logic
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= totalDuration) {
          setIsActive(false);
          setIsCompleted(true);
          onComplete?.(next);
          return next;
        }
        return next;
      });

      if (phases) {
        setPhaseElapsed((pe) => {
          const phaseDuration = phases[phaseIndex].duration;
          if (pe + 1 >= phaseDuration) {
            setPhaseIndex((pi) => (pi + 1) % phases.length);
            return 0;
          }
          return pe + 1;
        });
      } else if (config.steps) {
        // Advance step every (totalDuration / steps.length) seconds
        const stepDuration = totalDuration / config.steps.length;
        setElapsed((e) => {
          const step = Math.floor(e / stepDuration);
          setCurrentStep(Math.min(step, config.steps!.length - 1));
          return e;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isCompleted, phaseIndex, phases, totalDuration, config.steps, onComplete]);

  const handleReset = useCallback(() => {
    setIsActive(false);
    setElapsed(0);
    setPhaseIndex(0);
    setPhaseElapsed(0);
    setCurrentStep(0);
    setIsCompleted(false);
  }, []);

  const progressPct = Math.min((elapsed / totalDuration) * 100, 100);
  const phaseProgressPct = currentPhase
    ? ((phaseElapsed / currentPhase.duration) * 100)
    : 0;

  // Scale for breathing animation: 1 → 1.4 during inhale, 1.4 → 1 during exhale
  const getBreathScale = () => {
    if (!phases || !currentPhase) return 1;
    const progress = phaseElapsed / currentPhase.duration;
    if (currentPhase.label === 'Inhale') return 1 + progress * 0.4;
    if (currentPhase.label === 'Exhale') return 1.4 - progress * 0.4;
    return phaseIndex === 1 ? 1.4 : 1; // hold phases
  };

  const scale = getBreathScale();

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold">
          Well done! 🌟
        </h3>
        <p className="text-muted-foreground text-sm text-center">
          You completed {config.title}. Take a moment to notice how you feel.
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Do it again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Title & description */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {config.emoji} {config.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {config.description}
        </p>
      </div>

      {/* Box breathing — animated circle */}
      {phases && currentPhase && (
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div
            className="w-40 h-40 rounded-full border-4 transition-all duration-1000"
            style={{
              borderColor: currentPhase.color,
              transform: `scale(${scale})`,
              boxShadow: `0 0 40px ${currentPhase.color}40`,
            }}
            role="img"
            aria-label={`${currentPhase.label}: ${currentPhase.duration - phaseElapsed} seconds remaining`}
          />
          {/* Inner content */}
          <div className="absolute flex flex-col items-center gap-1">
            <span className="text-2xl font-bold" style={{ color: currentPhase.color }}>
              {currentPhase.duration - phaseElapsed}
            </span>
            <span className="text-sm font-medium text-foreground">
              {currentPhase.label}
            </span>
          </div>
        </div>
      )}

      {/* Step-by-step exercises */}
      {config.steps && (
        <div className="w-full space-y-2" role="list" aria-label="Exercise steps">
          {config.steps.map((step, idx) => (
            <div
              key={idx}
              role="listitem"
              className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                idx === currentStep && isActive
                  ? 'bg-primary/10 border border-primary/30'
                  : idx < currentStep
                  ? 'opacity-50'
                  : 'opacity-40'
              }`}
              aria-current={idx === currentStep && isActive ? 'step' : undefined}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-xs flex items-center justify-center font-semibold">
                {idx < currentStep ? '✓' : idx + 1}
              </span>
              <p className="text-sm leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overall progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
          <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
        </div>
        <div
          className="w-full bg-muted rounded-full h-2"
          role="progressbar"
          aria-valuenow={elapsed}
          aria-valuemin={0}
          aria-valuemax={totalDuration}
          aria-label={`Exercise progress: ${Math.round(progressPct)}%`}
        >
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200 ${
            isActive
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
          }`}
          aria-label={isActive ? 'Pause exercise' : 'Start exercise'}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" aria-hidden="true" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" aria-hidden="true" /> {elapsed === 0 ? 'Start' : 'Resume'}
            </>
          )}
        </button>
        {elapsed > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm"
            aria-label="Reset exercise"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
