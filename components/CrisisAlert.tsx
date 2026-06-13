'use client';

import { Phone, Heart, ExternalLink } from 'lucide-react';

interface CrisisAlertProps {
  severity?: 'moderate' | 'high';
  message: string;
}

const HELPLINES = [
  {
    name: 'Tele-MANAS',
    number: '14416',
    description: 'Government of India · 24/7 · Free · Multiple languages',
    href: 'tel:14416',
    icon: '🇮🇳',
  },
  {
    name: 'iCall (TISS)',
    number: '9152987821',
    description: 'Tata Institute of Social Sciences · Mon–Sat 8am–10pm',
    href: 'tel:9152987821',
    icon: '💙',
  },
  {
    name: 'AASRA',
    number: '9820466627',
    description: '24/7 crisis helpline',
    href: 'tel:9820466627',
    icon: '🤝',
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    description: '24/7 · Free',
    href: 'tel:18602662345',
    icon: '🌟',
  },
];

/**
 * Crisis alert component displayed when safety guard detects crisis signals.
 * Shows pre-written compassionate message and India-specific helplines.
 * Always renders helplines prominently — accessibility is critical here.
 */
export function CrisisAlert({ severity = 'moderate', message }: CrisisAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label="Mental health crisis support information"
      className={`crisis-alert ${severity === 'high' ? 'border-red-400' : ''}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-red-500" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-red-800 text-lg">
            You Matter. Help is Here.
          </h2>
          <p className="text-red-600 text-sm">
            Please reach out to one of these helplines right now.
          </p>
        </div>
      </div>

      {/* AI response (pre-written, not LLM) */}
      <div className="bg-white/70 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {message}
      </div>

      {/* Helpline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
        {HELPLINES.map((helpline) => (
          <a
            key={helpline.number}
            href={helpline.href}
            role="listitem"
            className="flex items-start gap-3 bg-white rounded-xl p-3 border border-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200 group"
            aria-label={`Call ${helpline.name} at ${helpline.number}. ${helpline.description}`}
          >
            <span className="text-xl mt-0.5" aria-hidden="true">
              {helpline.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-gray-900">
                  {helpline.name}
                </span>
                <ExternalLink
                  className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center gap-1 text-red-600 font-bold text-base">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {helpline.number}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{helpline.description}</p>
            </div>
          </a>
        ))}
      </div>

      <p className="text-xs text-red-500 text-center mt-4">
        If you are in immediate danger, please call <strong>112</strong> (Emergency) or go to your nearest hospital.
      </p>
    </div>
  );
}
