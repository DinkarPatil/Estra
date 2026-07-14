'use client';

import { motion } from 'framer-motion';
import { Phone, Star, type LucideIcon } from 'lucide-react';

export type Stakeholder = {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  company: string;
  experienceYears: number;
  rating: number;   // 0–5 (supports halves)
  reviews: number;  // count
  icon: LucideIcon;
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return (
          <div key={i} className="relative h-3 w-3">
            <Star className="absolute inset-0 h-3 w-3 text-stone-200" strokeWidth={1.6} />
            {(filled || half) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : '50%' }}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={1.6} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StakeholderCard({ stakeholder }: { stakeholder: Stakeholder }) {
  const RoleIcon = stakeholder.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_14px_38px_rgba(31,24,20,0.08)]"
      style={{ boxShadow: '0 10px 30px rgba(31,24,20, 0.04)' }}
    >
      {/* Header: avatar + role chip */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#166534] to-[#14532D] text-[14px] font-bold text-white shadow-[0_2px_6px_rgba(22,101,52,0.30)]">
            {initialsOf(stakeholder.name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-semibold text-stone-900 tracking-[-0.01em]">
              {stakeholder.name}
            </h3>
            <p className="truncate text-[11.5px] text-stone-500">{stakeholder.company}</p>
          </div>
        </div>
      </div>

      {/* Role + experience */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#166534]/15 bg-[#DCFCE7] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#166534]">
          <RoleIcon className="h-3 w-3" />
          {stakeholder.roleLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10.5px] font-medium text-stone-600">
          {stakeholder.experienceYears}+ yrs exp.
        </span>
      </div>

      {/* Divider */}
      <div className="mt-4 h-px bg-stone-100" />

      {/* Rating + CTA */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Stars rating={stakeholder.rating} />
            <span className="text-[12px] font-semibold text-stone-900">{stakeholder.rating.toFixed(1)}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-400">
            {stakeholder.reviews} reviews
          </p>
        </div>
        <button
          type="button"
          className="group/cta inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-stone-700 transition-all duration-150 hover:border-[#166534]/20 hover:bg-[#DCFCE7] hover:text-[#166534]"
        >
          <Phone className="h-3 w-3" />
          Contact
        </button>
      </div>
    </motion.div>
  );
}
