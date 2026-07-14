'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceArea,
} from 'recharts';
import { Activity, Sparkles } from 'lucide-react';

type Range = 'weekly' | 'monthly' | 'forecast';

const WEEKLY = [
  { label: 'W-7', units: 9,  forecast: false },
  { label: 'W-6', units: 12, forecast: false },
  { label: 'W-5', units: 8,  forecast: false },
  { label: 'W-4', units: 14, forecast: false },
  { label: 'W-3', units: 11, forecast: false },
  { label: 'W-2', units: 16, forecast: false },
  { label: 'W-1', units: 13, forecast: false },
  { label: 'W-0', units: 18, forecast: false },
];

const MONTHLY = [
  { label: 'Jul', units: 32, forecast: false },
  { label: 'Aug', units: 28, forecast: false },
  { label: 'Sep', units: 45, forecast: false },
  { label: 'Oct', units: 38, forecast: false },
  { label: 'Nov', units: 52, forecast: false },
  { label: 'Dec', units: 42, forecast: false },
];

const FORECAST = [
  { label: 'Jul', units: 32, forecast: false },
  { label: 'Aug', units: 28, forecast: false },
  { label: 'Sep', units: 45, forecast: false },
  { label: 'Oct', units: 38, forecast: false },
  { label: 'Nov', units: 52, forecast: false },
  { label: 'Dec', units: 42, forecast: false },
  { label: 'Jan', units: 48, forecast: true },
  { label: 'Feb', units: 55, forecast: true },
  { label: 'Mar', units: 62, forecast: true },
];

const TABS: { id: Range; label: string }[] = [
  { id: 'weekly',   label: 'Weekly' },
  { id: 'monthly',  label: 'Monthly' },
  { id: 'forecast', label: 'Forecast' },
];

export function VelocityChart() {
  const [range, setRange] = useState<Range>('monthly');

  const data = useMemo(() => {
    if (range === 'weekly') return WEEKLY;
    if (range === 'forecast') return FORECAST;
    return MONTHLY;
  }, [range]);

  const actuals   = data.map((d) => (d.forecast ? null : d.units)) as (number | null)[];
  const forecasts = data.map((d) => (d.forecast ? d.units : null)) as (number | null)[];

  const forecastStart = range === 'forecast' ? data.find((d) => d.forecast)?.label : undefined;
  const forecastEnd   = range === 'forecast' ? data[data.length - 1]?.label : undefined;

  const chartData = data.map((d, i) => ({
    label: d.label,
    actual: actuals[i],
    forecast: forecasts[i],
    total: d.units,
    isForecast: d.forecast,
  }));

  const total = data.reduce((s, d) => s + d.units, 0);
  const avg = Math.round(total / data.length);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white/80 p-6 backdrop-blur-md"
      style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-stone-500" />
            <h3 className="text-[15px] font-semibold text-stone-900 tracking-[-0.01em]">Sales Velocity</h3>
          </div>
          <p className="mt-1 text-[11.5px] text-stone-500">
            Units sold per period · avg <span className="font-medium text-stone-700">{avg}</span> · total <span className="font-medium text-stone-700">{total}</span>
          </p>
        </div>

        {/* Range toggle — segmented */}
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1">
          {TABS.map((t) => {
            const active = range === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setRange(t.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11.5px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white text-stone-900 shadow-[0_1px_2px_rgba(31,24,20,0.08)]'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.id === 'forecast' && <Sparkles className="h-3 w-3 text-stone-500" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="vc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(139,115,85,0.14)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9A8B7E' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9A8B7E' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: '#D6CCBE', strokeWidth: 1 }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #E6E0D8',
                borderRadius: 8,
                fontSize: 12,
                color: '#1F1814',
                boxShadow: '0 8px 24px rgba(31,24,20, 0.08)',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#7A6B5E', fontSize: 11, marginBottom: 4 }}
              formatter={(value, _name, entry) => {
                if (value === null || value === undefined) return ['—', ''];
                const isForecast = entry?.payload?.isForecast;
                return [`${value} units`, isForecast ? 'Forecast' : 'Actual'];
              }}
            />

            {forecastStart && forecastEnd && (
              <ReferenceArea
                x1={forecastStart}
                x2={forecastEnd}
                strokeOpacity={0}
                fill="rgba(139,115,85,0.04)"
                ifOverflow="visible"
              />
            )}

            <Area
              type="monotone"
              dataKey="actual"
              stroke="#A89478"
              strokeWidth={1.75}
              strokeOpacity={0.85}
              fill="url(#vc-fill)"
              fillOpacity={0.55}
              dot={false}
              activeDot={{ r: 4, fill: '#A89478', strokeWidth: 2, stroke: '#FFFFFF' }}
              connectNulls
              isAnimationActive
              animationDuration={800}
            />

            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#A89478"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              dot={false}
              activeDot={{ r: 4, fill: '#A89478', strokeWidth: 2, stroke: '#FFFFFF' }}
              connectNulls
              isAnimationActive
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-stone-500" />
          Actual
        </span>
        {range === 'forecast' && (
          <span className="inline-flex items-center gap-1.5">
            <span className="relative h-0.5 w-3 overflow-hidden">
              <span className="absolute inset-0 border-t-2 border-dashed border-stone-400/70" />
            </span>
            Forecast
          </span>
        )}
      </div>
    </div>
  );
}
