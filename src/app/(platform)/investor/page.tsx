'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnel } from '@/contexts/investor-funnel-context';
import { Search, ArrowRight, Mic, Clock, Sparkles } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
   Smart Search — AI-first empty state.

   Funnel context: this is step 1. On submit we route to
   /investor/areas where the ranked-areas results dashboard lives.
   The Loading state is the bridge between empty → next page.
   ────────────────────────────────────────────────────────────── */

const SUGGESTIONS: string[] = [
  'High ROI areas in Pune under ₹1 Cr',
  'Best rental yield cities in India',
  'Emerging real estate markets 2026',
  '2 BHK Mumbai western suburbs for rental',
];

const PLACEHOLDER = 'Ask anything — e.g. high ROI areas in Pune under ₹1 Cr';

export default function SmartSearchPage() {
  const router = useRouter();
  const { setSearchQuery, completeStep, setCurrentStep } = useFunnel();

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('glimmora-recent-searches');
      if (stored) setRecent(JSON.parse(stored));
    } catch {}
  }, []);

  const handleSearch = useCallback(
    (text?: string) => {
      const value = (text ?? query).trim();
      if (!value) return;

      const next = [value, ...recent.filter((s) => s !== value)].slice(0, 5);
      setRecent(next);
      try {
        localStorage.setItem('glimmora-recent-searches', JSON.stringify(next));
      } catch {}

      setSearchQuery(value);
      completeStep(1);
      setCurrentStep(2);

      setHasSearched(true);
      setTimeout(() => router.push(`/investor/areas?q=${encodeURIComponent(value)}`), 1800);
    },
    [query, recent, setSearchQuery, completeStep, setCurrentStep, router],
  );

  return (
    <div className="smart-search-page">
      <div className="smart-search-content">
        {hasSearched ? (
          <LoadingState query={query} />
        ) : (
          <EmptyState
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
            recent={recent}
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Empty state — centered hero
   ────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: (text?: string) => void;
  recent: string[];
}

function EmptyState({ query, onQueryChange, onSubmit, recent }: EmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 animate-[fade-in_0.4s_ease-out]">
      {/* Eyebrow */}
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--fg-secondary)] shadow-sm">
        <Sparkles className="h-3 w-3 text-[var(--primary)]" strokeWidth={2} />
        <span>Glimmora AI</span>
      </div>

      {/* Title */}
      <h1
        className="text-center text-4xl font-semibold tracking-tight text-[var(--fg)] sm:text-5xl"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Smart Search
      </h1>

      {/* Subtitle */}
      <p className="mt-3 max-w-md text-center text-base text-[var(--fg-secondary)] sm:text-lg">
        Ask anything about real estate investments
      </p>

      {/* Search bar */}
      <div className="mt-10 w-full">
        <SearchBar
          value={query}
          onChange={onQueryChange}
          onSubmit={() => onSubmit()}
        />
      </div>

      {/* Suggestion chips */}
      <Suggestions
        items={SUGGESTIONS}
        onPick={(s) => {
          onQueryChange(s);
          onSubmit(s);
        }}
      />

      {/* Recent — quiet, only when present */}
      {recent.length > 0 && (
        <div className="mt-10 flex w-full flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            <Clock className="h-3 w-3" strokeWidth={1.8} />
            <span>Recent</span>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {recent.slice(0, 3).map((r, i) => (
              <li key={`${r}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange(r);
                    onSubmit(r);
                  }}
                  className="rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1 text-xs text-[var(--fg-secondary)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--hover-bg)] hover:text-[var(--fg)]"
                >
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Search bar — premium, glassy, focus-glow
   ────────────────────────────────────────────────────────────── */

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSubmit = value.trim().length > 0;

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={[
        'smart-search-bar group relative flex h-[64px] w-full items-center gap-3 rounded-2xl px-5 transition-all duration-300',
        focused ? 'is-focused' : '',
      ].join(' ')}
    >
      <Search
        className={`h-5 w-5 shrink-0 transition-colors ${focused ? 'text-[var(--primary)]' : 'text-[var(--fg-muted)]'}`}
        strokeWidth={1.8}
        aria-hidden
      />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={PLACEHOLDER}
        aria-label="Investment query"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none"
      />

      {/* Mic — placeholder for future voice input */}
      <button
        type="button"
        aria-label="Voice search (coming soon)"
        title="Voice search — coming soon"
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--fg-muted)] transition hover:bg-[var(--hover-bg)] hover:text-[var(--fg)] sm:flex"
      >
        <Mic className="h-4 w-4" strokeWidth={1.8} />
      </button>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Run analysis"
        className={[
          'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-all duration-200',
          canSubmit
            ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.97]'
            : 'cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--fg-muted)]',
        ].join(' ')}
      >
        <span className="hidden sm:inline">Run analysis</span>
        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────────
   Suggestions — clickable starter chips
   ────────────────────────────────────────────────────────────── */

function Suggestions({
  items,
  onPick,
}: {
  items: string[];
  onPick: (s: string) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {items.map((s, i) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="group rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--fg-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--primary-light)] hover:text-[var(--fg)] hover:shadow-[0_8px_24px_-12px_rgba(139,115,85,0.30)]"
          style={{ animation: `fade-up 0.5s ease-out ${0.1 + i * 0.06}s both` }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Loading state — calm, centered, AI-feel
   ────────────────────────────────────────────────────────────── */

function LoadingState({ query }: { query: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-xl flex-col items-center justify-center px-6 animate-[fade-in_0.3s_ease-out]">
      {/* Pulsing core */}
      <div className="relative mb-8 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[var(--primary)]/20 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-[var(--primary)]/30 animate-pulse" />
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </div>

      <h2
        className="text-center text-2xl font-semibold tracking-tight text-[var(--fg)]"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Analyzing market data
      </h2>

      <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--fg-secondary)]">
        <span>Working on your request</span>
        <span className="flex gap-1">
          <span
            className="inline-block h-1 w-1 rounded-full bg-[var(--fg-secondary)]"
            style={{ animation: 'pulse-glow-subtle 1.2s ease-in-out infinite' }}
          />
          <span
            className="inline-block h-1 w-1 rounded-full bg-[var(--fg-secondary)]"
            style={{ animation: 'pulse-glow-subtle 1.2s ease-in-out 0.2s infinite' }}
          />
          <span
            className="inline-block h-1 w-1 rounded-full bg-[var(--fg-secondary)]"
            style={{ animation: 'pulse-glow-subtle 1.2s ease-in-out 0.4s infinite' }}
          />
        </span>
      </div>

      {query && (
        <p className="mt-6 max-w-md text-center text-sm text-[var(--fg-muted)]">
          <span className="text-[var(--fg-secondary)]">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      {/* Subtle shimmer track */}
      <div className="mt-10 h-[2px] w-48 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"
          style={{ animation: 'shimmer 1.6s linear infinite' }}
        />
      </div>
    </div>
  );
}
