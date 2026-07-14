'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { useProperty } from '@/hooks/use-properties';
import { Shield, CheckCircle, AlertTriangle, XCircle, FileText, Calculator } from 'lucide-react';

const COUNTRY_RULES: Record<string, { ownership: string; restrictions: string; process: string; stampDuty: string }> = {
  SG: { ownership: 'Foreign ownership allowed for condo/apartments', restrictions: 'Additional Buyer Stamp Duty (ABSD) of 60% for foreigners', process: '8-12 weeks typical closing', stampDuty: '4% base + 60% ABSD for foreigners' },
  AE: { ownership: 'Freehold in designated areas for all nationalities', restrictions: 'None in freehold zones', process: '4-6 weeks typical closing', stampDuty: '4% Dubai Land Department fee' },
  GB: { ownership: 'Foreign ownership fully permitted', restrictions: 'Additional 2% Stamp Duty surcharge for non-residents', process: '8-16 weeks typical closing', stampDuty: '2-12% SDLT + 2% non-resident surcharge' },
  US: { ownership: 'Foreign ownership permitted in most states', restrictions: 'FIRPTA tax withholding on sale (15%)', process: '30-60 days typical closing', stampDuty: 'Transfer tax varies by state (0.1–2%)' },
};

const CHECKS = [
  { label: 'Title Verification', status: 'passed', detail: 'Clean title, no liens or encumbrances' },
  { label: 'AML Screening', status: 'passed', detail: 'Seller cleared all sanctions checks' },
  { label: 'Developer Credibility', status: 'passed', detail: 'AAA rated developer, 15 years track record' },
  { label: 'Legal Disputes', status: 'warning', detail: '1 minor dispute resolved in 2021' },
  { label: 'Building Permits', status: 'passed', detail: 'All permits in order' },
  { label: 'Ownership Docs', status: 'pending', detail: 'Awaiting seller documents' },
];

export default function LegalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { property, loading, error } = useProperty(id);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-sm text-[var(--fg-muted)]">Loading property...</div>
      </PageContainer>
    );
  }
  if (error || !property) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <p className="text-[var(--fg)] font-medium">Couldn&apos;t load property</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">{error || 'Not found'}</p>
        </div>
      </PageContainer>
    );
  }

  const countryCode = property.location.countryCode;
  const rules = COUNTRY_RULES[countryCode] || COUNTRY_RULES['AE'];

  const stampDutyEst = property.price.amount * 0.04;
  const legalFeeEst = property.price.amount * 0.005;

  return (
    <PageContainer>
      <PageHeader
        title="Legal & Compliance"
        description={`${property.location.country} — ${property.title}`}
        actions={<button onClick={() => router.back()} className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)]">← Back</button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Compliance Score" value="84/100" icon={Shield} iconColor="text-emerald-500" />
        <StatCard title="Est. Stamp Duty" value={`₹${(stampDutyEst / 1000).toFixed(0)}K`} icon={FileText} iconColor="text-amber-500" />
        <StatCard title="Est. Legal Fees" value={`₹${(legalFeeEst / 1000).toFixed(0)}K`} icon={Calculator} iconColor="text-stone-500" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Compliance checks */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
          <h3 className="font-semibold text-[var(--fg)] mb-4">Compliance Checks</h3>
          <div className="space-y-3">
            {CHECKS.map(({ label, status, detail }) => (
              <div key={label} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3">
                {status === 'passed' ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> : status === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-[var(--fg-muted)] shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-medium text-[var(--fg)]">{label}</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country rules */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
            <h3 className="font-semibold text-[var(--fg)] mb-4">Ownership Rules — {property.location.country}</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Ownership', rules.ownership],
                ['Restrictions', rules.restrictions],
                ['Closing Process', rules.process],
                ['Stamp Duty', rules.stampDuty],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[var(--bg-secondary)] p-3">
                  <p className="text-xs text-[var(--fg-muted)] mb-1">{label}</p>
                  <p className="text-[var(--fg-secondary)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
            <h3 className="font-semibold text-[var(--fg)] mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Tax Calculator
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--fg-secondary)]">Purchase Price</span><span className="font-medium text-[var(--fg)]">{property.price.currency} {(property.price.amount / 1000000).toFixed(2)}M</span></div>
              <div className="flex justify-between"><span className="text-[var(--fg-secondary)]">Est. Stamp Duty (4%)</span><span className="text-amber-600">{property.price.currency} {(stampDutyEst / 1000).toFixed(0)}K</span></div>
              <div className="flex justify-between"><span className="text-[var(--fg-secondary)]">Legal Fees (0.5%)</span><span className="text-amber-600">{property.price.currency} {(legalFeeEst / 1000).toFixed(0)}K</span></div>
              <div className="border-t border-[var(--border)] pt-2 flex justify-between font-semibold"><span className="text-[var(--fg)]">Total Cost</span><span className="text-[var(--fg)]">{property.price.currency} {((property.price.amount + stampDutyEst + legalFeeEst) / 1000000).toFixed(2)}M</span></div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
