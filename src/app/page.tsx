'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LandingShell } from '@/components/layout/landing-shell';

/* Scroll-reveal: any element with [data-reveal] fades + lifts into view
   the first time it intersects the viewport. Honors prefers-reduced-motion. */
function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (reduce) {
      targets.forEach(el => el.classList.add('lp-revealed'));
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('lp-revealed');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}
import {
  ArrowRight, Brain, Globe, TrendingUp, Building2,
  Sparkles, Zap, BarChart3, Search, Lock,
  MapPin, Play, Star, Activity, Mail,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const HERO_STATS = [
  { value: '$12B+', label: 'Analyzed', icon: BarChart3 },
  { value: '50+', label: 'Markets', icon: Globe },
  { value: '94%', label: 'Accuracy', icon: Zap },
  { value: '12,847', label: 'Properties', icon: Building2 },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Market Intelligence',
    desc: 'Natural language queries with institutional-grade scoring across 40+ investment factors.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    desc: 'ROI prediction and rental yield forecasting powered by real-time market data.',
  },
  {
    icon: Zap,
    title: 'Real-Time Signals',
    desc: 'Sub-200ms data streams from 50+ global markets. Always live, always accurate.',
  },
];

const TICKER_DATA = [
  { city: 'Dubai', flag: '🇦🇪', growth: '+12.5%', yield: '7.2%' },
  { city: 'London', flag: '🇬🇧', growth: '+8.7%', yield: '3.8%' },
  { city: 'Singapore', flag: '🇸🇬', growth: '+9.2%', yield: '4.8%' },
  { city: 'New York', flag: '🇺🇸', growth: '+5.1%', yield: '4.2%' },
  { city: 'Mumbai', flag: '🇮🇳', growth: '+15.2%', yield: '5.5%' },
  { city: 'Tokyo', flag: '🇯🇵', growth: '+3.8%', yield: '3.2%' },
];

const PROCESS = [
  { num: '01', icon: Search, title: 'Analyze Data', desc: 'AI scans billions of data points across 50+ countries in real time.' },
  { num: '02', icon: Brain, title: 'Generate Insights', desc: 'Predictive models score opportunities with institutional-grade accuracy.' },
  { num: '03', icon: TrendingUp, title: 'Make Decisions', desc: 'Act on AI-scored results with ROI forecasts and compliance insights.' },
];

const DASHBOARD_STATS = [
  { label: 'Portfolio Value', val: '$24.8M', change: '+8.2%' },
  { label: 'Monthly Yield', val: '$142K', change: '+3.1%' },
  { label: 'Active Properties', val: '18', change: '+2' },
  { label: 'AI Score', val: '94/100', change: '+5' },
];

const CHART_BARS = [35, 48, 42, 58, 52, 68, 62, 75, 70, 85, 78, 92];

const LOGOS = ['Goldman Sachs', 'McKinsey', 'JLL', 'CBRE', 'Savills', 'Knight Frank'];

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function LandingPage() {
  useScrollReveal();
  // Count-up animation for hero metrics — single rAF drives all three values
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const totalValue = (24.8 * progress).toFixed(1);
  const roi = (12.4 * progress).toFixed(1);
  const properties = Math.round(18 * progress);

  return (
    <div className="lp-page">
      {/* Background layers */}
      <div className="lp-grid-overlay" />

      {/* ═══ NAV ═══ */}
      <nav className="lp-nav">
        <LandingShell>
          <Link href="/" className="flex items-center" aria-label="Estra Glimmora — Home">
            <img
              src="/EstraGlimmora_logo.png"
              alt="Estra Glimmora"
              className="h-10 w-auto object-contain max-w-[200px]"
              draggable={false}
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="lp-btn-ghost hidden sm:inline-flex">Sign In</Link>
            <Link href="/login" className="lp-btn-gold">
              Get Access <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </LandingShell>
      </nav>

      <main className="relative z-10">

        {/* ═══ HERO — premium luxury, light ═══ */}
        <section className="relative overflow-hidden bg-white pt-16 pb-20 sm:pt-20 sm:pb-24">
          {/* Soft ambient gold wash + subtle grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(60% 50% at 80% 0%, rgba(212,175,55,0.10) 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, rgba(212,175,55,0.05) 0%, transparent 65%)',
            }}
          />

          <LandingShell>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              {/* LEFT — copy + CTAs + activity (left-aligned rhythm) */}
              <div className="lg:col-span-6 text-left animate-stagger-2">
                {/* Headline — first line strong black, second line gold gradient */}
                <h1
                  className="text-[clamp(36px,5vw,60px)] font-semibold leading-[1.02] tracking-[-0.028em]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  <span className="block text-[#111111]">
                    Find high-growth properties
                  </span>
                  <span className="block mt-1.5 glm-gold-text">
                    backed by real-time AI intelligence
                  </span>
                </h1>

                {/* Subtext */}
                <p className="mt-7 max-w-xl text-[16px] leading-[1.65] text-black/60">
                  Analyze 12,000+ properties, predict ROI, and discover the best
                  locations in real-time.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#E8C972] via-[#D4AF37] to-[#B8902E] px-7 py-3.5 text-[14.5px] font-semibold text-[#1A140F] shadow-[inset_0_1px_0_rgba(255,245,210,0.55),0_8px_24px_rgba(212,175,55,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,245,210,0.65),0_16px_44px_rgba(212,175,55,0.45)]"
                  >
                    Explore AI Insights
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.2} />
                  </Link>
                  <Link
                    href="#ai-section"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white border border-black/10 px-6 py-3.5 text-[14.5px] font-medium text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:shadow-[0_10px_30px_rgba(212,175,55,0.12)]"
                  >
                    <Play className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    Watch Demo
                  </Link>
                </div>

                {/* Real-time activity */}
                <div className="mt-6 flex items-center gap-2.5 text-[12.5px]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
                  </span>
                  <span className="glm-activity-text font-medium tracking-[0.005em] text-emerald-600/90">
                    Analyzing 12,000+ properties
                    <span className="glm-typing-dots ml-0.5" aria-hidden>
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </span>
                </div>

                {/* Trust */}
                <div className="mt-10 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {['S', 'A', 'J', 'M', 'R'].map((l, i) => (
                      <div
                        key={l}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FBF8F1] to-[#EFE6D2] text-[11px] font-semibold text-[#6B4F0F] border border-white shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
                        style={{ zIndex: 5 - i }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="mt-1 text-[12.5px] text-black/55">
                      Trusted by <span className="font-semibold text-[#111111]">1,200+ investors</span> &amp; property buyers
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT — blurred AI dashboard preview */}
              <div className="lg:col-span-6 relative animate-stagger-3">
                {/* Halo behind preview */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-10 -z-10 blur-3xl"
                  style={{
                    background:
                      'radial-gradient(50% 50% at 50% 50%, rgba(212,175,55,0.20) 0%, rgba(212,175,55,0.06) 40%, transparent 70%)',
                  }}
                />

                {/* Dashboard preview card */}
                <div className="relative rounded-2xl border border-black/[0.05] bg-white/80 backdrop-blur-xl p-5 shadow-[0_30px_80px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.05)]">
                  {/* System-status badge — anchored to the card's top-right corner */}
                  <div className="absolute -top-3 right-4 z-[2] inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-md border border-black/[0.06] px-2.5 py-1 shadow-[0_4px_18px_rgba(212,175,55,0.10),inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="absolute inset-0 rounded-full bg-emerald-500/45 animate-ping" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
                    </span>
                    <span className="text-[9px] font-bold tracking-[0.20em] uppercase text-emerald-600">Live</span>
                    <span className="h-2.5 w-px bg-black/10" />
                    <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#8C6B1F]">
                      AI Real Estate Intelligence Engine
                    </span>
                  </div>

                  {/* Card header */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8C972] to-[#C6A86B] text-[#1A140F] shadow-[inset_0_1px_0_rgba(255,245,210,0.55)]">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="text-[13px] font-semibold text-[#111111]">Property AI Dashboard</span>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Avg ROI', val: '12.4%', up: true },
                      { label: 'Yield', val: '5.8%', up: true },
                      { label: 'Demand', val: '94', up: true },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl bg-[#F8F8F8] border border-black/[0.04] p-3">
                        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-black/45">{m.label}</div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-[18px] font-bold text-[#111111] tabular-nums">{m.val}</span>
                          <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={2.2} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ROI graph + heatmap row */}
                  <div className="mt-3 grid grid-cols-5 gap-3">
                    {/* ROI graph */}
                    <div className="col-span-3 rounded-xl bg-[#F8F8F8] border border-black/[0.04] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-black/45">ROI Forecast</span>
                        <span className="text-[10px] font-semibold text-emerald-600">+40% YTD</span>
                      </div>
                      <div className="mt-3 flex items-end gap-[3px] h-[88px]">
                        {CHART_BARS.map((h, i) => (
                          <div
                            key={i}
                            className="glm-roi-bar flex-1 rounded-sm bg-gradient-to-t from-[#D4AF37] to-[#E8C972] shadow-[inset_0_1px_0_rgba(255,245,210,0.55)]"
                            style={{
                              height: `${h}%`,
                              opacity: 0.6 + (h / 100) * 0.4,
                              animationDelay: `${i * 0.06}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Heatmap mini */}
                    <div className="col-span-2 rounded-xl bg-[#F8F8F8] border border-black/[0.04] p-3.5">
                      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-black/45">Demand Heatmap</div>
                      <div className="mt-3 grid grid-cols-4 gap-1">
                        {[60, 35, 80, 90, 25, 55, 70, 95, 45, 65, 88, 72].map((v, i) => (
                          <div
                            key={i}
                            className="glm-heat-cell aspect-square rounded-sm"
                            style={{
                              background: `rgba(212,175,55,${0.18 + (v / 100) * 0.65})`,
                              animationDelay: `${i * 0.18}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Insight panel row */}
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#FFFDF6] to-white p-3.5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#D4AF37]/30 text-[#8C6B1F]">
                      <MapPin className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-[#111111] truncate">
                        Top pick: <span className="text-[#8C6B1F]">BKC, Mumbai</span>
                      </div>
                      <div className="text-[11.5px] text-black/55">
                        Predicted ROI 12.4% · Confidence Strong
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#D4AF37] shrink-0" strokeWidth={2.2} />
                  </div>
                </div>

                {/* Floating micro-card — top-left */}
                <div className="absolute -top-4 -left-3 hidden sm:flex items-center gap-2 rounded-xl bg-white border border-black/[0.05] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[12px] font-semibold text-[#111111]">+18% Growth</span>
                </div>

                {/* Floating micro-card — bottom-right */}
                <div className="absolute -bottom-4 -right-3 hidden sm:flex items-center gap-2 rounded-xl bg-white border border-black/[0.05] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#E8C972] to-[#C6A86B] text-[#1A140F]">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="text-[12px] font-semibold text-[#111111]">AI Insight Generated</span>
                </div>
              </div>
            </div>
          </LandingShell>
        </section>

        {/* ═══ MARKET PULSE — stats + ticker + trust, tight vertical stack ═══ */}
        <section className="relative py-16 overflow-hidden" aria-label="Market pulse">
          {/* Subtle radial near content */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(45% 60% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)',
            }}
          />

          <LandingShell>
            {/* Section heading */}
            <div className="text-center" data-reveal>
              <p className="text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#8C6B1F]">
                Market Pulse
              </p>
              <h2 className="mt-2 text-[clamp(20px,2.2vw,26px)] font-semibold tracking-[-0.015em] text-[#111111]">
                Live performance, at a glance
              </h2>
            </div>

            {/* Stats card */}
            <div className="mt-8" data-reveal>
              <div className="lp-stats-row">
                {HERO_STATS.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="lp-stat-item">
                      <Icon className="h-5 w-5 text-[#C6A86B]/40" strokeWidth={1.5} />
                      <div>
                        <span className="lp-stat-value">{s.value}</span>
                        <span className="lp-stat-label">{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticker bar */}
            <div className="mt-7" data-reveal>
              <div className="lp-ticker-wrap" aria-label="Live market signals">
                <div className="lp-ticker">
                  {[...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA].map((m, i) => (
                    <div key={`${m.city}-${i}`} className="lp-ticker-item">
                      <span className="text-base">{m.flag}</span>
                      <span className="font-semibold text-white/75">{m.city}</span>
                      <span className="text-[#22C55E] font-bold">{m.growth}</span>
                      <span className="text-white/15">|</span>
                      <span className="text-[#C6A86B]/60 text-[12px]">{m.yield} yield</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trusted logos */}
            <div className="mt-8" data-reveal>
              <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[#9A8B7E] mb-5">
                Trusted by leading institutions
              </p>
              <div className="lp-logo-row">
                {LOGOS.map(name => <span key={name} className="lp-logo">{name}</span>)}
              </div>
            </div>
          </LandingShell>
        </section>

        <LandingShell><div className="lp-separator" /></LandingShell>

        {/* ═══ FEATURES — horizontal strip ═══ */}
        <section className="lp-section lp-section-tight" id="features">
          <LandingShell>
            <div className="glm-feature-strip" data-reveal>
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="glm-feature-item" style={{ transitionDelay: `${i * 80}ms` }}>
                    <span className="glm-feature-icon">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="glm-feature-meta">
                      <h3 className="glm-feature-title">{f.title}</h3>
                      <p className="glm-feature-desc">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </LandingShell>
        </section>

        <LandingShell><div className="lp-separator" /></LandingShell>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="lp-section">
          <LandingShell>
            <div className="text-center mb-16" data-reveal>
              <div className="lp-pill"><Zap className="h-3.5 w-3.5 text-[#D4AF37]" /> Process</div>
              <h2 className="lp-section-title">Intelligence in Three Steps</h2>
            </div>

            <div className="lp-steps-grid">
              {PROCESS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="lp-step-card group"
                    data-reveal
                    style={{ transitionDelay: `${i * 110}ms` }}
                  >
                    <div className="lp-step-number">{step.num}</div>
                    <div className="lp-step-icon">
                      <Icon className="h-5 w-5 text-[#C6A86B]/50 group-hover:text-[#D4AF37] transition-colors duration-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-[#1F1A14] mb-2">{step.title}</h3>
                    <p className="text-[13px] text-[#5C5147] leading-relaxed">{step.desc}</p>
                    {i < PROCESS.length - 1 && <div className="lp-step-connector" />}
                  </div>
                );
              })}
            </div>
          </LandingShell>
        </section>

        <LandingShell><div className="lp-separator" /></LandingShell>

        {/* ═══ LIVE AI DASHBOARD — visual centerpiece ═══ */}
        <section className="glm-dashboard-hero">
          <div aria-hidden className="glm-dashboard-aura" />
          <LandingShell>
            <div className="text-center mb-14" data-reveal>
              <div className="glm-dashboard-label">
                <span className="glm-dashboard-dot" />
                <span>Live · Real-time</span>
              </div>
              <h2 className="glm-dashboard-title">Live AI Dashboard</h2>
              <p className="glm-dashboard-sub">Your investment command center, live and learning.</p>
            </div>

            <div className="glm-dashboard-stage" data-reveal>
              <div aria-hidden className="glm-dashboard-glow" />
              <div className="lp-browser glm-dashboard-frame">
              <div className="lp-browser-toolbar">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="lp-browser-url">
                  <Lock className="h-3 w-3 text-white/25" />
                  <span className="text-[11px] text-white/35">app.estraglimmora.com/dashboard</span>
                </div>
              </div>
              <div className="lp-browser-body">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {DASHBOARD_STATS.map((s, i) => (
                    <div key={s.label} className="lp-preview-stat" style={{ animationDelay: `${i * 0.1}s` }}>
                      <span className="lp-preview-stat-label">{s.label}</span>
                      <div className="lp-preview-stat-row">
                        <span className="lp-preview-stat-value">{s.val}</span>
                        <span className="lp-preview-stat-growth">{s.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="sm:col-span-3 lp-preview-stat">
                    <span className="lp-preview-stat-label">ROI Performance</span>
                    <div className="flex items-end gap-[6px] h-[180px] mt-3">
                      {CHART_BARS.map((h, i) => (
                        <div key={i} className="lp-chart-bar" style={{ height: `${h}%`, animationDelay: `${0.3 + i * 0.05}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2 lp-preview-stat">
                    <span className="lp-preview-stat-label">Top Properties</span>
                    <div className="mt-2">
                      {[
                        { name: 'Palm Jumeirah Villa', roi: '12.4%' },
                        { name: 'Marina Bay Suite', roi: '8.7%' },
                        { name: 'Canary Wharf Office', roi: '6.2%' },
                        { name: 'Shibuya Apartment', roi: '5.8%' },
                      ].map(p => (
                        <div key={p.name} className="lp-preview-row">
                          <span className="lp-preview-row-name">{p.name}</span>
                          <span className="lp-preview-row-value">{p.roi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </LandingShell>
        </section>

        {/* ═══ SECTION 1 — AI SYSTEM (premium light glass) ═══ */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-[#FAFAFA] to-[#F3F4F6]" id="ai-section">
          {/* Radial gold glow */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.10),transparent_60%)]"
          />

          <LandingShell>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.06] bg-white/70 backdrop-blur text-[10.5px] font-semibold tracking-[0.20em] uppercase text-[#8C6B1F] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <Brain className="h-3.5 w-3.5" strokeWidth={2} />
                AI System
              </div>
              <h2 className="mt-5 text-[clamp(30px,3.8vw,46px)] font-semibold leading-[1.06] tracking-[-0.025em] text-[#14110D]" style={{ fontFamily: 'var(--font-serif)' }}>
                Real-time intelligence engine
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-[15px] leading-relaxed text-[#5C5147]">
                Insight on the left, conversation on the right — one connected system.
              </p>
            </div>

            {/* Two-column with connector hairline */}
            <div className="relative">
              {/* Connector — absolute, centered between cards */}
              <div
                aria-hidden
                className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent z-10 pointer-events-none"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT — AI Market Insight */}
                <article className="group h-full bg-white/70 backdrop-blur-xl border border-black/[0.05] rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center gap-2.5 text-[#8C6B1F]">
                    <Brain className="h-4 w-4" strokeWidth={1.8} />
                    <span className="text-[10.5px] font-semibold tracking-[0.22em] uppercase">
                      AI Market Insight
                    </span>
                  </div>

                  <h3 className="mt-5 text-[clamp(24px,2.6vw,30px)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#14110D]">
                    Mumbai showing strong{' '}
                    <span className="glm-gold-text">growth momentum</span>
                  </h3>

                  <dl className="mt-7 space-y-4">
                    <div className="flex items-baseline justify-between border-b border-black/[0.05] pb-3">
                      <dt className="text-[13px] text-[#5C5147] font-medium">Projected ROI</dt>
                      <dd className="text-[15px] font-semibold text-[#14110D] tabular-nums">10–13%</dd>
                    </div>
                    <div className="flex items-baseline justify-between border-b border-black/[0.05] pb-3">
                      <dt className="text-[13px] text-[#5C5147] font-medium">Demand Index</dt>
                      <dd className="text-[15px] font-semibold text-[#14110D]">High</dd>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <dt className="text-[13px] text-[#5C5147] font-medium">AI Confidence</dt>
                      <dd className="flex items-center gap-1.5 text-[15px] font-semibold text-[#14110D]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Strong
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href="/login"
                    className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8C6B1F] transition-all duration-300 hover:gap-2.5 hover:text-[#6B4F0F]"
                  >
                    Explore Insights
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </Link>
                </article>

                {/* RIGHT — AI Command Center (hero) */}
                <article className="group h-full bg-white/70 backdrop-blur-xl border border-black/[0.05] rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8C972] to-[#C6A86B] text-[#1A140F] shadow-[inset_0_1px_0_rgba(255,245,210,0.55),0_0_18px_rgba(212,175,55,0.22)]">
                      <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#14110D] leading-tight">
                        AI Command Center
                      </h3>
                      <p className="mt-1 text-[12.5px] text-[#5C5147]">
                        Real-time intelligence engine
                      </p>
                    </div>
                  </div>

                  {/* Premium glass input — soft dark gradient, gold-glow on hover */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); }}
                    className="glm-cmd-input group/input relative mt-6 flex items-center gap-3 overflow-hidden rounded-xl px-5 py-4 transition-all duration-300 ease-out border border-white/10 hover:-translate-y-0.5 hover:border-[#D4AF37]/35 hover:shadow-[0_12px_36px_rgba(212,175,55,0.18)] focus-within:-translate-y-0.5 focus-within:border-[#D4AF37]/55 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12),0_12px_40px_rgba(212,175,55,0.22)]"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(15,15,15,0.92) 0%, rgba(26,26,26,0.92) 100%)',
                      backdropFilter: 'blur(12px) saturate(1.1)',
                      WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
                    }}
                  >
                    {/* Shimmer light sweep — runs once on hover */}
                    <span aria-hidden className="glm-cmd-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 opacity-0 group-hover/input:opacity-100" />

                    <Brain className="h-4 w-4 shrink-0 text-[#D4AF37]/80 transition-colors duration-300 group-hover/input:text-[#D4AF37]" strokeWidth={1.8} />
                    <input
                      type="text"
                      aria-label="Ask Glimmora AI anything"
                      placeholder="Ask Glimmora AI anything…"
                      className="relative z-[1] flex-1 min-w-0 bg-transparent text-[14px] text-[#FFFFFF] placeholder:text-white/40 outline-none caret-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      aria-label="Send"
                      className="relative z-[1] inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#E8C972] to-[#C6A86B] text-[#1A140F] shadow-[0_0_14px_rgba(212,175,55,0.30)] transition-all duration-300 ease-out group-hover/input:translate-x-0.5 group-hover/input:scale-[1.04] group-hover/input:shadow-[0_0_24px_rgba(212,175,55,0.55)]"
                    >
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/input:translate-x-0.5" strokeWidth={2.2} />
                    </button>
                  </form>

                  {/* Activity feedback — alive, soft, premium */}
                  <div className="mt-4 flex items-center gap-2.5 text-[12.5px]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                      <span className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
                    </span>
                    <span className="glm-activity-text font-medium tracking-[0.005em] text-emerald-600/90">
                      Analyzing 12,000+ properties in real-time…
                    </span>
                  </div>

                  {/* Suggestion chips — luxury soft pills */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      { label: 'Best ROI markets', active: true },
                      { label: 'Compare cities', active: false },
                      { label: 'Investment insights', active: false },
                    ].map(({ label, active }) => (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={active}
                        className={
                          active
                            ? 'glm-pill glm-pill-active'
                            : 'glm-pill'
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </LandingShell>
        </section>

        {/* ═══ FINAL CLOSING — headline + 3 feature cards + CTA ═══ */}
        <section className="py-24 bg-gradient-to-b from-[#F3F4F6] to-white" id="closing">
          <LandingShell>
            <div className="max-w-3xl mx-auto text-center" data-reveal>
              <h2
                className="text-[clamp(30px,4vw,48px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#111111]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Make smarter real estate decisions{' '}
                <span className="glm-gold-text">with AI</span>
              </h2>
              <p className="mt-5 max-w-xl mx-auto text-[15px] leading-relaxed text-black/60">
                Real-time market data, ROI predictions, and location intelligence —
                so every decision is grounded in evidence, not guesswork.
              </p>
            </div>

            {/* Three feature cards */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6" data-reveal>
              {[
                {
                  icon: Activity,
                  title: 'Real-time insights',
                  desc: 'Live market signals across 50+ micro-markets, refreshed every minute.',
                },
                {
                  icon: MapPin,
                  title: 'Location intelligence',
                  desc: 'Demand, supply, and growth heatmaps tuned to neighbourhood scale.',
                },
                {
                  icon: Brain,
                  title: 'AI predictions',
                  desc: 'ROI, yield, and price-trajectory forecasts with transparent confidence.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group bg-[#F8F8F8] border border-black/[0.05] rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:border-[#D4AF37]/30 hover:shadow-[0_18px_44px_rgba(0,0,0,0.08),0_0_0_3px_rgba(212,175,55,0.05)]"
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-[#D4AF37]/25 text-[#8C6B1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[#E8C972] group-hover:to-[#C6A86B] group-hover:text-[#1A140F] group-hover:border-transparent group-hover:shadow-[0_0_18px_rgba(212,175,55,0.30)]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-[15.5px] font-semibold tracking-[-0.005em] text-[#111111]">
                    {title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-black/60">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <div className="mt-12 flex justify-center" data-reveal>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#E8C972] via-[#D4AF37] to-[#B8902E] px-7 py-3.5 text-[14.5px] font-semibold text-[#1A140F] shadow-[inset_0_1px_0_rgba(255,245,210,0.55),0_8px_24px_rgba(212,175,55,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,245,210,0.65),0_16px_44px_rgba(212,175,55,0.45)]"
              >
                Start with Glimmora AI
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.2} />
              </Link>
            </div>
          </LandingShell>
        </section>

      </main>

      {/* ═══ FOOTER — luxury structured ═══ */}
      <footer className="glm-footer">
        <LandingShell>
          {/* Top — brand + 3 nav columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pt-16 pb-12">
            {/* Brand */}
            <div className="lg:col-span-5">
              <Link href="/" className="inline-flex items-center" aria-label="Estra Glimmora — Home">
                <img
                  src="/EstraGlimmora_logo.png"
                  alt="Estra Glimmora"
                  className="h-11 w-auto object-contain max-w-[220px]"
                  draggable={false}
                />
              </Link>
              <p className="mt-6 max-w-md text-[13.5px] leading-relaxed text-black/60">
                Glimmora AI turns billions of real-time data points into clear, scored
                investment decisions — so serious investors move with conviction, not
                speculation.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
                <span className="text-[12px] tracking-[0.10em] uppercase text-black/55">All systems operational</span>
              </div>
            </div>

            {/* Platform */}
            <div className="lg:col-span-2">
              <h4 className="text-[10.5px] font-semibold tracking-[0.20em] uppercase text-black/45">Platform</h4>
              <ul className="mt-4 space-y-2.5">
                {['Smart Search', 'AI Insights', 'Portfolio', 'Properties', 'Compare'].map(l => (
                  <li key={l}>
                    <a href="#" className="glm-foot-link">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="lg:col-span-2">
              <h4 className="text-[10.5px] font-semibold tracking-[0.20em] uppercase text-black/45">Resources</h4>
              <ul className="mt-4 space-y-2.5">
                {['Market Reports', 'Documentation', 'Case Studies', 'API Reference', 'Changelog'].map(l => (
                  <li key={l}>
                    <a href="#" className="glm-foot-link">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-3">
              <h4 className="text-[10.5px] font-semibold tracking-[0.20em] uppercase text-black/45">Company</h4>
              <ul className="mt-4 space-y-2.5">
                {['About Glimmora', 'Investors', 'Press', 'Careers', 'Contact'].map(l => (
                  <li key={l}>
                    <a href="#" className="glm-foot-link">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom strip — locations / contact / email */}
          <div className="border-t border-black/[0.06] pt-6 pb-8 flex flex-col lg:flex-row gap-4 lg:gap-8 lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-black/55">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} />
                Mumbai · Pune · Bengaluru
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} />
                <a href="mailto:hello@glimmora.ai" className="glm-foot-link">hello@glimmora.ai</a>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-black/45">
              <span>&copy; 2026 Estra Glimmora. All rights reserved.</span>
              <a href="#" className="glm-foot-link">Privacy</a>
              <a href="#" className="glm-foot-link">Terms</a>
              <a href="#" className="glm-foot-link">Security</a>
            </div>
          </div>
        </LandingShell>
      </footer>
    </div>
  );
}
