import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight, TrendingUp, Activity, MapPin, Globe,
} from 'lucide-react';
import ParallaxBinder from './_parallax';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="it-page">
      <ParallaxBinder />
      <div className="it-stage">
        <div className="it-split-card">
          {/* ═══════ LEFT — Product Preview (58%) ═══════ */}
          <div className="it-brand-panel group/panel">
            {/* Layer 1 — Full-bleed luxury skyline (golden hour) */}
            <div className="it-bg-image">
              <Image
                src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&q=80&auto=format&fit=crop"
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 0vw, 60vw"
                className="it-bg-img"
              />
            </div>

            {/* Layer 2 — Beige veil: opaque on the left, transparent on the right */}
            <div className="it-bg-veil" aria-hidden />

            {/* Layer 3 — Slow gradient sheen (very subtle motion) */}
            <div className="it-bg-sheen" aria-hidden />

            {/* Layer 4 — Floating data-viz hint (animated AI line) */}
            <svg
              className="it-bg-dataviz"
              viewBox="0 0 600 400"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="dvLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#C6A86B" stopOpacity="0" />
                  <stop offset="50%" stopColor="#C6A86B" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#C6A86B" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dvFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#C6A86B" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#C6A86B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M40 320 L120 280 L200 295 L280 230 L360 250 L440 175 L520 195 L580 130 L580 400 L40 400 Z"
                fill="url(#dvFill)"
              />
              <path
                className="it-dv-trace"
                d="M40 320 L120 280 L200 295 L280 230 L360 250 L440 175 L520 195 L580 130"
                fill="none"
                stroke="url(#dvLine)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[
                [120, 280], [200, 295], [280, 230], [360, 250], [440, 175], [520, 195],
              ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="#C6A86B" opacity="0.55" />
              ))}
            </svg>

            {/* Layer 5 — Floating particles (subconscious data feel) */}
            <div className="it-bg-particles" aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} style={{ ['--i' as string]: i }} />
              ))}
            </div>

            {/* Layer 6 — Grain texture for luxury depth */}
            <div className="it-bg-grain" aria-hidden />

            <div className="it-brand-inner">
              {/* Top: Logo + Back */}
              <div className="flex items-center justify-between w-full">
                <Link href="/" className="inline-flex items-center group" aria-label="Estra Glimmora — Home">
                  <img
                    src="/EstraGlimmora_logo.png"
                    alt="Estra Glimmora"
                    className="h-10 w-auto object-contain max-w-[200px]"
                    draggable={false}
                  />
                </Link>
                <Link href="/" className="it-back-link group">
                  <span>Back to platform</span>
                  <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Hero */}
              <div className="mt-auto">
                <div className="it-gold-rule mb-6" />
                <h2 className="it-hero-heading">
                  Institutional{' '}
                  <span className="it-headline-gold">
                    Real Estate Intelligence
                  </span>
                </h2>
                <p className="mt-4 text-[13px] text-white/28 leading-[1.8] max-w-[340px]">
                  AI-driven market insights, portfolio analytics, and risk
                  intelligence for institutional investors.
                </p>

                {/* Data Cards — 2×2 Grid */}
                <div className="it-data-grid">
                  <div className="it-data-card">
                    <div className="it-dc-icon blue">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div className="it-dc-body">
                      <span className="it-dc-label">Avg Price</span>
                      <span className="it-dc-value">
                        ₹18,750<span className="it-dc-unit">/sq.ft</span>
                      </span>
                    </div>
                    <em className="it-dc-delta up">+12.4%</em>
                  </div>

                  <div className="it-data-card">
                    <div className="it-dc-icon green">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="it-dc-body">
                      <span className="it-dc-label">Demand Index</span>
                      <span className="it-dc-value">
                        87 <span className="it-dc-tag">Very High</span>
                      </span>
                    </div>
                  </div>

                  <div className="it-data-card">
                    <div className="it-dc-icon gold">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="it-dc-body">
                      <span className="it-dc-label">Top ROI Zone</span>
                      <span className="it-dc-value">
                        BKC <em className="it-dc-delta up">8.7%</em>
                      </span>
                    </div>
                  </div>

                  <div className="it-data-card">
                    <div className="it-dc-icon purple">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <div className="it-dc-body">
                      <span className="it-dc-label">Markets Covered</span>
                      <span className="it-dc-value">186+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust bar */}
              <div className="it-trust-bar">
                <span className="it-trust-eyebrow">Trusted by institutional capital</span>
                <div className="it-trust-logos">
                  <span>JLL</span>
                  <span>Brookfield</span>
                  <span>CBRE</span>
                  <span>Knight Frank</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ RIGHT — Login Panel (40%) ═══════ */}
          <div className="it-form-panel">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
