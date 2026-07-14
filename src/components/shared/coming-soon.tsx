'use client';

import { Clock, Construction } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is under development and will be available in a future release.',
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="rounded-full bg-stone-800/40 p-4 mb-5">
        <Construction className="h-8 w-8 text-amber-400/70" strokeWidth={1.5} />
      </div>
      <h2
        className="text-xl font-semibold text-white/70 mb-2"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h2>
      <p className="text-sm text-white/30 max-w-md leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 mt-5 text-xs text-amber-400/50">
        <Clock className="h-3.5 w-3.5" />
        <span>Under development</span>
      </div>
    </div>
  );
}
