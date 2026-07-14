'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Remove role prefix for display (investor, broker, developer, admin)
  // The sidebar already indicates the active role, so skip the first segment.
  const displaySegments = segments.slice(1);

  // UUID regex — detect dynamic route segments like property/area IDs
  const UUID_RE = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  // Friendly label overrides for UUID-like segments based on parent path
  function uuidLabel(segments: string[], index: number): string {
    const parent = segments[index - 1] ?? '';
    const labels: Record<string, string> = {
      properties: 'Property Details',
      areas: 'Area Details',
      compare: 'Comparison',
    };
    return labels[parent] ?? 'Details';
  }

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      <Link href="/" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {displaySegments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === displaySegments.length - 1;
        const isUUID = UUID_RE.test(segment);
        const label = isUUID
          ? uuidLabel(segments, index)
          : segment
              .replace(/\[.*?\]/g, '')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <div key={href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-[var(--fg-muted)]" />
            {isLast ? (
              <span className="font-medium text-[var(--fg)]">{label}</span>
            ) : (
              <Link href={href} className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export { Breadcrumbs };
