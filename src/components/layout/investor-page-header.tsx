'use client';

import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Breadcrumbs } from './breadcrumbs';
import { cn } from '@/lib/utils';

interface InvestorPageHeaderProps {
  /** Lucide icon component rendered inside the icon box */
  icon: LucideIcon;
  /** CSS gradient string for the icon box background. Defaults to brand warm gradient. */
  iconGradient?: string;
  /** Page title — rendered at text-[20px] font-semibold */
  title: string;
  /** Short subtitle rendered below the title in muted text */
  subtitle?: React.ReactNode;
  /** Content rendered on the right side of the header row (buttons, badges, etc.) */
  actions?: React.ReactNode;
  /** When true, renders the auto-breadcrumbs (derived from pathname) above the card */
  breadcrumb?: boolean;
  /** Extra content rendered inside the card below the icon+title row */
  children?: React.ReactNode;
  /** Additional className merged onto the .ai-deal-hero container */
  className?: string;
  /** Wrap the card in a fade-up motion.div animation (default: true) */
  animate?: boolean;
}

/** Shared page header used across all Investor pages.
 *  Matches the Compare page's gold-standard `ai-deal-hero` card pattern. */
export function InvestorPageHeader({
  icon: Icon,
  iconGradient = 'linear-gradient(135deg, #8B7355, #6F5C46)',
  title,
  subtitle,
  actions,
  breadcrumb = false,
  children,
  className,
  animate = true,
}: InvestorPageHeaderProps) {
  const card = (
    <div className={cn('ai-deal-hero', className)}>
      <div className="relative z-10">
        {/* ── Main row: icon + title + actions ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Icon box */}
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: iconGradient,
                boxShadow: '0 4px 14px rgba(139,115,85,0.20)',
              }}
            >
              <Icon className="h-[18px] w-[18px] text-white" strokeWidth={1.75} />
            </div>
            {/* Title + subtitle */}
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold text-[var(--fg)] tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[12px] text-[var(--fg-muted)] mt-1 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {/* Right-side actions */}
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              {actions}
            </div>
          )}
        </div>
        {/* Footer content inside the card (stats bar, quick picks, etc.) */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );

  return (
    <div>
      {breadcrumb && (
        <Breadcrumbs className="mb-3 text-[12px] text-[var(--fg-muted)]" />
      )}
      {animate ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {card}
        </motion.div>
      ) : (
        card
      )}
    </div>
  );
}
