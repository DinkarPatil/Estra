'use client';

import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import {
  Building, Layers, DollarSign, Clock, ArrowRight,
} from 'lucide-react';
import { developerProjects } from '@/mock-data/market-data';
import { DemandSignalBanner } from './_components/demand-signal-banner';
import { SmartKpi } from './_components/smart-kpi';
import { VelocityChart } from './_components/velocity-chart';
import { ProjectMiniCard, type RiskLevel } from './_components/project-mini-card';
import { DemandIntelligence } from './_components/demand-intelligence';
import { DecisionEngine } from './_components/decision-engine';

const PROJECT_ENRICHMENT: Record<string, { demand: number; risk: RiskLevel; spark: number[] }> = {
  'proj-001': { demand: 82, risk: 'low',    spark: [12, 14, 13, 18, 16, 22, 20, 26] },
  'proj-002': { demand: 91, risk: 'medium', spark: [10, 12, 14, 11, 15, 13, 17, 16] },
  'proj-003': { demand: 74, risk: 'medium', spark: [4,  6,  8, 10, 12,  9, 14, 16] },
};

export default function DeveloperDashboard() {
  return (
    <PageContainer>
      <PageHeader
        title="Developer Dashboard"
        description="Live signals, AI moves, and the impact they make"
        actions={
          <button
            type="button"
            className="btn-primary btn-primary-sm group"
          >
            AI Brief
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        }
      />

      {/* 1 — DEMAND SIGNAL (live top banner) */}
      <DemandSignalBanner />

      {/* 2 — INVENTORY ANALYSIS (metrics + velocity indicator + project drill-down) */}
      <section className="space-y-5">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-stone-900 tracking-[-0.01em]">
            <Layers className="h-4 w-4 text-stone-600" />
            Inventory analysis
          </h2>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Portfolio snapshot, velocity, and per-project drill-down
          </p>
        </div>

        {/* 4 primary metrics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SmartKpi
            label="Total units"
            value="770"
            icon={Building}
            accent="blue"
            spark={[720, 730, 735, 750, 755, 760, 765, 770]}
          />
          <SmartKpi
            label="Units sold"
            value="395"
            change={51.3}
            changeLabel="vs last year"
            icon={Layers}
            accent="emerald"
            spark={[180, 210, 240, 268, 295, 320, 358, 395]}
          />
          <SmartKpi
            label="Inventory value"
            value="AED 4.5B"
            icon={DollarSign}
            accent="blue"
            spark={[4.1, 4.15, 4.2, 4.25, 4.32, 4.38, 4.44, 4.5]}
          />
          <SmartKpi
            label="Avg days to sell"
            value="45"
            change={-12}
            changeLabel="vs last quarter"
            icon={Clock}
            accent="amber"
            spark={[62, 58, 55, 53, 50, 48, 46, 45]}
          />
        </div>

        {/* Sales velocity indicator — part of inventory analysis */}
        <VelocityChart />

        {/* Per-project drill-down */}
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-[13.5px] font-semibold text-stone-900 tracking-[-0.01em]">
                Active projects
              </h3>
              <p className="mt-0.5 text-[11.5px] text-stone-500">
                Real-time performance and risk signals
              </p>
            </div>
            <button
              type="button"
              className="group inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-stone-500 transition-colors duration-150 hover:text-stone-600"
            >
              View all
              <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {developerProjects.map((proj) => {
              const e = PROJECT_ENRICHMENT[proj.id] ?? {
                demand: 70,
                risk: 'medium' as RiskLevel,
                spark: [5, 7, 6, 9, 8, 11, 10, 12],
              };
              return (
                <ProjectMiniCard
                  key={proj.id}
                  id={proj.id}
                  name={proj.name}
                  location={proj.location}
                  status={proj.status}
                  totalUnits={proj.totalUnits}
                  soldUnits={proj.soldUnits}
                  completionDate={proj.completionDate}
                  demand={e.demand}
                  risk={e.risk}
                  spark={e.spark}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 — DEMAND INTELLIGENCE (live lead-driven) */}
      <DemandIntelligence />

      {/* 4, 5, 6 — DECISION ENGINE (AI Pricing → Actions → Impact) */}
      <DecisionEngine />
    </PageContainer>
  );
}
