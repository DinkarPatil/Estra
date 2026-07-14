'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, MapPin, Search, Download, Flame, Users, DollarSign,
  BarChart2, RefreshCw, CheckCircle2, Star, Building2, Globe,
  X, ChevronRight, List, LayoutGrid, Activity, Zap, AlertCircle,
  ArrowUpRight, Award, Target, Clock, Eye,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

// ─── Types & Data ─────────────────────────────────────────────────────────────
interface Market {
  id: number; city: string; country: string; region: string;
  score: number; leads: number; avgValue: number; currency: string;
  trend: string; trendNum: number; type: string;
  competition: 'Low' | 'Medium' | 'High';
  mapX: number; mapY: number; // % position on world map
  monthlyLeads: number[];
  priceBands: { band: string; demand: number }[];
  buyerTypes: { name: string; pct: number }[];
  topCategories: { cat: string; score: number; change: string }[];
}

const MARKETS: Market[] = [
  {
    id: 1, city: 'Dubai', country: 'UAE', region: 'Middle East', score: 98, leads: 312,
    avgValue: 8200000, currency: 'AED', trend: '+24%', trendNum: 24, type: 'Luxury',
    competition: 'High', mapX: 58.5, mapY: 44,
    monthlyLeads: [220, 238, 254, 268, 290, 312],
    priceBands: [{ band: '<5M', demand: 42 }, { band: '5–15M', demand: 88 }, { band: '15–30M', demand: 75 }, { band: '>30M', demand: 58 }],
    buyerTypes: [{ name: 'Investor', pct: 48 }, { name: 'End-user', pct: 32 }, { name: 'Developer', pct: 20 }],
    topCategories: [{ cat: 'Waterfront Villa', score: 96, change: '+12%' }, { cat: 'Downtown Penthouse', score: 91, change: '+8%' }, { cat: 'Marina Apt', score: 84, change: '+5%' }],
  },
  {
    id: 2, city: 'London', country: 'UK', region: 'Europe', score: 91, leads: 248,
    avgValue: 4500000, currency: 'GBP', trend: '+11%', trendNum: 11, type: 'Residential',
    competition: 'High', mapX: 46.5, mapY: 27,
    monthlyLeads: [192, 205, 214, 228, 238, 248],
    priceBands: [{ band: '<2M', demand: 68 }, { band: '2–5M', demand: 91 }, { band: '5–10M', demand: 72 }, { band: '>10M', demand: 44 }],
    buyerTypes: [{ name: 'End-user', pct: 55 }, { name: 'Investor', pct: 35 }, { name: 'Corporate', pct: 10 }],
    topCategories: [{ cat: 'Mayfair Townhouse', score: 94, change: '+9%' }, { cat: 'City Office', score: 88, change: '+4%' }, { cat: 'Chelsea Flat', score: 81, change: '+7%' }],
  },
  {
    id: 3, city: 'Mumbai', country: 'India', region: 'South Asia', score: 85, leads: 204,
    avgValue: 35000000, currency: 'INR', trend: '+18%', trendNum: 18, type: 'Mixed',
    competition: 'Medium', mapX: 63, mapY: 50,
    monthlyLeads: [148, 162, 174, 185, 194, 204],
    priceBands: [{ band: '<15M', demand: 55 }, { band: '15–50M', demand: 85 }, { band: '50–100M', demand: 62 }, { band: '>100M', demand: 38 }],
    buyerTypes: [{ name: 'End-user', pct: 60 }, { name: 'Investor', pct: 30 }, { name: 'NRI', pct: 10 }],
    topCategories: [{ cat: 'Sea View Flat', score: 90, change: '+14%' }, { cat: 'Luxury Villa', score: 84, change: '+11%' }, { cat: 'Commercial', score: 72, change: '+6%' }],
  },
  {
    id: 4, city: 'Singapore', country: 'Singapore', region: 'Southeast Asia', score: 82, leads: 189,
    avgValue: 5200000, currency: 'SGD', trend: '+9%', trendNum: 9, type: 'Luxury',
    competition: 'Medium', mapX: 73.5, mapY: 56,
    monthlyLeads: [148, 158, 165, 174, 182, 189],
    priceBands: [{ band: '<3M', demand: 48 }, { band: '3–8M', demand: 82 }, { band: '8–15M', demand: 70 }, { band: '>15M', demand: 45 }],
    buyerTypes: [{ name: 'Investor', pct: 52 }, { name: 'End-user', pct: 38 }, { name: 'Corporate', pct: 10 }],
    topCategories: [{ cat: 'Marina Penthouse', score: 88, change: '+7%' }, { cat: 'CBD Office', score: 80, change: '+5%' }, { cat: 'Orchard Apt', score: 74, change: '+3%' }],
  },
  {
    id: 5, city: 'Monaco', country: 'Monaco', region: 'Europe', score: 79, leads: 142,
    avgValue: 14000000, currency: 'EUR', trend: '+31%', trendNum: 31, type: 'Ultra-Luxury',
    competition: 'Low', mapX: 49.5, mapY: 32,
    monthlyLeads: [88, 98, 108, 120, 132, 142],
    priceBands: [{ band: '<8M', demand: 38 }, { band: '8–20M', demand: 79 }, { band: '20–50M', demand: 65 }, { band: '>50M', demand: 52 }],
    buyerTypes: [{ name: 'UHNW', pct: 68 }, { name: 'Investor', pct: 22 }, { name: 'End-user', pct: 10 }],
    topCategories: [{ cat: 'Waterfront Penthouse', score: 92, change: '+28%' }, { cat: 'Private Villa', score: 85, change: '+22%' }, { cat: 'Yacht Berth', score: 71, change: '+15%' }],
  },
  {
    id: 6, city: 'Geneva', country: 'Switzerland', region: 'Europe', score: 74, leads: 128,
    avgValue: 8900000, currency: 'CHF', trend: '+6%', trendNum: 6, type: 'Residential',
    competition: 'Low', mapX: 49.8, mapY: 30,
    monthlyLeads: [108, 112, 116, 120, 124, 128],
    priceBands: [{ band: '<5M', demand: 42 }, { band: '5–12M', demand: 74 }, { band: '12–25M', demand: 58 }, { band: '>25M', demand: 30 }],
    buyerTypes: [{ name: 'HNW', pct: 54 }, { name: 'Expat', pct: 28 }, { name: 'Investor', pct: 18 }],
    topCategories: [{ cat: 'Lakeside Chalet', score: 88, change: '+5%' }, { cat: 'City Apt', score: 72, change: '+4%' }, { cat: 'Mountain Villa', score: 64, change: '+2%' }],
  },
  {
    id: 7, city: 'New York', country: 'USA', region: 'North America', score: 72, leads: 116,
    avgValue: 3800000, currency: 'USD', trend: '+4%', trendNum: 4, type: 'Commercial',
    competition: 'High', mapX: 23.5, mapY: 34,
    monthlyLeads: [100, 104, 108, 110, 113, 116],
    priceBands: [{ band: '<2M', demand: 62 }, { band: '2–5M', demand: 72 }, { band: '5–10M', demand: 58 }, { band: '>10M', demand: 38 }],
    buyerTypes: [{ name: 'Corporate', pct: 44 }, { name: 'Investor', pct: 36 }, { name: 'End-user', pct: 20 }],
    topCategories: [{ cat: 'Midtown Office', score: 82, change: '+4%' }, { cat: 'Manhattan Apt', score: 72, change: '+3%' }, { cat: 'Brooklyn Loft', score: 64, change: '+2%' }],
  },
  {
    id: 8, city: 'Tokyo', country: 'Japan', region: 'East Asia', score: 68, leads: 104,
    avgValue: 300000000, currency: 'JPY', trend: '+14%', trendNum: 14, type: 'Mixed',
    competition: 'Medium', mapX: 80.5, mapY: 38,
    monthlyLeads: [80, 86, 90, 95, 100, 104],
    priceBands: [{ band: '<100M', demand: 58 }, { band: '100–300M', demand: 68 }, { band: '300–600M', demand: 52 }, { band: '>600M', demand: 34 }],
    buyerTypes: [{ name: 'Investor', pct: 48 }, { name: 'End-user', pct: 38 }, { name: 'Foreign', pct: 14 }],
    topCategories: [{ cat: 'Shinjuku Tower', score: 78, change: '+12%' }, { cat: 'Minato Villa', score: 70, change: '+9%' }, { cat: 'Shibuya Apt', score: 60, change: '+6%' }],
  },
  {
    id: 9, city: 'Stockholm', country: 'Sweden', region: 'Europe', score: 63, leads: 97,
    avgValue: 6200000, currency: 'SEK', trend: '+8%', trendNum: 8, type: 'Residential',
    competition: 'Low', mapX: 51.5, mapY: 20,
    monthlyLeads: [76, 80, 84, 88, 93, 97],
    priceBands: [{ band: '<3M', demand: 52 }, { band: '3–8M', demand: 63 }, { band: '8–15M', demand: 48 }, { band: '>15M', demand: 28 }],
    buyerTypes: [{ name: 'End-user', pct: 62 }, { name: 'Investor', pct: 28 }, { name: 'Corporate', pct: 10 }],
    topCategories: [{ cat: 'Waterfront Villa', score: 74, change: '+8%' }, { cat: 'City Apt', score: 63, change: '+6%' }, { cat: 'Summer House', score: 54, change: '+4%' }],
  },
  {
    id: 10, city: 'Doha', country: 'Qatar', region: 'Middle East', score: 61, leads: 88,
    avgValue: 9500000, currency: 'QAR', trend: '+22%', trendNum: 22, type: 'Luxury',
    competition: 'Low', mapX: 57.5, mapY: 46,
    monthlyLeads: [58, 64, 70, 76, 82, 88],
    priceBands: [{ band: '<5M', demand: 44 }, { band: '5–15M', demand: 61 }, { band: '15–30M', demand: 48 }, { band: '>30M', demand: 32 }],
    buyerTypes: [{ name: 'Investor', pct: 58 }, { name: 'End-user', pct: 32 }, { name: 'Corporate', pct: 10 }],
    topCategories: [{ cat: 'Pearl Residence', score: 78, change: '+20%' }, { cat: 'Lusail Tower', score: 68, change: '+15%' }, { cat: 'West Bay Apt', score: 56, change: '+10%' }],
  },
  {
    id: 11, city: 'Milan', country: 'Italy', region: 'Europe', score: 57, leads: 79,
    avgValue: 4200000, currency: 'EUR', trend: '+3%', trendNum: 3, type: 'Commercial',
    competition: 'Medium', mapX: 50.5, mapY: 33,
    monthlyLeads: [68, 70, 72, 74, 76, 79],
    priceBands: [{ band: '<2M', demand: 56 }, { band: '2–6M', demand: 57 }, { band: '6–12M', demand: 42 }, { band: '>12M', demand: 24 }],
    buyerTypes: [{ name: 'End-user', pct: 50 }, { name: 'Corporate', pct: 30 }, { name: 'Investor', pct: 20 }],
    topCategories: [{ cat: 'Fashion District', score: 68, change: '+3%' }, { cat: 'City Office', score: 57, change: '+2%' }, { cat: 'Brera Apt', score: 50, change: '+1%' }],
  },
  {
    id: 12, city: 'Marbella', country: 'Spain', region: 'Europe', score: 54, leads: 71,
    avgValue: 7800000, currency: 'EUR', trend: '+17%', trendNum: 17, type: 'Villa',
    competition: 'Low', mapX: 45.5, mapY: 36,
    monthlyLeads: [48, 54, 58, 62, 66, 71],
    priceBands: [{ band: '<3M', demand: 44 }, { band: '3–10M', demand: 54 }, { band: '10–20M', demand: 40 }, { band: '>20M', demand: 26 }],
    buyerTypes: [{ name: 'HNW', pct: 48 }, { name: 'End-user', pct: 34 }, { name: 'Investor', pct: 18 }],
    topCategories: [{ cat: 'Golf Villa', score: 68, change: '+16%' }, { cat: 'Beach Apt', score: 54, change: '+12%' }, { cat: 'Mountain House', score: 44, change: '+8%' }],
  },
];

const MONTHLY_VOL = [
  { month: 'Nov', leads: 1028, prev: 842 }, { month: 'Dec', leads: 1142, prev: 958 },
  { month: 'Jan', leads: 1268, prev: 1048 }, { month: 'Feb', leads: 1154, prev: 982 },
  { month: 'Mar', leads: 1489, prev: 1148 }, { month: 'Apr', leads: 1711, prev: 1282 },
];

const REGION_DATA = [
  { region: 'Middle East', score: 80, leads: 400, color: '#ef4444' },
  { region: 'Europe', score: 72, leads: 765, color: '#f59e0b' },
  { region: 'South Asia', score: 85, leads: 204, color: '#f97316' },
  { region: 'SE Asia', score: 82, leads: 189, color: '#10b981' },
  { region: 'East Asia', score: 68, leads: 104, color: '#8B7355' },
  { region: 'N. America', score: 72, leads: 116, color: '#8B7355' },
];

const SEARCH_INTENT = [
  { week: 'W1', luxury: 420, residential: 680, commercial: 310 },
  { week: 'W2', luxury: 480, residential: 720, commercial: 340 },
  { week: 'W3', luxury: 510, residential: 695, commercial: 290 },
  { week: 'W4', luxury: 560, residential: 740, commercial: 380 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function heatCfg(score: number) {
  if (score >= 90) return { ring: '#ef4444', glow: 'rgba(239,68,68,0.4)', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Hot' };
  if (score >= 75) return { ring: '#f97316', glow: 'rgba(249,115,22,0.4)', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: 'High' };
  if (score >= 60) return { ring: '#f59e0b', glow: 'rgba(245,158,11,0.35)', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Medium' };
  return { ring: '#8B7355', glow: 'rgba(139,115,85,0.35)', badge: 'bg-stone-50 text-stone-700 border-stone-200', dot: 'bg-stone-400', label: 'Growing' };
}
function fmtVal(v: number, _cur: string) {
  void _cur;  // mock data tags heterogeneous currencies; UI is INR-only
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)} Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 text-white text-[11px] px-3 py-2 rounded-xl shadow-xl">
      <p className="text-stone-400 mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || '#fff' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ value }: { value: number }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    const dur = 900, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setD(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{d.toLocaleString()}</>;
}

// ─── World Map Component ───────────────────────────────────────────────────────
function WorldMap({ markets, selected, onSelect }: {
  markets: Market[]; selected: Market | null; onSelect: (m: Market) => void;
}) {
  const [hovered, setHovered] = useState<Market | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden ring-1 ring-stone-700/40" style={{ height: 370, background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #0d2248 0%, #091a38 45%, #060f1e 100%)' }}>

      {/* Latitude / longitude grid */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {[15, 30, 45, 60, 75].map((pct) => (
          <line key={`h${pct}`} x1="0" y1={`${pct}%`} x2="100%" y2={`${pct}%`} stroke="#1e3a5f" strokeWidth="0.6" strokeDasharray="3,6" />
        ))}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => (
          <line key={`v${pct}`} x1={`${pct}%`} y1="0" x2={`${pct}%`} y2="100%" stroke="#1e3a5f" strokeWidth="0.6" strokeDasharray="3,6" />
        ))}
        {/* Equator */}
        <line x1="0" y1="58%" x2="100%" y2="58%" stroke="#1e4060" strokeWidth="0.8" strokeDasharray="6,4" />
        {/* Tropics */}
        <line x1="0" y1="44%" x2="100%" y2="44%" stroke="#152d48" strokeWidth="0.5" strokeDasharray="2,8" />
        <line x1="0" y1="72%" x2="100%" y2="72%" stroke="#152d48" strokeWidth="0.5" strokeDasharray="2,8" />
      </svg>

      {/* Realistic continent shapes */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3f6e" />
            <stop offset="100%" stopColor="#152e52" />
          </linearGradient>
        </defs>
        <g fill="url(#landGrad)" stroke="#2a4a70" strokeWidth="0.7" opacity="0.92">

          {/* ── North America ── */}
          <path d="M 78,60 Q 128,46 180,53 Q 226,60 260,80
                   Q 288,98 300,126 Q 309,154 297,180
                   Q 285,204 265,220 Q 257,233 252,248
                   Q 247,263 238,272 Q 228,280 216,279
                   Q 204,277 196,266 Q 190,254 194,241
                   Q 186,232 172,228 Q 158,223 148,213
                   Q 138,202 138,188 Q 139,172 148,162
                   Q 132,176 115,171 Q 98,165 95,151
                   Q 92,136 102,124 Q 113,113 126,106
                   Q 110,92 96,80 Q 81,70 78,60 Z" />
          {/* Alaska peninsula */}
          <path d="M 78,60 Q 86,52 99,51 Q 89,62 86,76
                   Q 69,69 53,70 Q 62,62 78,60 Z" />
          {/* Baja California hint */}
          <path d="M 138,188 Q 133,202 136,216 Q 138,226 132,229
                   Q 127,226 128,217 Q 130,206 134,196 Z" />

          {/* ── South America ── */}
          <path d="M 212,276 Q 240,261 266,267 Q 291,273 304,295
                   Q 316,317 316,345 Q 316,373 305,397
                   Q 293,421 273,434 Q 252,447 231,447
                   Q 210,445 195,431 Q 180,416 176,396
                   Q 172,375 181,354 Q 191,333 200,312
                   Q 209,291 212,276 Z" />

          {/* ── Europe (main body) ── */}
          <path d="M 436,68 Q 465,53 496,56 Q 527,59 543,80
                   Q 557,100 550,124 Q 542,148 520,160
                   Q 498,172 474,167 Q 450,162 439,146
                   Q 428,129 432,110 Z" />
          {/* Scandinavian peninsula */}
          <path d="M 487,57 Q 500,43 516,40 Q 530,38 540,50
                   Q 547,62 537,72 Q 525,81 512,77
                   Q 499,72 492,62 Z" />
          {/* Iberian peninsula */}
          <path d="M 433,112 Q 430,126 431,140 Q 432,154 438,163
                   Q 430,157 427,144 Q 424,130 428,116 Z" />
          {/* Italian peninsula */}
          <path d="M 476,140 Q 480,150 478,162 Q 476,172 470,176
                   Q 463,173 461,164 Q 460,154 465,146 Z" />
          {/* British Isles */}
          <path d="M 443,70 Q 452,62 461,64 Q 469,67 469,76
                   Q 469,85 461,89 Q 452,92 445,86
                   Q 438,79 443,70 Z" />

          {/* ── Africa ── */}
          <path d="M 449,161 Q 486,151 522,158 Q 555,165 569,186
                   Q 582,207 580,233 Q 578,260 566,284
                   Q 552,308 533,325 Q 514,342 494,349
                   Q 473,355 453,348 Q 432,340 421,323
                   Q 409,305 411,283 Q 413,260 424,239
                   Q 435,218 439,196 Q 442,174 449,163 Z" />
          {/* Horn of Africa */}
          <path d="M 559,212 Q 577,205 593,211 Q 602,218 598,229
                   Q 594,239 579,240 Q 565,240 559,229 Z" />
          {/* Madagascar */}
          <path d="M 590,282 Q 596,275 602,278 Q 607,285 604,295
                   Q 600,304 593,302 Q 587,297 589,288 Z" />

          {/* ── Arabian Peninsula ── */}
          <path d="M 548,178 Q 569,168 591,173 Q 612,178 621,199
                   Q 629,219 620,239 Q 611,258 593,263
                   Q 575,267 562,257 Q 548,246 547,228
                   Q 545,209 548,191 Z" />

          {/* ── Asia main body ── */}
          <path d="M 548,62 Q 601,47 657,49 Q 713,51 762,64
                   Q 806,77 832,99 Q 856,120 855,147
                   Q 854,173 833,188 Q 811,202 782,206
                   Q 751,210 720,204 Q 688,197 660,183
                   Q 629,168 604,148 Q 578,127 561,103
                   Q 548,83 548,62 Z" />
          {/* Indian subcontinent */}
          <path d="M 617,177 Q 643,177 660,196 Q 675,215 671,240
                   Q 666,264 648,276 Q 630,287 613,281
                   Q 595,275 587,258 Q 580,241 585,222
                   Q 590,203 603,192 Z" />
          {/* Indochina / SE Asia peninsula */}
          <path d="M 713,198 Q 738,195 754,212 Q 768,228 763,247
                   Q 758,264 741,269 Q 724,273 712,261
                   Q 701,249 703,233 Q 705,216 713,206 Z" />
          {/* Korean peninsula */}
          <path d="M 782,142 Q 793,136 803,142 Q 810,149 807,159
                   Q 804,168 795,170 Q 785,169 781,161
                   Q 777,152 782,145 Z" />
          {/* Japan (elongated) */}
          <path d="M 806,106 Q 821,100 835,110 Q 846,120 845,136
                   Q 844,152 832,161 Q 820,169 808,163
                   Q 796,157 793,144 Q 790,130 797,119 Z" />
          {/* Taiwan */}
          <path d="M 776,190 Q 780,186 785,188 Q 789,192 787,198
                   Q 784,202 779,200 Q 774,196 776,190 Z" />

          {/* ── Australia ── */}
          <path d="M 733,278 Q 765,267 798,268 Q 831,269 855,287
                   Q 877,305 877,331 Q 876,358 858,374
                   Q 839,390 813,391 Q 787,392 764,381
                   Q 741,369 732,351 Q 723,332 726,312
                   Q 730,292 733,278 Z" />
          {/* Tasmania */}
          <path d="M 818,391 Q 828,388 836,395 Q 841,403 836,410
                   Q 831,415 823,413 Q 815,409 815,402
                   Q 815,395 818,391 Z" />

          {/* ── Greenland ── */}
          <path d="M 283,25 Q 308,13 336,17 Q 361,21 369,42
                   Q 376,62 358,76 Q 339,90 314,85
                   Q 289,79 283,59 Z" />

          {/* Iceland */}
          <path d="M 408,50 Q 416,44 424,47 Q 430,51 429,59
                   Q 427,66 419,68 Q 411,67 408,61 Z" />

          {/* New Zealand (hint) */}
          <path d="M 906,340 Q 911,334 917,337 Q 921,342 919,350
                   Q 915,355 909,353 Q 905,347 906,340 Z" />
        </g>
      </svg>

      {/* Equator label */}
      <div className="absolute text-[9px] text-stone-600/60 font-medium" style={{ top: 'calc(58% - 1px)', left: 6, transform: 'translateY(-100%)' }}>EQ</div>

      {/* Market markers */}
      {markets.map((m) => {
        const cfg = heatCfg(m.score);
        const isSelected = selected?.id === m.id;
        const isHovered = hovered?.id === m.id;
        return (
          <div
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ left: `${m.mapX}%`, top: `${m.mapY}%` }}
            onClick={() => onSelect(m)}
            onMouseEnter={(e) => {
              setHovered(m);
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) setTooltipPos({ x: (m.mapX / 100) * rect.width, y: (m.mapY / 100) * rect.height });
            }}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Pulse ring */}
            {m.score >= 75 && (
              <motion.div
                className="absolute -inset-2 rounded-full"
                style={{ background: cfg.glow }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            {/* Dot */}
            <motion.div
              className={`relative rounded-full flex items-center justify-center text-white font-bold transition-all`}
              style={{
                width: isSelected ? 36 : isHovered ? 30 : 22,
                height: isSelected ? 36 : isHovered ? 30 : 22,
                background: cfg.ring,
                boxShadow: `0 0 ${isSelected ? 20 : 10}px ${cfg.glow}`,
                fontSize: isSelected ? 10 : 8,
                zIndex: isSelected ? 20 : 10,
              }}
              animate={{ scale: isSelected ? 1.15 : 1 }}
            >
              {m.score}
            </motion.div>
          </div>
        );
      })}

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && !selected && (
          <motion.div
            className="absolute z-30 pointer-events-none bg-stone-900/95 border border-stone-700 rounded-xl p-3 shadow-2xl min-w-[160px]"
            style={{
              left: Math.min(tooltipPos.x + 12, (containerRef.current?.offsetWidth ?? 800) - 180),
              top: Math.max(tooltipPos.y - 80, 8),
            }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          >
            <p className="text-white text-xs font-bold mb-1">{hovered.city}, {hovered.country}</p>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between"><span className="text-stone-400">Score</span><span className="text-white font-bold">{hovered.score}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Leads</span><span className="text-white font-bold">{hovered.leads}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Avg Value</span><span className="text-white font-bold">{fmtVal(hovered.avgValue, hovered.currency)} {hovered.currency}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Trend</span><span className="text-emerald-400 font-bold">{hovered.trend}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-3 left-4 flex items-center gap-3">
        {[
          { label: 'Hot 90+', color: '#ef4444' }, { label: 'High 75+', color: '#f97316' },
          { label: 'Med 60+', color: '#f59e0b' }, { label: 'Growing', color: '#8B7355' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px] text-stone-400">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div className="absolute top-3 right-4 flex items-center gap-1.5">
        <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        <span className="text-[10px] text-stone-400 font-medium">Live</span>
      </div>
    </div>
  );
}

// ─── Market Drawer ────────────────────────────────────────────────────────────
function MarketDrawer({ market, onClose }: { market: Market | null; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'trend' | 'buyers' | 'pricing' | 'opps'>('overview');
  if (!market) return null;
  const cfg = heatCfg(market.score);
  const trendData = market.monthlyLeads.map((v, i) => ({ month: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i], leads: v }));

  return (
    <AnimatePresence>
      {market && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ x: 430 }} animate={{ x: 0 }} exit={{ x: 430 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
            {/* Hero */}
            <div className="bg-[#0b1628] p-5 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: cfg.ring, boxShadow: `0 0 16px ${cfg.glow}` }}>
                    {market.score}
                  </div>
                  <div>
                    <h2 className="text-base font-bold">{market.city}</h2>
                    <p className="text-xs text-stone-400">{market.country} · {market.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Active Leads', value: market.leads },
                  { label: 'Avg Value', value: fmtVal(market.avgValue, market.currency) },
                  { label: 'Trend', value: market.trend },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
                    <div className="text-sm font-bold text-white">{s.value}</div>
                    <div className="text-[10px] text-stone-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-100 px-4 overflow-x-auto">
              {([
                { k: 'overview', l: 'Overview' }, { k: 'trend', l: 'Trend' },
                { k: 'buyers', l: 'Buyers' }, { k: 'pricing', l: 'Pricing' },
                { k: 'opps', l: 'Opportunities' },
              ] as const).map(({ k, l }) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`py-3 px-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${tab === k ? 'border-stone-600 text-stone-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Type', value: market.type, icon: Building2 },
                      { label: 'Competition', value: market.competition, icon: Target },
                      { label: 'Region', value: market.region, icon: Globe },
                      { label: 'Demand', value: `${market.score}/100`, icon: BarChart2 },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-stone-50 border border-stone-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3 h-3 text-stone-400" />
                          <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">{label}</span>
                        </div>
                        <p className="text-sm font-bold text-stone-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-stone-100 p-4">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-2">Suggested Action</h4>
                    <p className="text-xs text-stone-700">
                      {market.score >= 90 ? 'High priority — allocate more broker resources and boost listings in this market immediately.' :
                        market.score >= 75 ? 'Strong market — increase outreach cadence and list premium properties.' :
                          market.score >= 60 ? 'Growing market — monitor closely and start building local network.' :
                            'Emerging opportunity — gather intelligence before committing resources.'}
                    </p>
                  </div>
                </>
              )}
              {tab === 'trend' && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-700 mb-3">Lead Volume — 6 Months</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="drawerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B7355" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="leads" name="Leads" stroke="#8B7355" strokeWidth={2.5} fill="url(#drawerGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-800">+{market.trendNum}% growth this month</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">{market.leads} leads tracking this market</p>
                  </div>
                </div>
              )}
              {tab === 'buyers' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-stone-700">Buyer Type Breakdown</h4>
                  {market.buyerTypes.map((b) => (
                    <div key={b.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">{b.name}</span>
                        <span className="font-bold text-stone-800">{b.pct}%</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-stone-500 to-stone-500"
                          initial={{ width: 0 }} animate={{ width: `${b.pct}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'pricing' && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-700 mb-3">Demand by Price Band</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={market.priceBands} barSize={26}>
                      <XAxis dataKey="band" tick={{ fontSize: 10, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="demand" name="Demand" radius={[4, 4, 0, 0]} fill="url(#pricingGrad)" />
                      <defs><linearGradient id="pricingGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {tab === 'opps' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-stone-700 mb-2">Top Property Categories</h4>
                  {market.topCategories.map((cat, i) => (
                    <div key={cat.cat} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors">
                      <span className="w-6 h-6 rounded-full bg-stone-100 text-[10px] font-bold text-stone-500 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800">{cat.cat}</p>
                        <div className="h-1 bg-stone-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-stone-500 to-stone-500" style={{ width: `${cat.score}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{cat.change}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 p-4 flex gap-2">
              <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Eye className="w-4 h-4" /> View Listings
              </button>
              <button className="flex-1 h-9 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 flex items-center justify-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DemandHeatmapPage() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [viewMode, setViewMode] = useState<'table' | 'analytics'>('table');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState('2 mins ago');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const filtered = useMemo(() => {
    let list = [...MARKETS];
    if (search) { const q = search.toLowerCase(); list = list.filter((m) => m.city.toLowerCase().includes(q) || m.region.toLowerCase().includes(q)); }
    if (regionFilter !== 'All') list = list.filter((m) => m.region === regionFilter);
    if (typeFilter !== 'All') list = list.filter((m) => m.type === typeFilter);
    if (sortBy === 'leads') list.sort((a, b) => b.leads - a.leads);
    else if (sortBy === 'trend') list.sort((a, b) => b.trendNum - a.trendNum);
    else list.sort((a, b) => b.score - a.score);
    return list;
  }, [search, regionFilter, typeFilter, sortBy]);

  const kpis = useMemo(() => ({
    totalLeads: MARKETS.reduce((s, m) => s + m.leads, 0),
    hotMarkets: MARKETS.filter((m) => m.score >= 75).length,
    topCity: MARKETS.reduce((a, b) => a.score > b.score ? a : b).city,
    avgScore: Math.round(MARKETS.reduce((s, m) => s + m.score, 0) / MARKETS.length),
  }), []);

  const regions = useMemo(() => Array.from(new Set(MARKETS.map((m) => m.region))), []);
  const types = useMemo(() => Array.from(new Set(MARKETS.map((m) => m.type))), []);

  return (
    <div className="min-h-screen bg-[#F9F7F4] p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-[100] bg-white border border-stone-200 text-stone-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <MarketDrawer market={selectedMarket} onClose={() => setSelectedMarket(null)} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/broker/analytics" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">Analytics</a>
            <span className="text-stone-300">/</span>
            <span className="text-sm text-stone-700 font-medium">Broker Demand Heatmap</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Demand Heatmap</h1>
          <p className="text-sm text-stone-500 mt-0.5">Real-time buyer demand signals across global markets</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {[
              { label: `${kpis.totalLeads.toLocaleString()} Active Leads`, bg: 'bg-stone-50 text-stone-700 border-stone-200' },
              { label: `${MARKETS.length} Markets Tracked`, bg: 'bg-stone-50 text-stone-700 border-stone-200' },
              { label: `${kpis.topCity} #1 Market`, bg: 'bg-red-50 text-red-600 border-red-200' },
            ].map((chip) => (
              <span key={chip.label} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${chip.bg}`}>{chip.label}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-emerald-200 bg-emerald-50">
            <motion.span className="w-2 h-2 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-[11px] font-semibold text-emerald-700">Live · {lastRefresh}</span>
          </div>
          <button onClick={() => { showToast('Refreshing market data…'); setLastRefresh('Just now'); }}
            className="h-9 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => showToast('Exporting report…')}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'TOTAL ACTIVE LEADS', value: kpis.totalLeads, display: kpis.totalLeads.toLocaleString(), change: '+18%', icon: Users, iconBg: 'bg-stone-100', iconColor: 'text-stone-600', accent: 'linear-gradient(90deg,#6F5C46,#8B7355)' },
          { label: 'HOT MARKETS', value: kpis.hotMarkets, display: String(kpis.hotMarkets), change: '+3 this month', icon: Flame, iconBg: 'bg-red-100', iconColor: 'text-red-500', accent: 'linear-gradient(90deg,#b91c1c,#ef4444)' },
          { label: 'TOP MARKET', value: 0, display: 'Dubai', change: '98 score', icon: Star, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', accent: 'linear-gradient(90deg,#b45309,#f59e0b)' },
          { label: 'AVG DEMAND SCORE', value: kpis.avgScore, display: String(kpis.avgScore), change: '+6 pts', icon: BarChart2, iconBg: 'bg-stone-100', iconColor: 'text-stone-600', accent: 'linear-gradient(90deg,#6F5C46,#8B7355)' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label}
            className="bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="h-[3px]" style={{ background: kpi.accent }} />
            <div className="p-3.5 flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">{kpi.label}</p>
                <p className="text-xl font-bold text-stone-900 leading-none mb-1">
                  {kpi.value > 0 ? <Counter value={kpi.value} /> : kpi.display}
                </p>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-2.5 h-2.5" />{kpi.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-4">

          {/* World Map */}
          <WorldMap markets={MARKETS} selected={selectedMarket} onSelect={(m) => setSelectedMarket(m === selectedMarket ? null : m)} />

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="text" placeholder="Search city or region…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400" />
              </div>
              <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer">
                <option value="All">All Regions</option>{regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer">
                <option value="All">All Types</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer">
                <option value="score">Score</option><option value="leads">Leads</option><option value="trend">Trend</option>
              </select>
              {(search || regionFilter !== 'All' || typeFilter !== 'All') && (
                <button onClick={() => { setSearch(''); setRegionFilter('All'); setTypeFilter('All'); }}
                  className="h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-sm hover:bg-stone-100 flex items-center gap-1.5 transition-colors">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <div className="ml-auto flex items-center bg-stone-100 rounded-xl p-1 gap-0.5">
                {([{ v: 'table', icon: List }, { v: 'analytics', icon: BarChart2 }] as const).map(({ v, icon: Icon }) => (
                  <button key={v} onClick={() => setViewMode(v as any)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === v ? 'bg-white shadow-sm text-stone-600' : 'text-stone-400 hover:text-stone-600'}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Rankings Table */}
            {viewMode === 'table' && (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-white to-stone-50/60">
                  <div>
                    <h3 className="text-sm font-bold text-stone-800">Market Rankings</h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">{filtered.length} markets · sorted by {sortBy}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-stone-500">
                    {[
                      { label: 'Hot 90+', color: '#ef4444' }, { label: 'High 75+', color: '#f97316' },
                      { label: 'Medium 60+', color: '#f59e0b' }, { label: 'Growing', color: '#8B7355' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr_0.9fr_0.9fr] gap-3 px-5 py-2.5 bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                  <span>Market</span><span>Score</span><span>Leads</span><span>Avg Value</span><span>Type</span><span>Trend</span><span>Region</span>
                </div>
                {filtered.map((m, i) => {
                  const cfg = heatCfg(m.score);
                  const rankBg =
                    i === 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' :
                    i === 1 ? 'linear-gradient(135deg,#9A8B7E,#7A6B5E)' :
                    i === 2 ? 'linear-gradient(135deg,#b87333,#92400e)' :
                    i < 7   ? '#f97316' : cfg.ring;
                  const trendStrong = m.trendNum >= 20;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`grid grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr_0.9fr_0.9fr] gap-3 items-center px-5 py-3.5 border-b border-stone-50 cursor-pointer transition-all group hover:bg-stone-50/30 hover:shadow-[inset_0_0_0_1px_rgba(139,115,85,0.08)] ${i % 2 === 0 ? '' : 'bg-stone-50/40'}`}
                      onClick={() => setSelectedMarket(m)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm" style={{ background: rankBg }}>{i + 1}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-800 truncate">{m.city}</p>
                          <p className="text-[10px] text-stone-400">{m.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden max-w-[46px]">
                          <motion.div className="h-full rounded-full" style={{ background: cfg.ring }} initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ duration: 0.8, delay: i * 0.04 }} />
                        </div>
                        <span className="text-sm font-bold text-stone-800">{m.score}</span>
                      </div>
                      <span className="text-sm font-semibold text-stone-700">{m.leads}</span>
                      <span className="text-sm text-stone-600 truncate">{fmtVal(m.avgValue, m.currency)} {m.currency}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${cfg.badge}`}>{m.type}</span>
                      <span className={`text-sm font-bold flex items-center gap-0.5 ${trendStrong ? 'text-emerald-600' : 'text-emerald-500'}`}>
                        <ArrowUpRight className={`w-3 h-3 ${trendStrong ? '' : 'opacity-70'}`} />{m.trend}
                      </span>
                      <span className="text-xs text-stone-400 truncate">{m.region}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Analytics View */}
            {viewMode === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-stone-800 mb-1">Global Lead Volume</h3>
                    <p className="text-xs text-stone-400 mb-4">All markets combined — 6 months</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={MONTHLY_VOL}>
                        <defs><linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B7355" stopOpacity={0.15} /><stop offset="95%" stopColor="#8B7355" stopOpacity={0} /></linearGradient></defs>
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                        <YAxis hide /><Tooltip content={<ChartTip />} />
                        <Area type="monotone" dataKey="prev" name="Last Year" stroke="#E6E0D8" strokeWidth={1.5} fill="transparent" dot={false} strokeDasharray="4 2" />
                        <Area type="monotone" dataKey="leads" name="This Year" stroke="#8B7355" strokeWidth={2.5} fill="url(#volGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-stone-800 mb-1">Search Intent by Type</h3>
                    <p className="text-xs text-stone-400 mb-4">Weekly property type searches</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={SEARCH_INTENT} barSize={12} barCategoryGap="25%">
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                        <YAxis hide /><Tooltip content={<ChartTip />} />
                        <Bar dataKey="luxury" name="Luxury" radius={[3, 3, 0, 0]} fill="#8B7355" />
                        <Bar dataKey="residential" name="Residential" radius={[3, 3, 0, 0]} fill="#8B7355" />
                        <Bar dataKey="commercial" name="Commercial" radius={[3, 3, 0, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4">Region Comparison</h3>
                  <div className="space-y-2">
                    {REGION_DATA.map((r) => (
                      <div key={r.region}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-stone-700">{r.region}</span>
                          <span className="text-stone-400">{r.leads} leads · Score {r.score}</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: r.color, width: `${r.score}%` }} initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="w-60 flex-shrink-0 space-y-4">
          {/* Demand by Type */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Demand by Type</h3>
            <div className="space-y-3">
              {[
                { type: 'Luxury', score: 94, color: '#8B7355' }, { type: 'Residential', score: 78, color: '#8B7355' },
                { type: 'Ultra-Luxury', score: 79, color: '#ef4444' }, { type: 'Commercial', score: 65, color: '#10b981' },
                { type: 'Villa', score: 54, color: '#f59e0b' }, { type: 'Mixed', score: 47, color: '#8B7355' },
              ].map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-stone-600 font-medium">{t.type}</span>
                    <span className="font-bold text-stone-800">{t.score}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: t.color }} initial={{ width: 0 }} animate={{ width: `${t.score}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rising Markets */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Fastest Rising</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">↑ MoM</span>
            </div>
            <div className="space-y-1.5">
              {[...MARKETS].sort((a, b) => b.trendNum - a.trendNum).slice(0, 5).map((m, i) => {
                const cfg = heatCfg(m.score);
                return (
                  <button key={m.id} onClick={() => setSelectedMarket(m)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-stone-50 hover:-translate-y-0.5 hover:border-stone-200 cursor-pointer transition-all text-left border border-transparent">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 shadow-sm" style={{ background: cfg.ring }}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-700 truncate">{m.city}</p>
                      <p className="text-[10px] text-stone-400">{m.leads} leads</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 flex-shrink-0">
                      <ArrowUpRight className="w-3 h-3" />{m.trend}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Market Alerts */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Market Alerts</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">3 Active</span>
            </div>
            <div className="space-y-2">
              {[
                { text: 'Dubai demand surged +24% — highest in 6 months', borderColor: 'border-red-400', bg: 'bg-red-50', icon: Flame, iconColor: 'text-red-500' },
                { text: 'Monaco breaking inquiry records this week', borderColor: 'border-amber-400', bg: 'bg-amber-50', icon: TrendingUp, iconColor: 'text-amber-600' },
                { text: 'Doha accelerating — new government investment zone', borderColor: 'border-stone-400', bg: 'bg-stone-50', icon: Zap, iconColor: 'text-stone-600' },
              ].map((a, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-r-xl ${a.bg} border-l-[3px] ${a.borderColor}`}>
                  <a.icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${a.iconColor}`} />
                  <p className="text-[11px] text-stone-600 leading-snug">{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Status */}
          <div className="bg-gradient-to-br from-stone-900 to-[#0b1628] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <motion.span className="w-2 h-2 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <h3 className="text-sm font-semibold">Live Intelligence</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Last update', value: lastRefresh }, { label: 'Markets tracked', value: '12 cities' },
                { label: 'Total signals', value: `${kpis.totalLeads.toLocaleString()}+` },
                { label: 'Data sources', value: '8 integrated' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">{item.label}</span>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { showToast('Refreshing data…'); setLastRefresh('Just now'); }}
              className="mt-3 w-full h-8 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
