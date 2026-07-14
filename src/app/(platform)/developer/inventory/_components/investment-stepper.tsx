'use client';

import { useState } from 'react';
import {
  Compass, LineChart, Users, Wallet, CheckCircle2, Check,
  type LucideIcon,
} from 'lucide-react';

type Step = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  targetId: string;
};

const STEPS: Step[] = [
  { id: 'overview',           label: 'Overview',           hint: 'Recommended',    icon: Compass,      targetId: 'overview' },
  { id: 'investment-details', label: 'Investment Details', hint: 'ROI & yield',    icon: LineChart,    targetId: 'investment-details' },
  { id: 'stakeholders',       label: 'Stakeholders',       hint: 'People',          icon: Users,        targetId: 'stakeholders' },
  { id: 'financials',         label: 'Financials',         hint: 'Market insights', icon: Wallet,       targetId: 'financials' },
  { id: 'action',             label: 'Action',             hint: 'Pick a unit',     icon: CheckCircle2, targetId: 'action' },
];

export function InvestmentStepper() {
  const [activeId, setActiveId] = useState('overview');
  const activeIndex = STEPS.findIndex((s) => s.id === activeId);

  const handleClick = (step: Step) => {
    setActiveId(step.id);
    const el = document.getElementById(step.targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.05)' }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.10em] text-[#166534]">
            Investment flow
          </p>
          <p className="mt-0.5 text-[11.5px] text-stone-500">
            Step <span className="font-semibold text-stone-900">{activeIndex + 1}</span> of {STEPS.length} ·{' '}
            <span className="text-stone-700">{STEPS[activeIndex].label}</span>
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start gap-0 overflow-x-auto">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          const isUpcoming = i > activeIndex;

          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                onClick={() => handleClick(step)}
                className="group flex min-w-0 flex-1 flex-col items-center gap-2.5 px-2 py-1 transition-colors duration-150"
              >
                {/* Step circle */}
                <div
                  className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-[#166534] text-white shadow-[0_2px_10px_rgba(22,101,52,0.35)]'
                      : isDone
                        ? 'bg-[#166534] text-white'
                        : 'border-2 border-stone-300 bg-white text-stone-400 group-hover:border-stone-400 group-hover:text-stone-600'
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={2.6} />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={isActive ? 2.2 : 2} />
                  )}
                  {isActive && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#22C55E]/25"
                      style={{ animationDuration: '2.4s' }}
                    />
                  )}
                </div>

                {/* Labels */}
                <div className="min-w-0 text-center">
                  <p
                    className={`truncate text-[11.5px] font-semibold tracking-[-0.005em] ${
                      isActive ? 'text-stone-900' : isDone ? 'text-stone-700' : isUpcoming ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className={`mt-0.5 hidden truncate text-[10.5px] sm:block ${isActive ? 'text-stone-500' : 'text-stone-400'}`}>
                    {step.hint}
                  </p>
                </div>
              </button>

              {/* Thin connector line between steps */}
              {i < STEPS.length - 1 && (
                <div className="mx-0.5 mt-[17px] h-0.5 min-w-[16px] flex-1 overflow-hidden rounded-full bg-stone-200 sm:min-w-[24px]">
                  <div
                    className={`h-full rounded-full bg-[#166534] transition-all duration-300 ${
                      i < activeIndex ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
