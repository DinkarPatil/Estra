'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Map, TrendingUp, TrendingDown, DollarSign, Building2,
  Eye, BarChart3, Globe, Flame, Snowflake,
} from 'lucide-react';

/* ─── Mock market heatmap data ─── */

interface MarketRegion {
  id: string;
  name: string;
  country: string;
  growth: number;
  rentalYield: number;
  avgPrice: number;
  demand: 'Very High' | 'High' | 'Medium' | 'Low';
  riskLevel: 'Low' | 'Medium' | 'High';
  properties: number;
  hotScore: number;
  trend: 'up' | 'down' | 'stable';
  signals: string[];
}

const REGIONS: MarketRegion[] = [
  { id: '1', name: 'Dubai Marina', country: 'UAE', growth: 14.2, rentalYield: 7.8, avgPrice: 850000, demand: 'Very High', riskLevel: 'Medium', properties: 342, hotScore: 92, trend: 'up', signals: ['New metro line', 'Tourism boom', 'Expo legacy'] },
  { id: '2', name: 'Palm Jumeirah', country: 'UAE', growth: 11.5, rentalYield: 6.2, avgPrice: 2400000, demand: 'High', riskLevel: 'Low', properties: 128, hotScore: 88, trend: 'up', signals: ['Ultra-luxury demand', 'Limited supply', 'Brand villas'] },
  { id: '3', name: 'Singapore CBD', country: 'Singapore', growth: 8.3, rentalYield: 4.5, avgPrice: 1800000, demand: 'High', riskLevel: 'Low', properties: 215, hotScore: 82, trend: 'stable', signals: ['Financial hub', 'Strong regulations', 'Limited land'] },
  { id: '4', name: 'London Canary Wharf', country: 'UK', growth: 3.1, rentalYield: 5.1, avgPrice: 620000, demand: 'Medium', riskLevel: 'Medium', properties: 189, hotScore: 65, trend: 'down', signals: ['Brexit effects fading', 'Office conversions', 'Rate sensitivity'] },
  { id: '5', name: 'Mumbai BKC', country: 'India', growth: 18.7, rentalYield: 4.2, avgPrice: 450000, demand: 'Very High', riskLevel: 'High', properties: 567, hotScore: 90, trend: 'up', signals: ['Infrastructure boom', 'IT hub expansion', 'Metro connectivity'] },
  { id: '6', name: 'Tokyo Minato', country: 'Japan', growth: 6.8, rentalYield: 3.8, avgPrice: 920000, demand: 'Medium', riskLevel: 'Low', properties: 143, hotScore: 70, trend: 'stable', signals: ['Stable economy', 'Low vacancy', 'Currency play'] },
  { id: '7', name: 'New York Manhattan', country: 'USA', growth: 5.2, rentalYield: 4.8, avgPrice: 1500000, demand: 'High', riskLevel: 'Medium', properties: 456, hotScore: 78, trend: 'stable', signals: ['Post-pandemic recovery', 'Luxury resurgence', 'Rate concerns'] },
  { id: '8', name: 'Lisbon Expo', country: 'Portugal', growth: 12.4, rentalYield: 5.9, avgPrice: 380000, demand: 'High', riskLevel: 'Medium', properties: 98, hotScore: 85, trend: 'up', signals: ['Digital nomad hub', 'Golden visa', 'EU gateway'] },
];

const METRIC_TABS = ['Growth', 'Rental Yield', 'Demand', 'Risk'];

function heatColor(score: number) {
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#F59E0B';
  if (score >= 50) return '#FB923C';
  return '#EF4444';
}

function formatPrice(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export default function MarketHeatmapPage() {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion | null>(null);
  const [metricTab, setMetricTab] = useState('Growth');
  const [sortBy, setSortBy] = useState<'hotScore' | 'growth' | 'rentalYield'>('hotScore');

  const sorted = [...REGIONS].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="ai-deal-hero">
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
            <Map className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Market Heatmap</h1>
            <p className="text-xs text-[var(--fg-muted)]">Global real estate market intelligence at a glance</p>
          </div>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex items-center justify-between">
        <div className="ex-pill-group">
          {METRIC_TABS.map((tab) => (
            <button key={tab} onClick={() => setMetricTab(tab)} className={`ex-pill ${metricTab === tab ? 'active' : ''}`}>{tab}</button>
          ))}
        </div>
        <div className="hm-legend">
          <span>Cool</span>
          <div className="hm-legend-bar" />
          <span>Hot</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Region list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Visual heatmap grid */}
          <div className="hm-container p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sorted.map((region, i) => (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedRegion(region)}
                  className={`hm-region-card flex-col text-center ${selectedRegion?.id === region.id ? 'active' : ''}`}
                  style={{ borderColor: selectedRegion?.id === region.id ? heatColor(region.hotScore) : undefined }}
                >
                  <div className="hm-heat-dot mx-auto mb-2" style={{ background: heatColor(region.hotScore), boxShadow: `0 0 8px ${heatColor(region.hotScore)}40` }} />
                  <p className="text-xs font-semibold text-[var(--fg)] leading-tight">{region.name}</p>
                  <p className="text-[10px] text-[var(--fg-muted)]">{region.country}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: heatColor(region.hotScore) }}>
                    {metricTab === 'Growth' && `${region.growth}%`}
                    {metricTab === 'Rental Yield' && `${region.rentalYield}%`}
                    {metricTab === 'Demand' && region.demand}
                    {metricTab === 'Risk' && region.riskLevel}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {region.trend === 'up' ? (
                      <Flame className="h-3 w-3 text-[#22C55E]" />
                    ) : region.trend === 'down' ? (
                      <Snowflake className="h-3 w-3 text-[#8B7355]" />
                    ) : (
                      <BarChart3 className="h-3 w-3 text-[var(--fg-muted)]" />
                    )}
                    <span className="text-[10px] text-[var(--fg-muted)] capitalize">{region.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ranking table */}
          <div className="hm-container">
            <div className="p-4 flex items-center justify-between border-b border-[rgba(139,115,85,0.08)]">
              <h3 className="text-sm font-semibold text-[var(--fg)]">Market Rankings</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'hotScore' | 'growth' | 'rentalYield')}
                className="text-xs bg-transparent border border-[rgba(139,115,85,0.12)] rounded-lg px-3 py-1.5 text-[var(--fg-secondary)] outline-none"
              >
                <option value="hotScore">Heat Score</option>
                <option value="growth">Growth</option>
                <option value="rentalYield">Rental Yield</option>
              </select>
            </div>
            <div className="divide-y divide-[rgba(139,115,85,0.05)]">
              {sorted.map((region, i) => (
                <div
                  key={region.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(139,115,85,0.03)] cursor-pointer transition-colors"
                  onClick={() => setSelectedRegion(region)}
                >
                  <span className="text-xs font-bold text-[var(--fg-muted)] w-5">#{i + 1}</span>
                  <div className="hm-heat-dot" style={{ background: heatColor(region.hotScore) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{region.name}</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">{region.country} · {region.properties} properties</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: heatColor(region.hotScore) }}>{region.hotScore}</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">score</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className={`text-sm font-semibold ${region.growth > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {region.growth > 0 ? '+' : ''}{region.growth}%
                    </p>
                    <p className="text-[10px] text-[var(--fg-muted)]">growth</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedRegion ? (
            <motion.div
              key={selectedRegion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="hm-container p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="hm-heat-dot" style={{ background: heatColor(selectedRegion.hotScore), width: 14, height: 14, boxShadow: `0 0 12px ${heatColor(selectedRegion.hotScore)}50` }} />
                  <div>
                    <h3 className="text-base font-bold text-[var(--fg)]">{selectedRegion.name}</h3>
                    <p className="text-xs text-[var(--fg-muted)]">{selectedRegion.country}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Heat Score', value: `${selectedRegion.hotScore}/100`, icon: Flame, color: heatColor(selectedRegion.hotScore) },
                    { label: 'Growth', value: `${selectedRegion.growth}%`, icon: TrendingUp, color: selectedRegion.growth > 0 ? '#22C55E' : '#EF4444' },
                    { label: 'Rental Yield', value: `${selectedRegion.rentalYield}%`, icon: DollarSign, color: '#8B7355' },
                    { label: 'Avg Price', value: formatPrice(selectedRegion.avgPrice), icon: Building2, color: '#8B7355' },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 rounded-xl bg-[rgba(139,115,85,0.04)] dark:bg-[rgba(139,115,85,0.06)]">
                      <m.icon className="h-4 w-4 mx-auto mb-1" style={{ color: m.color }} />
                      <p className="text-lg font-bold text-[var(--fg)]">{m.value}</p>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signals */}
              <div className="hm-container p-5">
                <h4 className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wide mb-3">Market Signals</h4>
                <div className="space-y-2">
                  {selectedRegion.signals.map((signal) => (
                    <div key={signal} className="flex items-center gap-2 text-sm text-[var(--fg-secondary)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B7355]" />
                      {signal}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="hm-container p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--fg-muted)]">Properties Listed</p>
                    <p className="text-lg font-bold text-[var(--fg)]">{selectedRegion.properties}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--fg-muted)]">Demand</p>
                    <p className="text-lg font-bold text-[var(--fg)]">{selectedRegion.demand}</p>
                  </div>
                </div>
                <button className="ai-deal-cta w-full justify-center mt-4">
                  <Eye className="h-3.5 w-3.5" /> Explore Properties
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="hm-container p-8 text-center">
              <Globe className="h-10 w-10 text-[var(--fg-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--fg-muted)]">Select a market to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
