'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { useProperty } from '@/hooks/use-properties';
import { MapPin, Layers, AlertTriangle, CheckCircle, School, Hospital, Train, ShoppingBag } from 'lucide-react';

const RISK_FACTORS = [
  { label: 'Flood Risk', score: 'Very Low', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { label: 'Earthquake Zone', score: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { label: 'Air Quality Index', score: 'Good (42)', color: 'text-stone-600', bg: 'bg-stone-50 dark:bg-stone-900/20' },
  { label: 'Noise Level', score: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
];

const NEARBY = [
  { icon: School, label: 'Top Schools', count: 3, distance: '0.5km' },
  { icon: Hospital, label: 'Hospitals', count: 2, distance: '1.2km' },
  { icon: Train, label: 'Metro Stations', count: 1, distance: '0.3km' },
  { icon: ShoppingBag, label: 'Shopping Malls', count: 4, distance: '0.8km' },
];

export default function DigitalTwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { property, loading, error } = useProperty(id);
  const [activeLayer, setActiveLayer] = useState<'standard' | 'risk' | 'infra'>('standard');

  if (loading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-sm text-[var(--fg-muted)]">Loading property...</div>
      </PageContainer>
    );
  }
  if (error || !property) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <p className="text-[var(--fg)] font-medium">Couldn&apos;t load property</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">{error || 'Not found'}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Digital Twin"
        description={property.title}
        actions={<button onClick={() => router.back()} className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)]">← Back</button>}
      />

      {/* Layer selector */}
      <div className="flex gap-2">
        {([['standard', 'Satellite View'], ['risk', 'Risk Overlay'], ['infra', 'Infrastructure']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeLayer === key ? 'bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:bg-[var(--border)]'}`}
          >
            <Layers className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center border border-[var(--border)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)' }} />
        <div className="flex flex-col items-center gap-3 text-white/60">
          <MapPin className="h-12 w-12 text-[#8B7355]" />
          <p className="text-sm font-medium">{property.location.city}, {property.location.country}</p>
          <p className="text-xs">{activeLayer === 'standard' ? 'Satellite View' : activeLayer === 'risk' ? 'Risk Heatmap Overlay' : 'Infrastructure Layer'}</p>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Map Integration Ready
          </div>
        </div>
        {activeLayer === 'risk' && (
          <div className="absolute top-4 right-4 rounded-xl bg-black/50 backdrop-blur-sm p-3 text-xs text-white">
            <p className="font-medium mb-2">Risk Legend</p>
            {['Low Risk', 'Medium Risk', 'High Risk'].map((r, i) => (
              <div key={r} className="flex items-center gap-2 mb-1">
                <div className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className="text-white/70">{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Risk Analysis */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
          <h3 className="font-semibold text-[var(--fg)] mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Environmental Risk Assessment
          </h3>
          <div className="space-y-3">
            {RISK_FACTORS.map(({ label, score, color, bg }) => (
              <div key={label} className={`flex items-center justify-between rounded-lg p-3 ${bg}`}>
                <span className="text-sm text-[var(--fg-secondary)]">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
          <h3 className="font-semibold text-[var(--fg)] mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Nearby Infrastructure
          </h3>
          <div className="space-y-3">
            {NEARBY.map(({ icon: Icon, label, count, distance }) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[var(--bg-tertiary)] p-2">
                    <Icon className="h-4 w-4 text-[var(--fg-secondary)]" />
                  </div>
                  <span className="text-sm text-[var(--fg)]">{label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--fg)]">{count} nearby</p>
                  <p className="text-xs text-[var(--fg-muted)]">Nearest: {distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
