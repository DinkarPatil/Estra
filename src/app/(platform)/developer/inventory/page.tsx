'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Building2, UserCheck, Scale, Pencil, Plus } from 'lucide-react';

import { InvestmentStepper } from './_components/investment-stepper';
import { RecommendedCard, type Recommended } from './_components/recommended-card';
import { InvestmentSummary } from './_components/investment-summary';
import { StakeholderCard, type Stakeholder } from './_components/stakeholder-card';
import { UnitCard, type Unit } from './_components/unit-card';
import { FilterBar, DEFAULT_FILTERS, type FilterState } from './_components/filter-bar';
import { InsightsPanel } from './_components/insights-panel';

/* ─── Mock data ─── */

const RECOMMENDED: Recommended[] = [
  {
    id: 'rec-001',
    name: '3BR Skyline Residence',
    project: 'Skyline Tower',
    location: 'Downtown Dubai',
    price: 'AED 4.2M',
    roi: 18.4,
    tags: ['Luxury', 'High Demand'],
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop&q=80',
    featured: true,
  },
  {
    id: 'rec-002',
    name: 'Marina View 2BR',
    project: 'Azure Heights',
    location: 'Dubai Marina',
    price: 'AED 2.8M',
    roi: 14.6,
    tags: ['Waterfront', 'Ready-to-move'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop&q=80',
  },
  {
    id: 'rec-003',
    name: 'Villa 12 · Valley Green',
    project: 'Green Valley Residences',
    location: 'Dubai Hills',
    price: 'AED 7.5M',
    roi: 12.8,
    tags: ['Villa', 'Premium'],
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop&q=80',
  },
];

const STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'sk-dev',
    name: 'Aarav Kapoor',
    role: 'developer',
    roleLabel: 'Developer',
    company: 'Glimmora Developments',
    experienceYears: 14,
    rating: 4.8,
    reviews: 214,
    icon: Building2,
  },
  {
    id: 'sk-brk',
    name: 'Sophia Alvarez',
    role: 'broker',
    roleLabel: 'Broker',
    company: 'Blue Horizon Realty',
    experienceYears: 9,
    rating: 4.6,
    reviews: 132,
    icon: UserCheck,
  },
  {
    id: 'sk-leg',
    name: 'Fatima Al-Rashid',
    role: 'legal',
    roleLabel: 'Legal Advisor',
    company: 'Al-Rashid Chambers',
    experienceYears: 18,
    rating: 4.9,
    reviews: 86,
    icon: Scale,
  },
  {
    id: 'sk-arc',
    name: 'Ravi Menon',
    role: 'architect',
    roleLabel: 'Lead Architect',
    company: 'Menon & Partners',
    experienceYears: 22,
    rating: 4.7,
    reviews: 58,
    icon: Pencil,
  },
];

const UNITS: Unit[] = [
  {
    id: 'u-001',
    unit: 'Tower A · 4201',
    project: 'Skyline Tower',
    location: 'Downtown Dubai',
    type: 'Apartment',
    area: 1850,
    price: 'AED 4.2M',
    priceValue: 4.2,
    roi: 18.4,
    demand: 88,
    status: 'available',
    tags: ['Premium', 'High ROI'],
  },
  {
    id: 'u-002',
    unit: 'Tower B · 3105',
    project: 'Skyline Tower',
    location: 'Downtown Dubai',
    type: 'Apartment',
    area: 1240,
    price: 'AED 2.95M',
    priceValue: 2.95,
    roi: 15.1,
    demand: 74,
    status: 'available',
    tags: ['High ROI'],
  },
  {
    id: 'u-003',
    unit: 'PH · 5001',
    project: 'Skyline Tower',
    location: 'Downtown Dubai',
    type: 'Penthouse',
    area: 3420,
    price: 'AED 12.8M',
    priceValue: 12.8,
    roi: 19.2,
    demand: 92,
    status: 'reserved',
    tags: ['Luxury', 'Premium'],
  },
  {
    id: 'u-004',
    unit: 'Villa 07',
    project: 'Green Valley Residences',
    location: 'Dubai Hills',
    type: 'Villa',
    area: 4150,
    price: 'AED 7.5M',
    priceValue: 7.5,
    roi: 12.8,
    demand: 68,
    status: 'available',
    tags: ['Villa', 'Premium'],
  },
  {
    id: 'u-005',
    unit: 'Azure · 2204',
    project: 'Azure Heights',
    location: 'Dubai Marina',
    type: 'Apartment',
    area: 1580,
    price: 'AED 2.8M',
    priceValue: 2.8,
    roi: 14.6,
    demand: 79,
    status: 'available',
    tags: ['Waterfront'],
  },
  {
    id: 'u-006',
    unit: 'Retail · GF-03',
    project: 'Skyline Tower',
    location: 'Downtown Dubai',
    type: 'Retail',
    area: 820,
    price: 'AED 3.6M',
    priceValue: 3.6,
    roi: 16.5,
    demand: 55,
    status: 'sold',
    tags: ['Commercial'],
  },
  {
    id: 'u-007',
    unit: 'Azure · 1908',
    project: 'Azure Heights',
    location: 'Dubai Marina',
    type: 'Apartment',
    area: 980,
    price: 'AED 1.9M',
    priceValue: 1.9,
    roi: 13.2,
    demand: 64,
    status: 'reserved',
    tags: ['Ready-to-move'],
  },
  {
    id: 'u-008',
    unit: 'Valley · TH-12',
    project: 'Green Valley Residences',
    location: 'Dubai Hills',
    type: 'Townhouse',
    area: 2640,
    price: 'AED 5.1M',
    priceValue: 5.1,
    roi: 13.9,
    demand: 71,
    status: 'available',
    tags: ['Family', 'Garden'],
  },
];

/* Simple ROI→risk heuristic for filter bucketing */
const unitRisk = (u: Unit): 'low' | 'medium' | 'high' =>
  u.roi >= 16 ? 'high' : u.roi >= 13 ? 'medium' : 'low';

export default function InventoryPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filteredUnits = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const loc = filters.location.trim().toLowerCase();
    return UNITS.filter((u) => {
      if (q) {
        const hay = `${u.unit} ${u.project} ${u.type} ${u.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.type !== 'any' && u.type !== filters.type) return false;
      if (filters.status !== 'any' && u.status !== filters.status) return false;
      if (filters.risk !== 'any' && unitRisk(u) !== filters.risk) return false;
      if (loc && !u.location.toLowerCase().includes(loc)) return false;
      if (u.priceValue < filters.minBudget || u.priceValue > filters.maxBudget) return false;
      if (u.roi < filters.minRoi || u.roi > filters.maxRoi) return false;
      return true;
    });
  }, [filters]);

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="Developer Inventory"
        description="Investor-ready units across every active project"
        actions={
          <button
            type="button"
            className="group inline-flex items-center gap-2 rounded-[10px] bg-[#166534] px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(22,101,52,0.18)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#14532D] hover:shadow-[0_3px_10px_rgba(22,101,52,0.22),0_1px_3px_rgba(22,101,52,0.15)] active:translate-y-0 active:shadow-[0_1px_2px_rgba(22,101,52,0.18)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Unit
          </button>
        }
      />

      {/* Investment flow stepper */}
      <InvestmentStepper />

      {/* ══ Overview: Recommended ══ */}
      <section id="overview" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900 tracking-[-0.015em]">Recommended for You</h2>
          <p className="mt-1 text-[12.5px] text-stone-500">Based on your budget and goals</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED.map((r) => (
            <RecommendedCard key={r.id} item={r} />
          ))}
        </div>
      </section>

      {/* ══ Investment Details ══ */}
      <section id="investment-details" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900 tracking-[-0.015em]">Investment Details</h2>
          <p className="mt-1 text-[12.5px] text-stone-500">Expected return, yield, and risk profile</p>
        </div>
        <InvestmentSummary roi={18} yield_={6} risk="medium" appreciation={24} />
      </section>

      {/* ══ Stakeholders ══ */}
      <section id="stakeholders" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900 tracking-[-0.015em]">Stakeholders</h2>
          <p className="mt-1 text-[12.5px] text-stone-500">The people and firms behind this portfolio</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAKEHOLDERS.map((s) => (
            <StakeholderCard key={s.id} stakeholder={s} />
          ))}
        </div>
      </section>

      {/* ══ Financials / Market insights ══ */}
      <section id="financials" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900 tracking-[-0.015em]">Market Insights</h2>
          <p className="mt-1 text-[12.5px] text-stone-500">Price trajectory, demand signals, and yield movement</p>
        </div>
        <InsightsPanel />
      </section>

      {/* ══ Action: Units grid with filters ══ */}
      <section id="action" className="scroll-mt-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-stone-900 tracking-[-0.015em]">Available Inventory</h2>
            <p className="mt-1 text-[12.5px] text-stone-500">Browse, filter, and commit to a unit</p>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={filteredUnits.length}
          totalCount={UNITS.length}
        />

        {filteredUnits.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUnits.map((u) => (
              <UnitCard key={u.id} unit={u} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
            <p className="text-[14px] font-medium text-stone-700">No units match your filters</p>
            <p className="mt-1 text-[12px] text-stone-500">Try adjusting the budget range, ROI, or clearing the search.</p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-[12.5px] font-medium text-stone-700 transition-colors duration-150 hover:border-[#166534]/20 hover:bg-[#DCFCE7] hover:text-[#166534]"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
