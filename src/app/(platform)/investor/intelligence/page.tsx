'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfidenceMeter } from '@/components/shared';
import {
  TrendingUp, Globe, Building2, BrainCircuit,
  Sparkles, ArrowUpRight, Shield, Crown,
  BarChart3, Activity, Zap, Target,
  MapPin, Star, Bookmark, Eye, Layers, Play,
  Search, ArrowRight, Briefcase, MessageSquare,
} from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { marketTrends } from '@/mock-data/market-data';

/* ===== STATIC DATA ===== */

const PRICE_TRENDS_6M = [
  { month: 'Oct', Dubai: 112, Singapore: 104, London: 101, NewYork: 107, Mumbai: 118, Tokyo: 99 },
  { month: 'Nov', Dubai: 115, Singapore: 105, London: 102, NewYork: 108, Mumbai: 121, Tokyo: 99 },
  { month: 'Dec', Dubai: 118, Singapore: 106, London: 102, NewYork: 109, Mumbai: 124, Tokyo: 100 },
  { month: 'Jan', Dubai: 121, Singapore: 107, London: 103, NewYork: 110, Mumbai: 128, Tokyo: 100 },
  { month: 'Feb', Dubai: 124, Singapore: 108, London: 103, NewYork: 111, Mumbai: 132, Tokyo: 101 },
  { month: 'Mar', Dubai: 128, Singapore: 109, London: 104, NewYork: 113, Mumbai: 136, Tokyo: 101 },
];

const PRICE_TRENDS_1Y = [
  { month: 'Apr', Dubai: 108, Singapore: 101, London: 99,  NewYork: 104, Mumbai: 112, Tokyo: 99 },
  { month: 'May', Dubai: 109, Singapore: 102, London: 100, NewYork: 105, Mumbai: 114, Tokyo: 99 },
  { month: 'Jun', Dubai: 110, Singapore: 102, London: 100, NewYork: 105, Mumbai: 115, Tokyo: 99 },
  { month: 'Jul', Dubai: 111, Singapore: 103, London: 100, NewYork: 106, Mumbai: 116, Tokyo: 99 },
  { month: 'Aug', Dubai: 112, Singapore: 103, London: 101, NewYork: 106, Mumbai: 117, Tokyo: 99 },
  { month: 'Sep', Dubai: 112, Singapore: 104, London: 101, NewYork: 107, Mumbai: 118, Tokyo: 99 },
  { month: 'Oct', Dubai: 115, Singapore: 105, London: 102, NewYork: 108, Mumbai: 121, Tokyo: 99 },
  { month: 'Nov', Dubai: 118, Singapore: 106, London: 102, NewYork: 109, Mumbai: 124, Tokyo: 100 },
  { month: 'Dec', Dubai: 121, Singapore: 107, London: 103, NewYork: 110, Mumbai: 128, Tokyo: 100 },
  { month: 'Jan', Dubai: 124, Singapore: 108, London: 103, NewYork: 111, Mumbai: 132, Tokyo: 101 },
  { month: 'Feb', Dubai: 126, Singapore: 108, London: 103, NewYork: 112, Mumbai: 134, Tokyo: 101 },
  { month: 'Mar', Dubai: 128, Singapore: 109, London: 104, NewYork: 113, Mumbai: 136, Tokyo: 101 },
];

const PRICE_TRENDS_3Y = [
  { month: 'Q1 23', Dubai: 100, Singapore: 100, London: 100, NewYork: 100, Mumbai: 100, Tokyo: 100 },
  { month: 'Q2 23', Dubai: 103, Singapore: 101, London: 101, NewYork: 101, Mumbai: 104, Tokyo: 100 },
  { month: 'Q3 23', Dubai: 106, Singapore: 101, London: 100, NewYork: 102, Mumbai: 108, Tokyo: 100 },
  { month: 'Q4 23', Dubai: 108, Singapore: 102, London: 100, NewYork: 104, Mumbai: 112, Tokyo: 100 },
  { month: 'Q1 24', Dubai: 111, Singapore: 103, London: 101, NewYork: 105, Mumbai: 116, Tokyo: 100 },
  { month: 'Q2 24', Dubai: 114, Singapore: 104, London: 101, NewYork: 107, Mumbai: 120, Tokyo: 100 },
  { month: 'Q3 24', Dubai: 117, Singapore: 105, London: 102, NewYork: 109, Mumbai: 125, Tokyo: 100 },
  { month: 'Q4 24', Dubai: 121, Singapore: 107, London: 103, NewYork: 110, Mumbai: 128, Tokyo: 100 },
  { month: 'Q1 25', Dubai: 124, Singapore: 108, London: 103, NewYork: 111, Mumbai: 132, Tokyo: 101 },
  { month: 'Q2 25', Dubai: 126, Singapore: 108, London: 104, NewYork: 112, Mumbai: 134, Tokyo: 101 },
  { month: 'Q3 25', Dubai: 127, Singapore: 108, London: 104, NewYork: 113, Mumbai: 135, Tokyo: 101 },
  { month: 'Q4 25', Dubai: 128, Singapore: 109, London: 104, NewYork: 113, Mumbai: 136, Tokyo: 101 },
];

type RegionStatus = 'opportunity' | 'stable' | 'watch' | 'risk';
type AISignal    = 'Buy' | 'Hold' | 'Watch' | 'Caution';
type BestFor     = 'Income' | 'Growth' | 'Safety' | 'Balanced';
type RiskLevel   = 'Low' | 'Medium' | 'High';

const REGION_META: Record<string, {
  flag: string;
  sparkline: number[];
  color: string;
  status: RegionStatus;
  aiVerdict: string;
  bestFor: BestFor;
  risk: RiskLevel;
  signal: AISignal;
  expectedReturn: number;
  city: string;
  mapX: number; // % from left
  mapY: number; // % from top
}> = {
  Dubai:     { flag: '🇦🇪', sparkline: [100,104,108,115,121,128], color: '#8B7355', status: 'opportunity', aiVerdict: 'Strong momentum driven by expat influx and low vacancy. Continue buying.', bestFor: 'Income',   risk: 'Medium', signal: 'Buy',     expectedReturn: 14.2, city: 'Dubai, UAE',        mapX: 62.5, mapY: 39.1 },
  Singapore: { flag: '🇸🇬', sparkline: [100,101,103,105,107,109], color: '#6F5C46', status: 'stable',      aiVerdict: 'Steady fundamentals with strong institutional backing. Capital preservation.', bestFor: 'Safety',   risk: 'Low',    signal: 'Hold',    expectedReturn:  6.5, city: 'Singapore',         mapX: 73.6, mapY: 49.5 },
  London:    { flag: '🇬🇧', sparkline: [100,101,101,102,103,104], color: '#F59E0B', status: 'watch',       aiVerdict: 'Rate pressure and stamp duty weighing on prime London. Hold existing.', bestFor: 'Safety',   risk: 'Medium', signal: 'Caution', expectedReturn:  4.1, city: 'London, UK',        mapX: 50.0, mapY: 26.9 },
  'New York':{ flag: '🇺🇸', sparkline: [100,102,104,107,110,113], color: '#8B7355', status: 'stable',      aiVerdict: 'Manhattan resilience continues. Strong demand in outer boroughs.', bestFor: 'Balanced', risk: 'Medium', signal: 'Hold',    expectedReturn:  8.2, city: 'New York, USA',     mapX: 33.2, mapY: 32.0 },
  Mumbai:    { flag: '🇮🇳', sparkline: [100,106,112,120,128,136], color: '#A89478', status: 'opportunity', aiVerdict: 'Fastest growth globally. RERA compliance lifting institutional confidence.', bestFor: 'Growth',   risk: 'Medium', signal: 'Buy',     expectedReturn: 18.5, city: 'Mumbai, India',     mapX: 66.5, mapY: 42.9 },
  Tokyo:     { flag: '🇯🇵', sparkline: [100,100,100,100,101,101], color: '#9A8B7E', status: 'risk',        aiVerdict: 'BOJ policy uncertainty and demographic headwinds. Near-term caution.', bestFor: 'Safety',   risk: 'High',   signal: 'Watch',   expectedReturn:  3.1, city: 'Tokyo, Japan',      mapX: 81.7, mapY: 34.3 },
  Sydney:    { flag: '🇦🇺', sparkline: [100,102,103,105,106,107], color: '#A89478', status: 'stable',      aiVerdict: 'Undersupply crisis driving prices. Immigration supporting demand.', bestFor: 'Growth',   risk: 'Low',    signal: 'Hold',    expectedReturn:  7.8, city: 'Sydney, Australia', mapX: 84.3, mapY: 64.6 },
  Paris:     { flag: '🇫🇷', sparkline: [100,101,103,104,105,105], color: '#8B7355', status: 'stable',      aiVerdict: 'Golden visa demand and luxury segment holding. Selective buying.', bestFor: 'Balanced', risk: 'Low',    signal: 'Hold',    expectedReturn:  6.2, city: 'Paris, France',     mapX: 50.5, mapY: 28.4 },
};

const CITY_COLORS: Record<string, string> = {
  Dubai:     '#8B7355',
  Singapore: '#6F5C46',
  London:    '#F59E0B',
  NewYork:   '#8B7355',
  Mumbai:    '#A89478',
  Tokyo:     '#9A8B7E',
};

const AI_PREDICTIONS = [
  {
    id: 1,
    region: 'Dubai',
    title: 'Dubai Residential',
    signal: 'Buy' as AISignal,
    confidence: 94,
    expectedReturn: 14.2,
    horizon: '12–18 months',
    risk: 'Medium' as RiskLevel,
    summary: 'AI models detect continued upward pressure in Dubai Marina and JBR micro-markets driven by expat demand surge. Prime residential yielding 7.2%+.',
    catalyst: 'Expo City legacy demand + UAE Golden Visa expansion',
    icon: TrendingUp,
  },
  {
    id: 2,
    region: 'Mumbai',
    title: 'Mumbai Commercial',
    signal: 'Buy' as AISignal,
    confidence: 88,
    expectedReturn: 18.5,
    horizon: '12–24 months',
    risk: 'Medium' as RiskLevel,
    summary: 'Office absorption in BKC and Worli at 3-year highs. RERA improvements attracting institutional capital. Grade-A yields: 7.8–8.5%.',
    catalyst: 'Infrastructure investment + IT sector expansion',
    icon: BrainCircuit,
  },
  {
    id: 3,
    region: 'London',
    title: 'London Prime',
    signal: 'Caution' as AISignal,
    confidence: 79,
    expectedReturn: 4.1,
    horizon: '24+ months',
    risk: 'Medium' as RiskLevel,
    summary: 'Elevated interest rate environment and stamp duty exposure creating valuation pressure in prime central London. Recommend hold.',
    catalyst: 'BOE rate decisions + UK political cycle',
    icon: Globe,
  },
];

const PERSONAL_RECS = [
  { id: 1, title: 'Dubai Marina Penthouse',  type: 'Luxury Residential', region: 'Dubai',     matchScore: 97, yield: 7.4, growth: 13.8, price: '₹2.1M',  reason: 'Matches your high-yield income preference',        tag: 'Top Pick'   },
  { id: 2, title: 'Mumbai BKC Commercial',   type: 'Grade-A Office',     region: 'Mumbai',    matchScore: 91, yield: 8.2, growth: 16.5, price: '₹890K',  reason: 'Highest growth potential in your budget range',    tag: 'High Growth'},
  { id: 3, title: 'Singapore Orchard Apt',   type: 'Prime Residential',  region: 'Singapore', matchScore: 85, yield: 5.1, growth:  8.5, price: '₹1.6M', reason: 'Low-risk diversification for your portfolio',      tag: 'Safe Haven' },
];

const PORTFOLIO_ALLOC = [
  { region: 'Dubai',     flag: '🇦🇪', pct: 35, color: '#8B7355', return: 14.2, yield: 7.2 },
  { region: 'Mumbai',    flag: '🇮🇳', pct: 25, color: '#A89478', return: 18.5, yield: 5.5 },
  { region: 'Singapore', flag: '🇸🇬', pct: 25, color: '#4ADE80', return:  6.5, yield: 4.8 },
  { region: 'London',    flag: '🇬🇧', pct: 15, color: '#F59E0B', return:  4.1, yield: 3.5 },
];

const LIVE_SIGNALS = [
  { city: 'Dubai',     text: 'Marina district yields up 0.4% — strong momentum continues',   type: 'bullish' as const },
  { city: 'Mumbai',    text: 'BKC commercial space absorption hits 3-year high',               type: 'bullish' as const },
  { city: 'Singapore', text: 'Orchard Road vacancy at historic low of 2.1%',                  type: 'neutral' as const },
  { city: 'New York',  text: 'Manhattan Q1 luxury sales +18% QoQ, spring surge confirmed',    type: 'bullish' as const },
  { city: 'Tokyo',     text: 'BOJ rate uncertainty — institutional buyers pause acquisitions', type: 'bearish' as const },
  { city: 'Sydney',    text: 'Government housing supply initiative announced',                 type: 'neutral' as const },
  { city: 'London',    text: 'Stamp duty threshold revision under parliamentary review',       type: 'neutral' as const },
  { city: 'Paris',     text: 'Golden Visa demand driving 8th arrondissement rents +6%',       type: 'bullish' as const },
];

const yieldData = marketTrends.map((t) => ({ region: t.region, yield: t.yield, growth: t.growth }));

/* ===== MAP GEOMETRY ===== */
// Arc connections between major markets (mapX/mapY based on Mercator projection: scale=130, center=[0,0], 1000×562)
const MAP_CONNECTIONS: [string, string][] = [
  ['Dubai',     'Mumbai'],
  ['Dubai',     'Singapore'],
  ['London',    'New York'],
  ['New York',  'Singapore'],
  ['Mumbai',    'Singapore'],
  ['London',    'Paris'],
];

/* ===== HELPERS ===== */

function getSignalColor(signal: AISignal): string {
  if (signal === 'Buy')     return '#4ADE80';
  if (signal === 'Hold')    return '#8B7355';
  if (signal === 'Watch')   return '#F59E0B';
  return '#EF4444';
}
function getSignalBg(signal: AISignal): string {
  if (signal === 'Buy')     return 'rgba(74,222,128,0.08)';
  if (signal === 'Hold')    return 'rgba(139,115,85,0.08)';
  if (signal === 'Watch')   return 'rgba(245,158,11,0.08)';
  return 'rgba(239,68,68,0.08)';
}
function getRiskColor(risk: RiskLevel): string {
  if (risk === 'Low')    return '#4ADE80';
  if (risk === 'Medium') return '#F59E0B';
  return '#EF4444';
}
function getStatusColor(status: RegionStatus): string {
  if (status === 'opportunity') return '#4ADE80';
  if (status === 'stable')      return '#8B7355';
  if (status === 'watch')       return '#F59E0B';
  return '#EF4444';
}
function getStatusLabel(status: RegionStatus): string {
  if (status === 'opportunity') return 'Opportunity';
  if (status === 'stable')      return 'Stable';
  if (status === 'watch')       return 'Watch';
  return 'Caution';
}
function getBestForColor(bestFor: BestFor): string {
  if (bestFor === 'Income')   return '#8B7355';
  if (bestFor === 'Growth')   return '#4ADE80';
  if (bestFor === 'Safety')   return '#A89478';
  return '#A89478';
}
function getTypeAccent(signal: AISignal): string {
  if (signal === 'Buy')  return 'i-accent-bullish';
  if (signal === 'Hold') return 'i-accent-opportunity';
  return 'i-accent-cautious';
}
function getDemandColor(demand: string): string {
  if (demand === 'high')   return '#4ADE80';
  if (demand === 'medium') return '#F59E0B';
  return 'var(--fg-muted)';
}
function getDemandWidth(demand: string): string {
  if (demand === 'high')   return '85%';
  if (demand === 'medium') return '55%';
  return '30%';
}

/* ===== COMPONENTS ===== */

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-${color.replace('#', '')}`;
  return (
    <div className="i-sparkline">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; color: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3 shadow-xl min-w-[150px]" style={{ backdropFilter: 'blur(12px)' }}>
      <p className="text-[9px] uppercase tracking-widest text-[var(--fg-muted)] mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[11px] mb-0.5">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-[var(--fg-secondary)]">{p.dataKey === 'NewYork' ? 'New York' : p.dataKey}:</span>
          <span className="font-semibold text-[var(--fg)] ml-auto pl-2">{p.value}</span>
        </div>
      ))}
      <p className="text-[9px] text-[var(--fg-muted)] mt-2 pt-1.5 border-t border-[var(--border)]">Base 100 = start of period</p>
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; name: string; fill: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3 shadow-xl" style={{ backdropFilter: 'blur(12px)' }}>
      <p className="text-[11px] font-semibold text-[var(--fg)] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.fill }} />
          <span className="text-[var(--fg-secondary)]">{p.name}:</span>
          <span className="font-semibold text-[var(--fg)]">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

/* ===== LIVE TICKER ===== */
function LiveTicker() {
  const doubled = [...LIVE_SIGNALS, ...LIVE_SIGNALS];
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]" style={{ height: 38 }}>
      {/* Scrolling track */}
      <div
        className="flex items-center h-full"
        style={{ animation: 'tickerScroll 50s linear infinite', width: 'max-content' }}
      >
        {doubled.map((sig, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-5 whitespace-nowrap">
            <span
              className="text-[10px] font-semibold"
              style={{ color: sig.type === 'bullish' ? '#4ADE80' : sig.type === 'bearish' ? '#EF4444' : '#8B7355' }}
            >
              {sig.city}
            </span>
            <span className="text-[10px] text-[var(--fg-secondary)]">{sig.text}</span>
            <span className="text-[var(--fg-muted)] pl-4 opacity-30">·</span>
          </span>
        ))}
      </div>
      {/* Live badge overlay */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2 pl-3 pr-8 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, var(--bg-secondary) 55%, transparent)' }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#4ADE80] whitespace-nowrap">Live</span>
      </div>
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, var(--bg-secondary), transparent)' }}
      />
    </div>
  );
}

/* ===== WORLD MAP ===== */
function WorldMap({
  onRegionHover,
  hoveredRegion,
}: {
  onRegionHover: (r: string | null) => void;
  hoveredRegion: string | null;
}) {
  const svgX = (pct: number) => (pct / 100) * 1000;
  const svgY = (pct: number) => (pct / 100) * 562;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ border: '1px solid #D6CCBE', aspectRatio: '16/9', minHeight: 240, background: '#EDE7DF' }}>

      {/* ── REACT-SIMPLE-MAPS: proper country boundaries ── */}
      <div className="absolute inset-0">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [0, 0] }}
          width={1000}
          height={562}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography="/countries-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#D8E4F0"
                  stroke="#9A8B7E"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: '#C0D3E8' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* ── ARC + GLOW OVERLAY ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 562" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glowCity" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* City glow halos */}
        {Object.entries(REGION_META).map(([name, meta]) => {
          const col = getStatusColor(meta.status);
          const isH = hoveredRegion === name;
          return (
            <circle key={name}
              cx={svgX(meta.mapX)} cy={svgY(meta.mapY)}
              r={isH ? 20 : 12}
              fill={col}
              opacity={isH ? 0.18 : 0.08}
              style={{ filter: 'blur(6px)', transition: 'r 0.2s, opacity 0.2s' }}
            />
          );
        })}

        {/* Connection arcs */}
        {MAP_CONNECTIONS.map(([a, b]) => {
          const ma = REGION_META[a], mb = REGION_META[b];
          if (!ma || !mb) return null;
          const ax = svgX(ma.mapX), ay = svgY(ma.mapY);
          const bx = svgX(mb.mapX), by = svgY(mb.mapY);
          const cx = (ax + bx) / 2;
          const cy = Math.min(ay, by) - Math.abs(bx - ax) * 0.17 - 18;
          const active = hoveredRegion === a || hoveredRegion === b;
          return (
            <path key={`${a}-${b}`}
              d={`M ${ax},${ay} Q ${cx},${cy} ${bx},${by}`}
              fill="none"
              stroke={active ? '#8B7355' : '#9A8B7E'}
              strokeWidth={active ? 1.5 : 0.8}
              strokeDasharray={active ? '' : '4,7'}
              opacity={active ? 0.7 : 0.3}
              style={{ transition: 'stroke 0.2s, strokeWidth 0.2s, opacity 0.2s' }}
            />
          );
        })}

        {/* Equator line */}
        <line x1="0" y1={281} x2="1000" y2={281}
          stroke="rgba(154,139,126,0.25)" strokeWidth="0.8" strokeDasharray="5,8" />

        {/* Longitude grid */}
        {[-120, -60, 0, 60, 120].map((lon) => (
          <line key={lon}
            x1={130 * (lon * Math.PI / 180) + 500} y1="0"
            x2={130 * (lon * Math.PI / 180) + 500} y2="562"
            stroke="rgba(154,139,126,0.10)" strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* ── HTML LAYER: interactive city nodes + labels + hover cards ── */}
      <div className="absolute inset-0 pointer-events-none select-none">

        {/* Map header badge */}
        <div className="absolute top-3 left-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid #D6CCBE', backdropFilter: 'blur(8px)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Global Market Radar
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 right-4 inline-flex items-center gap-3 px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid #E6E0D8', backdropFilter: 'blur(6px)' }}>
          {([
            { label: 'Opportunity', color: '#16A34A' },
            { label: 'Stable',      color: '#B45309' },
            { label: 'Watch',       color: '#D97706' },
            { label: 'Caution',     color: '#DC2626' },
          ] as const).map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[8px] font-medium text-stone-500">{item.label}</span>
            </div>
          ))}
        </div>

        {/* City nodes */}
        {Object.entries(REGION_META).map(([name, meta]) => {
          const isH = hoveredRegion === name;
          const col = getStatusColor(meta.status);
          const trend = marketTrends.find((t) => t.region === name);

          // Smart hover card placement — avoid map overflow
          const card: React.CSSProperties = {
            position: 'absolute', zIndex: 50,
            minWidth: 210, maxWidth: 230,
            background: 'rgba(255,255,255,0.97)',
            border: `1px solid ${col}35`,
            boxShadow: `0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px ${col}18`,
            backdropFilter: 'blur(24px)',
            borderRadius: 14,
            padding: '13px 15px',
          };
          if (meta.mapX > 68)      { card.right = '125%'; card.left = 'auto'; }
          else if (meta.mapX < 35) { card.left = '125%'; }
          else                     { card.left = '50%'; card.transform = 'translateX(-50%)'; }
          if (meta.mapY > 55)      { card.bottom = '135%'; card.top = 'auto'; }
          else                     { card.top = '135%'; }

          return (
            <div key={name} className="absolute pointer-events-auto"
              style={{
                left: `${meta.mapX}%`, top: `${meta.mapY}%`,
                transform: 'translate(-50%,-50%)',
                zIndex: isH ? 40 : 10, cursor: 'pointer',
              }}
              onMouseEnter={() => onRegionHover(name)}
              onMouseLeave={() => onRegionHover(null)}
            >
              {/* Outer pulse ring for opportunity markets */}
              {meta.status === 'opportunity' && (
                <div className="absolute rounded-full pointer-events-none" style={{
                  inset: isH ? -13 : -9, border: `1.5px solid ${col}`,
                  opacity: 0.3, animation: 'pulse 2.5s ease-in-out infinite',
                }} />
              )}
              {/* Ring */}
              <div className="absolute rounded-full pointer-events-none transition-all duration-200" style={{
                inset: isH ? -7 : -4,
                border: `1.5px solid ${col}`,
                opacity: isH ? 0.8 : 0.45,
              }} />
              {/* Core dot */}
              <div className="rounded-full transition-all duration-150" style={{
                width: isH ? 13 : 9, height: isH ? 13 : 9,
                background: col,
                boxShadow: `0 0 ${isH ? 16 : 8}px ${col}bb`,
              }} />

              {/* Always-visible city label chip */}
              <div className="absolute pointer-events-none whitespace-nowrap"
                style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6, opacity: isH ? 1 : 0.9 }}>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: isH ? `${col}14` : 'rgba(255,255,255,0.92)',
                    border: `1px solid ${isH ? col + '40' : '#D6CCBE'}`,
                    backdropFilter: 'blur(6px)',
                    boxShadow: isH ? `0 0 8px ${col}25` : '0 1px 3px rgba(0,0,0,0.07)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span className="text-[9px] leading-none">{meta.flag}</span>
                  <span className="text-[9px] font-semibold leading-none"
                    style={{ color: isH ? col : '#3F352B' }}>
                    {name}
                  </span>
                </div>
              </div>

              {/* Hover detail card — light theme */}
              {isH && (
                <div style={card} className="pointer-events-none">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                      style={{ background: `${col}12`, border: `1px solid ${col}25` }}>
                      {meta.flag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold leading-tight text-stone-800">{name}</p>
                      <p className="text-[9px] mt-0.5 text-stone-400">{meta.city}</p>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${col}12`, color: col, border: `1px solid ${col}30` }}>
                      {getStatusLabel(meta.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
                    {[
                      { l: 'YoY Growth',  v: `+${trend?.growth ?? 0}%`,  c: '#16A34A' },
                      { l: 'Gross Yield', v: `${trend?.yield ?? 0}%`,    c: '#B45309' },
                      { l: 'AI Signal',   v: meta.signal,                c: getSignalColor(meta.signal) },
                      { l: 'Risk',        v: meta.risk,                  c: getRiskColor(meta.risk) },
                      { l: 'Exp. Return', v: `+${meta.expectedReturn}%`, c: '#3F352B' },
                      { l: 'Best For',    v: meta.bestFor,               c: getBestForColor(meta.bestFor) },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="rounded-lg px-2.5 py-1.5"
                        style={{ background: '#F9F7F4', border: '1px solid #E6E0D8' }}>
                        <p className="text-[8px] mb-0.5 text-stone-400">{l}</p>
                        <p className="text-[11px] font-bold leading-none" style={{ color: c }}>{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2"
                    style={{ background: '#FEFCE8', border: '1px solid #FDE68A' }}>
                    <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" strokeWidth={1.5} />
                    <p className="text-[8.5px] leading-[1.6] text-stone-600">{meta.aiVerdict}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== PAGE ===== */

export default function IntelligencePage() {
  const router = useRouter();
  const [chartPeriod, setChartPeriod] = useState<'6M' | '1Y' | '3Y'>('6M');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [savedRecs, setSavedRecs] = useState<Set<number>>(new Set());

  const byGrowth = [...marketTrends].sort((a, b) => b.growth - a.growth);
  const byYield  = [...marketTrends].sort((a, b) => b.yield  - a.yield);
  const lowRisk  = marketTrends.filter((t) => REGION_META[t.region]?.risk === 'Low');

  const bestBuy  = byGrowth[0];
  const topYield = byYield[0];
  const safest   = lowRisk[0] ?? marketTrends[1];
  const topGrowth= byGrowth[0];

  const chartData = chartPeriod === '6M' ? PRICE_TRENDS_6M : chartPeriod === '1Y' ? PRICE_TRENDS_1Y : PRICE_TRENDS_3Y;

  const blendedReturn = PORTFOLIO_ALLOC.reduce((acc, a) => acc + (a.return * a.pct / 100), 0);
  const blendedYield  = PORTFOLIO_ALLOC.reduce((acc, a) => acc + (a.yield  * a.pct / 100), 0);

  function toggleSaveRec(id: number) {
    setSavedRecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl relative">

      {/* Ambient orbs */}
      <div className="c-ambient-gold" />
      <div className="c-ambient-violet" />

      {/* ====================================================
          MARKET ALERT BANNER
      ==================================================== */}
      <div className="mb-5 i-fade-in rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/[0.03] px-5 py-3.5 flex items-center gap-3 flex-wrap">
        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--fg)]">Market Alert: Dubai rental yields hit 18-month high</p>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">AI detects a buying window in Marina and JBR sub-markets. 7.2% average gross yield — 40% above global average.</p>
        </div>
        <button className="shrink-0 text-xs font-semibold text-[#8B7355] hover:text-[#8B7355] transition-colors cursor-pointer">View Analysis →</button>
      </div>

      {/* ====================================================
          SECTION 1 — HERO COMMAND CENTER
      ==================================================== */}
      <div className="mb-6 i-fade-in">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#8B7355]/20 to-[#8B7355]/5 border border-[#8B7355]/15 flex items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
              </div>
              <p className="c-label" style={{ marginBottom: 0 }}>Market Intelligence</p>
            </div>
            <h1
              className="text-[32px] leading-[1.1] font-semibold text-[var(--fg)] tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Global Opportunity Radar
            </h1>
            <p className="text-[13px] text-[var(--fg-muted)] mt-1.5">
              AI-powered command center across 8 global real estate markets
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="c-pill c-pill-live flex items-center gap-2 px-3 py-1.5 text-[10px]">
              <span className="c-live-dot" />
              <Activity className="h-3 w-3" strokeWidth={1.5} />
              Live Analysis
            </span>
            <button
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold text-[var(--fg-secondary)] transition-all hover:text-[var(--fg)] cursor-pointer"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
              View Opportunities
            </button>
            <button
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold text-[#8B7355] transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ border: '1px solid rgba(139,115,85,0.2)', background: 'rgba(139,115,85,0.07)' }}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Get AI Strategy
            </button>
          </div>
        </div>
        <div className="c-gold-line" />
      </div>

      {/* Quick-stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5 i-fade-in-1">
        {([
          { label: 'Best Buy',       region: bestBuy.region,   value: `+${bestBuy.growth}%`,   sub: 'YoY Growth',        icon: TrendingUp, color: '#4ADE80', flag: REGION_META[bestBuy.region]?.flag  },
          { label: 'Highest Yield',  region: topYield.region,  value: `${topYield.yield}%`,     sub: 'Gross Yield',       icon: Target,     color: '#8B7355', flag: REGION_META[topYield.region]?.flag },
          { label: 'Safest Market',  region: safest.region,    value: 'Low Risk',               sub: 'Stability Score',   icon: Shield,     color: '#A89478', flag: REGION_META[safest.region]?.flag   },
          { label: 'Highest Growth', region: topGrowth.region, value: `+${topGrowth.growth}%`,  sub: 'Price Appreciation',icon: Crown,      color: '#A89478', flag: REGION_META[topGrowth.region]?.flag},
        ] as const).map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="i-card p-4 group cursor-pointer" style={{ borderLeft: `3px solid ${stat.color}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--fg-muted)] font-semibold">
                  {stat.label}
                </p>
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}15` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-xl">{stat.flag}</span>
                <p
                  className="text-[22px] font-semibold text-[var(--fg)] tracking-[-0.02em] leading-none"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {stat.value}
                </p>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">{stat.region} · {stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Live ticker */}
      <div className="mb-7 i-fade-in-1">
        <LiveTicker />
      </div>

      {/* ====================================================
          SECTION 2 — WORLD MAP + KPI STRIP
      ==================================================== */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] mb-8 i-fade-in-2">
        {/* Map */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#8B7355]/10 border border-[#8B7355]/10 flex items-center justify-center">
                <Globe className="h-3 w-3 text-[#8B7355]" strokeWidth={1.5} />
              </div>
              <p className="c-label" style={{ marginBottom: 0 }}>Interactive Market Map</p>
            </div>
            <span className="text-[10px] text-[var(--fg-muted)]">Hover cities for AI insights</span>
          </div>
          <WorldMap onRegionHover={setHoveredRegion} hoveredRegion={hoveredRegion} />
        </div>

        {/* KPI strip */}
        <div className="flex flex-col gap-3.5">
          {([
            { label: 'Global Sentiment', value: 'Bullish',  icon: TrendingUp, sub: 'Composite Index',   color: '#4ADE80' },
            { label: 'Markets Tracked',  value: '8',        icon: Globe,      sub: '50+ cities covered', color: '#8B7355' },
            { label: 'Top Yield City',   value: 'Dubai',    icon: Building2,  sub: '7.2% gross yield',   color: '#8B7355' },
            { label: 'AI Accuracy',      value: '94%',      icon: Zap,        sub: 'Last 12 months',     color: '#8B7355' },
          ] as const).map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="i-card p-4 flex items-center gap-3.5">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold mb-0.5">
                    {stat.label}
                  </p>
                  <p
                    className="text-[18px] font-semibold text-[var(--fg)] tracking-[-0.02em] leading-none"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          SECTION 2B — REGIONAL MARKET CARDS
      ==================================================== */}
      <div className="mb-8 i-fade-in-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-[#8B7355]/10 border border-[#8B7355]/10 flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-[#A89478]" strokeWidth={1.5} />
            </div>
            <p className="c-label" style={{ marginBottom: 0 }}>Regional Markets</p>
          </div>
          <span className="text-[10px] text-[var(--fg-muted)]">{marketTrends.length} regions · Updated 15 min ago</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marketTrends.map((region) => {
            const meta = REGION_META[region.region];
            const demandColor  = getDemandColor(region.demand);
            const demandWidth  = getDemandWidth(region.demand);
            const signalColor  = meta ? getSignalColor(meta.signal)  : '#8B7355';
            const bestForColor = meta ? getBestForColor(meta.bestFor) : '#8B7355';
            const statusColor  = meta ? getStatusColor(meta.status)   : '#8B7355';
            return (
              <div key={region.region} className="i-card p-5 group cursor-pointer">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="i-flag">{meta?.flag}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em] truncate">
                      {region.region}
                    </h3>
                    <p className="text-[9px] text-[var(--fg-muted)]">{meta?.city ?? 'Real Estate Market'}</p>
                  </div>
                  <span
                    className="text-[8.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${statusColor}12`, color: statusColor, border: `1px solid ${statusColor}20` }}
                  >
                    {meta ? getStatusLabel(meta.status) : '—'}
                  </span>
                </div>

                {/* Sparkline */}
                {meta && <MiniSparkline data={meta.sparkline} color={meta.color} />}

                {/* Growth + Yield */}
                <div className="flex items-end justify-between mt-3 mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] mb-0.5">Growth</p>
                    <p
                      className="text-[17px] font-semibold tracking-[-0.02em]"
                      style={{
                        fontFamily: 'var(--font-serif)',
                        color: region.growth >= 10 ? '#4ADE80' : region.growth >= 5 ? '#8B7355' : 'var(--fg-secondary)',
                      }}
                    >
                      +{region.growth}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] mb-0.5">Yield</p>
                    <p
                      className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.02em]"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {region.yield}%
                    </p>
                  </div>
                </div>

                {/* Demand bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)]">Demand</p>
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider"
                      style={{ color: demandColor }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: demandColor }} />
                      {region.demand}
                    </span>
                  </div>
                  <div className={`i-demand-bar i-demand-${region.demand}`}>
                    <div className="i-demand-bar-fill" style={{ width: demandWidth }} />
                  </div>
                </div>

                {/* AI Signal + Best For */}
                <div
                  className="flex items-center justify-between pt-2.5"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" style={{ color: signalColor }} strokeWidth={1.5} />
                    <span className="text-[9px] font-semibold" style={{ color: signalColor }}>
                      AI: {meta?.signal ?? '—'}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${bestForColor}12`, color: bestForColor, border: `1px solid ${bestForColor}20` }}
                  >
                    {meta?.bestFor}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          SECTION 3 — CHARTS ROW
      ==================================================== */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8 i-fade-in-4">
        {/* Global Price Index */}
        <div className="i-chart p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
                <h3
                  className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.01em]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Global Price Index
                </h3>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">Multi-city comparison (base&nbsp;100)</p>
            </div>
            {/* Period filter */}
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
            >
              {(['6M', '1Y', '3Y'] as const).map((period, idx) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className="px-3 py-1.5 text-[10px] font-semibold transition-all cursor-pointer"
                  style={{
                    background: chartPeriod === period ? 'rgba(139,115,85,0.12)' : 'transparent',
                    color:      chartPeriod === period ? '#8B7355' : 'var(--fg-muted)',
                    borderRight: idx < 2 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="var(--border)" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="var(--border)" />
              <Tooltip content={<ChartTooltip />} />
              {Object.entries(CITY_COLORS).map(([city, color]) => (
                <Line
                  key={city}
                  type="monotone"
                  dataKey={city}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {Object.entries(CITY_COLORS).map(([city, color]) => (
              <div key={city} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="text-[10px] text-[var(--fg-muted)]">{city === 'NewYork' ? 'New York' : city}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Yield vs Growth */}
        <div className="i-chart p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
                <h3
                  className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.01em]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Yield vs Growth
                </h3>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">Annual gross yield & price growth by market</p>
            </div>
            <span className="c-pill text-[10px]">
              <Target className="h-3 w-3" strokeWidth={1.5} />
              Comparison
            </span>
          </div>

          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={yieldData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="region" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="var(--border)" tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="yield"  name="Yield %"  fill="#8B7355" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              <Bar dataKey="growth" name="Growth %" fill="#4ADE80" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#8B7355]" />
              <span className="text-[10px] text-[var(--fg-muted)]">Yield %</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#4ADE80]" />
              <span className="text-[10px] text-[var(--fg-muted)]">Growth %</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          SECTION 4A — AI PREDICTIONS
      ==================================================== */}
      <div className="mb-8 i-fade-in-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-[#8B7355]/10 border border-[#8B7355]/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-[#8B7355]" strokeWidth={1.5} />
            </div>
            <p className="c-label" style={{ marginBottom: 0 }}>AI Predictions</p>
          </div>
          <span className="c-pill c-pill-live flex items-center gap-2 px-3 py-1.5 text-[10px]">
            <span className="c-live-dot" />
            Real-time
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {AI_PREDICTIONS.map((pred, i) => {
            const Icon = pred.icon;
            const signalColor = getSignalColor(pred.signal);
            const signalBg    = getSignalBg(pred.signal);
            const riskColor   = getRiskColor(pred.risk);
            return (
              <div key={pred.id} className={`i-card group cursor-pointer i-fade-in-${i + 5}`}>
                <div className={getTypeAccent(pred.signal)} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: signalBg, border: `1px solid ${signalColor}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: signalColor }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: signalBg, color: signalColor, border: `1px solid ${signalColor}20` }}
                        >
                          {pred.signal}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] px-2 py-0.5 text-[9px] text-[var(--fg-secondary)]">
                          <MapPin className="h-2.5 w-2.5" strokeWidth={1.5} />
                          {pred.region}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3
                    className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-2 group-hover:text-[#8B7355] transition-colors duration-300"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {pred.title}
                  </h3>
                  <p className="text-[11px] text-[var(--fg-secondary)] leading-[1.7] mb-4">
                    {pred.summary}
                  </p>

                  {/* Metrics grid */}
                  <div
                    className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-center">
                      <p
                        className="text-[15px] font-semibold"
                        style={{ fontFamily: 'var(--font-serif)', color: '#4ADE80' }}
                      >
                        +{pred.expectedReturn}%
                      </p>
                      <p className="text-[8px] uppercase tracking-wide text-[var(--fg-muted)] mt-0.5">Return</p>
                    </div>
                    <div className="text-center" style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-semibold text-[var(--fg)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        {pred.horizon}
                      </p>
                      <p className="text-[8px] uppercase tracking-wide text-[var(--fg-muted)] mt-0.5">Horizon</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold" style={{ fontFamily: 'var(--font-serif)', color: riskColor }}>
                        {pred.risk}
                      </p>
                      <p className="text-[8px] uppercase tracking-wide text-[var(--fg-muted)] mt-0.5">Risk</p>
                    </div>
                  </div>

                  {/* Catalyst */}
                  <div className="flex items-start gap-2 mb-4 text-[10px] text-[var(--fg-muted)]">
                    <Zap className="h-3 w-3 text-[#8B7355] mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span>Catalyst: {pred.catalyst}</span>
                  </div>

                  {/* Confidence meter */}
                  <div className="mb-4 flex items-center gap-3">
                    <ConfidenceMeter
                      score={pred.confidence}
                      size={56}
                      strokeWidth={5}
                    />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">AI Confidence</p>
                      <p className="text-xs text-[var(--fg-secondary)] mt-0.5">{pred.horizon} horizon</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                      style={{ background: `${signalColor}12`, color: signalColor, border: `1px solid ${signalColor}20` }}
                    >
                      <Bookmark className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Watchlist
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold text-[var(--fg-secondary)] transition-all hover:text-[var(--fg)] cursor-pointer"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Explore Deals
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          SECTION 4B — PERSONALIZED RECS + PORTFOLIO ALLOCATOR
      ==================================================== */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] mb-8 i-fade-in-6">

        {/* Personalized Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-[#A89478]/10 border border-[#A89478]/15 flex items-center justify-center">
                <Star className="h-3 w-3 text-[#A89478]" strokeWidth={1.5} />
              </div>
              <p className="c-label" style={{ marginBottom: 0 }}>Recommended For You</p>
            </div>
            <span className="text-[10px] text-[#A89478]">Based on your portfolio profile</span>
          </div>

          <div className="space-y-3">
            {PERSONAL_RECS.map((rec) => {
              const isSaved    = savedRecs.has(rec.id);
              const regionMeta = REGION_META[rec.region];
              return (
                <div key={rec.id} className="i-card p-4 group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl shrink-0">{regionMeta?.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4
                          className="text-[13px] font-semibold text-[var(--fg)] group-hover:text-[#8B7355] transition-colors truncate"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {rec.title}
                        </h4>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(168,148,120,0.1)', color: '#A89478', border: '1px solid rgba(168,148,120,0.2)' }}
                        >
                          {rec.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--fg-muted)]">
                        {rec.type} · {rec.region} · {rec.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-0.5">
                          <span className="text-[9px] text-[var(--fg-muted)]">Match</span>
                          <span className="text-[13px] font-bold text-[#4ADE80]">{rec.matchScore}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--fg-secondary)]">
                          <span>+{rec.growth}% growth</span>
                          <span className="opacity-30">|</span>
                          <span>{rec.yield}% yield</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSaveRec(rec.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        style={{
                          background: isSaved ? 'rgba(139,115,85,0.1)' : 'var(--bg-secondary)',
                          border: `1px solid ${isSaved ? 'rgba(139,115,85,0.2)' : 'var(--border)'}`,
                        }}
                      >
                        <Bookmark
                          className="h-3.5 w-3.5"
                          style={{ color: isSaved ? '#8B7355' : 'var(--fg-muted)' }}
                          strokeWidth={isSaved ? 2 : 1.5}
                          fill={isSaved ? '#8B7355' : 'none'}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#A89478]" strokeWidth={1.5} />
                    <p className="text-[9px] text-[var(--fg-muted)]">{rec.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Allocation Simulator */}
        <div className="i-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-6 w-6 rounded-md bg-[#A89478]/10 border border-[#A89478]/15 flex items-center justify-center">
              <Layers className="h-3 w-3 text-[#A89478]" strokeWidth={1.5} />
            </div>
            <p className="c-label" style={{ marginBottom: 0 }}>Portfolio Allocator</p>
          </div>

          <div
            className="p-3 rounded-xl mb-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <p className="text-[10px] text-[var(--fg-muted)] mb-1">Total Investment</p>
            <p
              className="text-[22px] font-semibold text-[var(--fg)] tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              ₹5,000,000
            </p>
          </div>

          <div className="space-y-3 mb-4">
            {PORTFOLIO_ALLOC.map((alloc) => (
              <div key={alloc.region}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{alloc.flag}</span>
                    <span className="text-[11px] font-semibold text-[var(--fg)]">{alloc.region}</span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${alloc.color}10`, color: alloc.color, border: `1px solid ${alloc.color}15` }}
                    >
                      {alloc.pct}%
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--fg-secondary)]">
                    ${(5000000 * alloc.pct / 100 / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${alloc.pct}%`, background: alloc.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Blended stats */}
          <div
            className="grid grid-cols-2 gap-3 p-3 rounded-xl mb-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div>
              <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] mb-1">Blended Return</p>
              <p
                className="text-[18px] font-semibold text-[#4ADE80] tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                +{blendedReturn.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] mb-1">Blended Yield</p>
              <p
                className="text-[18px] font-semibold text-[#8B7355] tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {blendedYield.toFixed(1)}%
              </p>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(168,148,120,0.12), rgba(168,148,120,0.06))',
              color: '#A89478',
              border: '1px solid rgba(168,148,120,0.2)',
            }}
          >
            <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
            Simulate Returns
          </button>
        </div>
      </div>

      {/* ====================================================
          TAKE ACTION CTA
      ==================================================== */}
      <div className="i-fade-in-7">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[#C6A86B]" strokeWidth={1.5} />
            <span className="text-[13px] font-semibold text-[var(--fg)]">Act on these insights</span>
          </div>
          <p className="text-[12px] text-[var(--fg-muted)] mb-5">
            Use market intelligence to find, compare and negotiate your next investment.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { href: '/investor',             icon: Search,        color: '#8B7355', bg: 'rgba(139,115,85,0.1)',  label: 'Smart Search',    sub: 'Find properties' },
              { href: '/investor/areas',        icon: MapPin,        color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', label: 'Recommendations', sub: 'AI-ranked areas' },
              { href: '/investor/ai-deals',     icon: Bookmark,      color: '#C6A86B', bg: 'rgba(198,168,107,0.1)',label: 'Saved Deals',     sub: 'Shortlisted assets' },
              { href: '/investor/negotiations', icon: MessageSquare, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Negotiations',     sub: 'Active deal talks' },
              { href: '/investor/portfolio',    icon: Briefcase,     color: '#8B7355', bg: 'rgba(139,115,85,0.1)', label: 'Portfolio',        sub: 'Track investments' },
            ].map(({ href, icon: Icon, color, bg, label, sub }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-3 text-left transition-all cursor-pointer group hover:shadow-sm"
                onMouseEnter={e => { (e.currentTarget.style.borderColor = `${color}40`); (e.currentTarget.style.background = `${color}06`); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: bg }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--fg)] transition-colors truncate">{label}</p>
                  <p className="text-[9px] text-[var(--fg-muted)] truncate">{sub}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-[var(--fg-muted)] ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}
      <div className="i-fade-in-7">
        <div className="c-gold-line mb-5" />
        <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.03em] text-center pb-4">
          Data refreshed every 15 minutes · Powered by GLIMMORA Intelligence Engine v3.2 · AI predictions are not financial advice
        </p>
      </div>
    </div>
  );
}
