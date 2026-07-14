'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

/* ── Route metadata ──────────────────────────────────────────────
   Each entry: { label, parent? }
   Entries are checked longest-first so specific routes win over
   prefix matches (e.g. /broker/listings/new beats /broker/listings).
─────────────────────────────────────────────────────────────── */
interface RouteMeta {
  label: string;
  /** Shown before the ">" separator. Omit on root/dashboard pages. */
  parent?: string;
}

/** Order matters — more-specific paths must come before their prefixes. */
const ROUTE_MAP: [string, RouteMeta][] = [
  // ── Investor ────────────────────────────────────────
  ['/investor/properties/map',              { label: 'Map View',             parent: 'Properties' }],
  ['/investor/properties/',                 { label: 'Property Details',     parent: 'Properties' }],
  ['/investor/properties',                  { label: 'Property Intelligence', parent: 'Investor' }],
  ['/investor/areas',                       { label: 'Area Recommendations', parent: 'Investor' }],
  ['/investor/compare',                     { label: 'Deal Comparison',      parent: 'Investor' }],
  ['/investor/ai-qa',                       { label: 'AI Advisor',           parent: 'Investor' }],
  ['/investor/ai-deals',                    { label: 'Saved Deals',          parent: 'Investor' }],
  ['/investor/negotiations/',               { label: 'Deal Room',            parent: 'Negotiations' }],
  ['/investor/negotiations',                { label: 'My Negotiations',      parent: 'Investor' }],
  ['/investor/portfolio/performance',       { label: 'Performance',          parent: 'Portfolio' }],
  ['/investor/portfolio/cashflow',          { label: 'Cash Flow',            parent: 'Portfolio' }],
  ['/investor/portfolio/assets',            { label: 'Assets',               parent: 'Portfolio' }],
  ['/investor/portfolio/simulator',         { label: 'Simulator',            parent: 'Portfolio' }],
  ['/investor/portfolio/',                  { label: 'Asset Details',        parent: 'Portfolio' }],
  ['/investor/portfolio',                   { label: 'My Portfolio',         parent: 'Investor' }],
  ['/investor/transactions/',               { label: 'Transaction',          parent: 'Transactions' }],
  ['/investor/transactions',                { label: 'Transactions',         parent: 'Investor' }],
  ['/investor/intelligence/risk-alerts',    { label: 'Risk Alerts',          parent: 'Intelligence' }],
  ['/investor/intelligence/heatmap',        { label: 'Heatmap',              parent: 'Intelligence' }],
  ['/investor/intelligence',                { label: 'Market Intelligence',  parent: 'Investor' }],
  ['/investor/fractional/',                 { label: 'Fractional Detail',    parent: 'Fractional' }],
  ['/investor/fractional',                  { label: 'Fractional',           parent: 'Investor' }],
  ['/investor/lending/calculator',          { label: 'Mortgage Calculator',  parent: 'Lending' }],
  ['/investor/lending',                     { label: 'Lending',              parent: 'Investor' }],
  ['/investor/concierge',                   { label: 'Concierge',            parent: 'Investor' }],
  ['/investor/decision',                    { label: 'Decision Hub',         parent: 'Investor' }],
  ['/investor/documents',                   { label: 'Documents',            parent: 'Investor' }],
  ['/investor/profile',                     { label: 'Profile',              parent: 'Investor' }],
  ['/investor/settings',                    { label: 'Settings',             parent: 'Investor' }],
  ['/investor',                             { label: 'Smart Search',         parent: 'Investor' }],

  // ── Broker ──────────────────────────────────────────
  ['/broker/leads/',                        { label: 'Lead Details',         parent: 'Leads' }],
  ['/broker/leads',                         { label: 'Leads',                parent: 'Broker' }],
  ['/broker/listings/new',                  { label: 'New Listing',          parent: 'Listings' }],
  ['/broker/listings/',                     { label: 'Listing Details',      parent: 'Listings' }],
  ['/broker/listings',                      { label: 'Listings',             parent: 'Broker' }],
  ['/broker/negotiations/',                 { label: 'Deal Room',            parent: 'Negotiations' }],
  ['/broker/negotiations',                  { label: 'Negotiations',         parent: 'Broker' }],
  ['/broker/analytics/demand-heatmap',      { label: 'Demand Heatmap',       parent: 'Analytics' }],
  ['/broker/analytics',                     { label: 'Analytics',            parent: 'Broker' }],
  ['/broker/clients',                       { label: 'Clients',              parent: 'Broker' }],
  ['/broker/commissions',                   { label: 'Commissions',          parent: 'Broker' }],
  ['/broker/deals',                         { label: 'Deals',                parent: 'Broker' }],
  ['/broker/settings',                      { label: 'Settings',             parent: 'Broker' }],
  ['/broker',                               { label: 'Dashboard',            parent: 'Broker' }],

  // ── Developer ───────────────────────────────────────
  ['/developer/projects/',                  { label: 'Project Details',      parent: 'Projects' }],
  ['/developer/projects/new',               { label: 'New Project',          parent: 'Projects' }],
  ['/developer/projects',                   { label: 'Projects',             parent: 'Developer' }],
  ['/developer/inventory/velocity',         { label: 'Sales Velocity',       parent: 'Inventory' }],
  ['/developer/inventory/',                 { label: 'Unit Details',         parent: 'Inventory' }],
  ['/developer/inventory',                  { label: 'Inventory',            parent: 'Developer' }],
  ['/developer/demand/heatmap',             { label: 'Demand Heatmap',       parent: 'Demand' }],
  ['/developer/demand',                     { label: 'Demand Intel',         parent: 'Developer' }],
  ['/developer/analytics',                  { label: 'Analytics',            parent: 'Developer' }],
  ['/developer/marketing',                  { label: 'Marketing',            parent: 'Developer' }],
  ['/developer/pricing',                    { label: 'Pricing',              parent: 'Developer' }],
  ['/developer/feasibility',                { label: 'Feasibility',          parent: 'Developer' }],
  ['/developer/settings',                   { label: 'Settings',             parent: 'Developer' }],
  ['/developer',                            { label: 'Dashboard',            parent: 'Developer' }],

  // ── Admin ───────────────────────────────────────────
  ['/admin/users/',                         { label: 'User Details',         parent: 'Users' }],
  ['/admin/users',                          { label: 'Users',                parent: 'Admin' }],
  ['/admin/security/audit-logs',            { label: 'Audit Logs',           parent: 'Security' }],
  ['/admin/security/rbac',                  { label: 'RBAC',                 parent: 'Security' }],
  ['/admin/security/encryption',            { label: 'Encryption',           parent: 'Security' }],
  ['/admin/security',                       { label: 'Security',             parent: 'Admin' }],
  ['/admin/system/microservices',           { label: 'Microservices',        parent: 'System' }],
  ['/admin/system',                         { label: 'System',               parent: 'Admin' }],
  ['/admin/ai-config',                      { label: 'AI Config',            parent: 'Admin' }],
  ['/admin/api-management',                 { label: 'API Management',       parent: 'Admin' }],
  ['/admin/institutional',                  { label: 'Institutional',        parent: 'Admin' }],
  ['/admin/platform-analytics',             { label: 'Platform Analytics',   parent: 'Admin' }],
  ['/admin/settings',                       { label: 'Settings',             parent: 'Admin' }],
  ['/admin',                                { label: 'Admin Dashboard',      parent: 'Admin' }],
];

function matchRoute(pathname: string): RouteMeta | null {
  for (const [pattern, meta] of ROUTE_MAP) {
    if (pattern.endsWith('/')) {
      if (pathname.startsWith(pattern) || pathname.includes(pattern.slice(0, -1) + '/')) {
        return meta;
      }
    } else if (pathname === pattern || pathname.startsWith(pattern + '/')) {
      return meta;
    }
  }
  return null;
}

/** Breadcrumb rendered in the global topbar left side.
 *  Shows: Parent > Current Page */
export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const meta = matchRoute(pathname);

  if (!meta) return null;

  return (
    <nav className="flex items-center gap-1 min-w-0" aria-label="Breadcrumb">
      {meta.parent && (
        <>
          <span className="text-[12px] text-[var(--fg-muted)] font-medium shrink-0 hidden sm:block">
            {meta.parent}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--fg-muted)] opacity-50 shrink-0 hidden sm:block" strokeWidth={2} />
        </>
      )}
      <span className="text-[13px] font-semibold text-[var(--fg)] truncate">
        {meta.label}
      </span>
    </nav>
  );
}
