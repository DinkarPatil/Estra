'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle, Shield, TrendingUp, Target, Globe, Building2,
  DollarSign, MapPin, BarChart3, Clock, Sparkles, Edit3,
  Check, Heart, Award, Briefcase,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ConfidenceMeter } from '@/components/shared';

/* ─── Mock Profile Data ─── */

const INVESTMENT_PREFERENCES = [
  'Residential', 'Commercial', 'Mixed-Use', 'Land', 'Industrial',
  'Retail', 'Hospitality', 'Student Housing', 'Co-Living',
];

const RISK_APPETITES = ['Conservative', 'Moderate', 'Aggressive'];

const PREFERRED_MARKETS = [
  { name: 'Dubai', flag: '🇦🇪', active: true },
  { name: 'Singapore', flag: '🇸🇬', active: true },
  { name: 'London', flag: '🇬🇧', active: false },
  { name: 'Mumbai', flag: '🇮🇳', active: true },
  { name: 'New York', flag: '🇺🇸', active: false },
  { name: 'Tokyo', flag: '🇯🇵', active: false },
  { name: 'Lisbon', flag: '🇵🇹', active: true },
  { name: 'Sydney', flag: '🇦🇺', active: false },
];

const PROFILE_METRICS = {
  investorScore: 87,
  portfolioHealth: 82,
  diversification: 68,
  riskScore: 75,
};

const INVESTMENT_GOALS = [
  { label: 'Rental Income', target: '$15K/mo', current: '$12.4K/mo', progress: 83, color: '#22C55E' },
  { label: 'Portfolio Value', target: '$10M', current: '$7.8M', progress: 78, color: '#8B7355' },
  { label: 'Properties Owned', target: '15', current: '9', progress: 60, color: '#8B7355' },
  { label: 'Global Markets', target: '6', current: '4', progress: 67, color: '#F59E0B' },
];

const ACTIVITY_LOG = [
  { action: 'Viewed Property', detail: 'Marina Bay Penthouse', time: '2 hours ago' },
  { action: 'Saved Deal', detail: 'Palm Jumeirah Villa', time: '5 hours ago' },
  { action: 'Ran Simulation', detail: 'Conservative scenario', time: '1 day ago' },
  { action: 'Updated Preferences', detail: 'Added Hospitality', time: '2 days ago' },
  { action: 'Compared Deals', detail: '3 properties in Dubai', time: '3 days ago' },
];

const AI_MATCHES = [
  { title: 'Dubai Marina Apartment', score: 94, reason: 'Matches your high-yield preference in a preferred market' },
  { title: 'Singapore Shophouse', score: 89, reason: 'Mixed-use property with strong appreciation aligned to your goals' },
  { title: 'Mumbai BKC Office', score: 85, reason: 'Emerging market exposure to diversify your portfolio' },
];

export default function InvestorProfilePage() {
  const { user } = useAuth();
  const [selectedPrefs, setSelectedPrefs] = useState<Set<string>>(new Set(['Residential', 'Commercial', 'Mixed-Use']));
  const [riskAppetite, setRiskAppetite] = useState('Moderate');
  const [activeMarkets, setActiveMarkets] = useState(new Set(PREFERRED_MARKETS.filter((m) => m.active).map((m) => m.name)));

  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) => {
      const next = new Set(prev);
      next.has(pref) ? next.delete(pref) : next.add(pref);
      return next;
    });
  };

  const toggleMarket = (market: string) => {
    setActiveMarkets((prev) => {
      const next = new Set(prev);
      next.has(market) ? next.delete(market) : next.add(market);
      return next;
    });
  };

  const userName = user?.name || 'Sarah Chen';
  const userEmail = user?.email || 'sarah@glimmora.com';

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header */}
      <div className="ip-header">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="ip-avatar">{userName.charAt(0)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--fg)]">{userName}</h1>
              <span className="ip-tier-badge">
                <Award className="h-3 w-3" /> UHNI
              </span>
            </div>
            <p className="text-sm text-[var(--fg-secondary)] mt-1">{userEmail}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--fg-muted)]">
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> 9 Properties</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> 4 Markets</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Member since 2021</span>
            </div>
          </div>
          <button className="ai-deal-cta self-start">
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </button>
        </div>

        {/* Score meters */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Object.entries(PROFILE_METRICS).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center">
              <ConfidenceMeter score={value} size={60} strokeWidth={5} />
              <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)] mt-2">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Investment Goals */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">Investment Goals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INVESTMENT_GOALS.map((goal) => (
                <div key={goal.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--fg)]">{goal.label}</span>
                    <span className="text-xs text-[var(--fg-muted)]">{goal.current} / {goal.target}</span>
                  </div>
                  <div className="ip-progress">
                    <div className="ip-progress-bar" style={{ width: `${goal.progress}%`, background: goal.color }} />
                  </div>
                  <p className="text-[10px] text-[var(--fg-muted)]">{goal.progress}% complete</p>
                </div>
              ))}
            </div>
          </div>

          {/* Property Type Preferences */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">Property Preferences</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {INVESTMENT_PREFERENCES.map((pref) => (
                <button
                  key={pref}
                  onClick={() => togglePref(pref)}
                  className={`ip-pref-tag ${selectedPrefs.has(pref) ? 'active' : ''}`}
                >
                  {selectedPrefs.has(pref) && <Check className="h-3 w-3" />}
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Appetite */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">Risk Appetite</h2>
            </div>
            <div className="flex gap-3">
              {RISK_APPETITES.map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskAppetite(risk)}
                  className={`flex-1 py-3 rounded-xl text-center text-sm font-medium transition-all border ${
                    riskAppetite === risk
                      ? 'bg-[rgba(139,115,85,0.10)] text-[#8B7355] border-[rgba(139,115,85,0.20)]'
                      : 'bg-transparent text-[var(--fg-secondary)] border-[rgba(139,115,85,0.08)] hover:border-[rgba(139,115,85,0.15)]'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Markets */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">Preferred Markets</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PREFERRED_MARKETS.map((market) => (
                <button
                  key={market.name}
                  onClick={() => toggleMarket(market.name)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all border ${
                    activeMarkets.has(market.name)
                      ? 'bg-[rgba(139,115,85,0.08)] border-[rgba(139,115,85,0.18)] text-[var(--fg)]'
                      : 'bg-transparent border-[rgba(139,115,85,0.06)] text-[var(--fg-muted)]'
                  }`}
                >
                  <span className="text-base">{market.flag}</span>
                  <span className="text-xs font-medium">{market.name}</span>
                  {activeMarkets.has(market.name) && <Check className="h-3 w-3 text-[#22C55E] ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* AI Match Recommendations */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#C6A86B]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">AI Matches</h2>
            </div>
            <div className="space-y-3">
              {AI_MATCHES.map((match) => (
                <motion.div
                  key={match.title}
                  whileHover={{ x: 3 }}
                  className="p-3 rounded-xl bg-[rgba(139,115,85,0.04)] dark:bg-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.06)] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[var(--fg)]">{match.title}</p>
                    <span className={`text-xs font-bold ${match.score >= 90 ? 'text-[#22C55E]' : 'text-[#8B7355]'}`}>{match.score}%</span>
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">{match.reason}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {ACTIVITY_LOG.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B7355] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[var(--fg)]">{activity.action}</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">{activity.detail} · {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="ip-card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">Stats</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Invested', value: '$7.8M', icon: DollarSign },
                { label: 'Monthly Income', value: '$12.4K', icon: TrendingUp },
                { label: 'Deals Viewed', value: '247', icon: Heart },
                { label: 'Simulations Run', value: '34', icon: BarChart3 },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
                    <stat.icon className="h-3 w-3" /> {stat.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--fg)]">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
