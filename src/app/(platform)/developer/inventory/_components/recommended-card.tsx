'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, ArrowRight, TrendingUp, Star } from 'lucide-react';

export type Recommended = {
  id: string;
  name: string;
  project: string;
  location: string;
  price: string;
  roi: number;
  tags: string[];
  image: string;        // real image URL
  featured?: boolean;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80';

export function RecommendedCard({ item }: { item: Recommended }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-shadow duration-200 hover:shadow-[0_14px_38px_rgba(31,24,20,0.10)]"
      style={{ boxShadow: '0 4px 14px rgba(31,24,20, 0.06)' }}
    >
      {/* ── Top image ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const t = e.currentTarget;
            if (t.src !== FALLBACK_IMAGE) t.src = FALLBACK_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />

        {/* ROI badge — light green pill per luxury spec */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#DCFCE7] px-2.5 py-1 text-[11.5px] font-bold text-[#166534] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <TrendingUp className="h-3 w-3" strokeWidth={2.4} />
            {item.roi}% ROI
          </span>
        </div>

        {/* Featured chip — top left */}
        {item.featured && (
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-stone-800 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" strokeWidth={0} />
              Featured
            </span>
          </div>
        )}

        {/* Title + location on image */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <h3
            className="truncate text-[17px] font-semibold text-white leading-tight tracking-[-0.01em]"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.35)' }}
          >
            {item.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/85">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{item.project}</span>
            <span className="text-white/40">·</span>
            <MapPin className="h-3 w-3" />
            <span className="truncate">{item.location}</span>
          </div>
        </div>
      </div>

      {/* ── Content section ── */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Tags — clean pills */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[10.5px] font-medium text-stone-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Price
            </p>
            <p className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] text-stone-900">
              {item.price}
            </p>
          </div>
          <button
            type="button"
            className="group/cta inline-flex items-center gap-1.5 rounded-[10px] bg-[#166534] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(22,101,52,0.18)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#14532D] hover:shadow-[0_3px_10px_rgba(22,101,52,0.22),0_1px_3px_rgba(22,101,52,0.15)] active:translate-y-0 active:shadow-[0_1px_2px_rgba(22,101,52,0.18)]"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
