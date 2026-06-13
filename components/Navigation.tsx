'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, BarChart2, MessageCircle, Wind, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/insights', label: 'Insights', icon: BarChart2 },
  { href: '/chat', label: 'Companion', icon: MessageCircle },
  { href: '/mindfulness', label: 'Mindfulness', icon: Wind },
];

/**
 * Top navigation bar with active page highlighting and accessible labels.
 */
export function Navigation() {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50"
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg"
          aria-label="Saksham home"
        >
          <span className="text-2xl" aria-hidden="true">🌸</span>
          <span className="gradient-text-saffron">Saksham</span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          className="hidden sm:flex items-center gap-1"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile nav - icon only */}
        <nav
          aria-label="Mobile navigation"
          className="flex sm:hidden items-center gap-1"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
