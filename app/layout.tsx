import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Saksham — Mental Wellness for Exam Warriors',
  description:
    'A compassionate mental wellness companion for NEET, JEE, UPSC, GATE, CAT, and CUET aspirants. Track your mood, uncover stress patterns, and find your balance.',
  keywords: [
    'NEET wellness',
    'JEE student mental health',
    'UPSC aspirant support',
    'exam stress relief',
    'study wellbeing India',
    'mental health tracker students',
  ],
  openGraph: {
    title: 'Saksham — Mental Wellness for Exam Warriors',
    description:
      'AI-powered mental wellness companion for Indian competitive exam aspirants.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-indigo-50">
        <div className="flex min-h-screen flex-col">
          <Navigation />
          <main id="main-content" className="flex-1 pt-16">
            {children}
          </main>
          <footer className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
            <p>
              Saksham 🌸 — Built with care for every exam warrior.
            </p>
            <p className="mt-1 text-xs">
              Crisis support:{' '}
              <a
                href="tel:14416"
                className="text-primary hover:underline font-medium"
              >
                Tele-MANAS 14416
              </a>{' '}
              ·{' '}
              <a
                href="tel:9152987821"
                className="text-primary hover:underline font-medium"
              >
                iCall 9152987821
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
