'use client';

import type { ReactNode } from 'react';
import { X, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DrawerHeroBadge {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'secondary';
}

export interface DrawerHeroProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  badges?: DrawerHeroBadge[];
  onClose: () => void;
  topContent?: ReactNode;
  height?: string;
  className?: string;
}

export function DrawerHero({
  imageSrc, imageAlt, title, subtitle, badges, onClose, topContent, height = 'h-48', className,
}: DrawerHeroProps) {
  return (
    <div className={cn('relative flex-shrink-0 overflow-hidden', height, className)}>
      <img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />

      {/* Top bar */}
      <div className="absolute top-4 left-5 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {topContent}
          {badges?.map((b, i) => (
            <Badge
              key={i}
              variant={b.variant || 'secondary'}
              className="backdrop-blur-md bg-black/30 text-white border-white/20 text-[10px] capitalize shadow-sm"
            >
              {b.label}
            </Badge>
          ))}
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 backdrop-blur-md hover:bg-white/20 transition-colors cursor-pointer border border-white/10"
        >
          <X className="h-3.5 w-3.5 text-white" />
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-5 right-5">
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        {subtitle && (
          <p className="flex items-center gap-1.5 text-sm text-white/75 mt-1">
            <MapPin className="h-3.5 w-3.5" /> {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
