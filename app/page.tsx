import Link from 'next/link';
import {
  BookOpen,
  BarChart2,
  MessageCircle,
  Wind,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saksham — Your Mental Wellness Companion',
  description:
    'AI-powered mental wellness tracker for NEET, JEE, UPSC, GATE, CAT & CUET aspirants. Uncover your stress patterns, track mood, and find your balance.',
};

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Daily Journal',
    description:
      'Write openly. Get a warm AI reflection tailored to your exam journey — not generic advice.',
    href: '/journal',
    gradient: 'from-indigo-500 to-purple-600',
    emoji: '📖',
  },
  {
    icon: BarChart2,
    title: 'Insight Dashboard',
    description:
      'Discover hidden stress patterns — mock score anxiety, peer comparison, parental pressure — that standard trackers miss.',
    href: '/insights',
    gradient: 'from-orange-400 to-red-500',
    emoji: '📊',
  },
  {
    icon: MessageCircle,
    title: 'Companion Chat',
    description:
      'Talk to a compassionate companion who knows your stress patterns. Context-aware, never generic.',
    href: '/chat',
    gradient: 'from-pink-400 to-rose-500',
    emoji: '💬',
  },
  {
    icon: Wind,
    title: 'Mindfulness',
    description:
      'Box breathing, 5-4-3-2-1 grounding, and progressive muscle relaxation — recommended based on your current mood.',
    href: '/mindfulness',
    gradient: 'from-green-400 to-teal-500',
    emoji: '🍃',
  },
];

const STATS = [
  { label: 'Exam Categories', value: '6', sub: 'NEET · JEE · UPSC · GATE · CAT · CUET' },
  { label: 'Crisis Helplines', value: '4', sub: 'Always visible, always accessible' },
  { label: 'Stress Triggers', value: '7', sub: 'India-specific exam patterns detected' },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden rounded-3xl mb-12 p-8 sm:p-14 text-center"
        aria-labelledby="hero-heading"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 hero-gradient opacity-90 rounded-3xl" aria-hidden="true" />
        <div className="absolute inset-0 bg-black/10 rounded-3xl" aria-hidden="true" />

        <div className="relative z-10 text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-6 border border-white/30">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Built for India&apos;s exam warriors
          </div>

          <h1
            id="hero-heading"
            className="text-4xl sm:text-6xl font-bold mb-4 leading-tight text-balance"
          >
            सक्षम — You&apos;ve Got This
          </h1>

          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed text-balance">
            A compassionate AI companion for your mental wellness during NEET, JEE, UPSC, and beyond.
            Uncover your stress patterns. Find your balance. Keep going.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-2xl hover:bg-white/90 transition-all duration-200 hover:scale-105"
              aria-label="Start your wellness journey by writing a journal entry"
            >
              Start Your Journey
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-2xl border border-white/40 hover:bg-white/30 transition-all duration-200"
            >
              View Demo Insights
            </Link>
          </div>
        </div>
      </section>

      {/* Safety Note */}
      <section
        className="mb-10 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
        aria-label="Safety information"
      >
        <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="text-sm text-amber-800">
          <strong>Safety first:</strong> Every journal entry and chat message is screened for crisis signals before anything else.
          If you&apos;re in distress, you&apos;ll immediately see India-specific helplines:{' '}
          <a href="tel:14416" className="font-semibold underline">Tele-MANAS 14416</a>,{' '}
          <a href="tel:9152987821" className="font-semibold underline">iCall 9152987821</a>.
        </div>
      </section>

      {/* Feature Cards */}
      <section aria-labelledby="features-heading" className="mb-16">
        <h2
          id="features-heading"
          className="text-2xl font-bold mb-2 text-center"
        >
          Everything you need to stay well
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Built specifically for the unique pressure of Indian competitive exam preparation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" role="list">
          {FEATURES.map(({ icon: Icon, title, description, href, gradient, emoji }) => (
            <Link
              key={href}
              href={href}
              role="listitem"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              aria-label={`Go to ${title}: ${description}`}
            >
              {/* Gradient accent */}
              <div
                className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                aria-hidden="true"
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span aria-hidden="true">{emoji}</span>
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open {title}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section
        aria-labelledby="stats-heading"
        className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white mb-12"
      >
        <h2 id="stats-heading" className="text-2xl font-bold text-center mb-8">
          Designed with care for Indian aspirants
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STATS.map(({ label, value, sub }) => (
            <div key={label} className="text-center">
              <div className="text-5xl font-bold text-white mb-1">{value}</div>
              <div className="text-white/90 font-semibold">{label}</div>
              <div className="text-white/60 text-xs mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="text-center mb-12">
        <h2 id="how-heading" className="text-2xl font-bold mb-2">
          How Saksham is different
        </h2>
        <p className="text-muted-foreground mb-8">
          Not just a mood tracker. A system that understands exam culture.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          {[
            {
              step: '1',
              title: 'You write',
              desc: 'Journal entries in your own words — no templates, no forced positivity.',
            },
            {
              step: '2',
              title: 'We analyze',
              desc: 'Our insight engine finds hidden patterns: peer comparison anxiety, mock-score stress, sleep issues.',
            },
            {
              step: '3',
              title: 'AI personalizes',
              desc: 'Gemini uses your actual patterns to give coping strategies that fit your situation.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-card border border-border rounded-2xl p-5">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold mb-3 text-sm">
                {step}
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
