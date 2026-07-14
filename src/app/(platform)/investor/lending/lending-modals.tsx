'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { fmt, fmtFull } from './helpers';
import type { FinancedProperty, LoanApplication, AIRecommendation } from './types';
import {
  Phone, Mail, Calendar, Download, FileText, CheckCircle2, Clock,
  ArrowRight, Upload, User, Shield, DollarSign, TrendingUp,
  MessageSquare, Sparkles, AlertTriangle, Target, ChevronRight,
  BanknoteArrowDown, Unlock, RefreshCw,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   MODAL STATE
   ══════════════════════════════════════════════════════════ */

export type ModalState =
  | { type: 'closed' }
  | { type: 'contact-banker' }
  | { type: 'export' }
  | { type: 'refresh' }
  | { type: 'view-statement'; property: FinancedProperty }
  | { type: 'start-refinance'; property: FinancedProperty }
  | { type: 'track-application'; property: FinancedProperty }
  | { type: 'property-details'; property: FinancedProperty }
  | { type: 'loan-statement'; loan: LoanApplication }
  | { type: 'loan-track'; loan: LoanApplication }
  | { type: 'loan-docs'; loan: LoanApplication }
  | { type: 'loan-rm'; loan: LoanApplication }
  | { type: 'ai-insight'; recommendation: AIRecommendation };

export function getModalSize(state: ModalState): 'sm' | 'md' | 'lg' | 'xl' {
  switch (state.type) {
    case 'refresh': return 'sm';
    case 'contact-banker':
    case 'export':
    case 'loan-rm':
    case 'loan-docs':
      return 'md';
    case 'start-refinance':
    case 'view-statement':
    case 'loan-statement':
    case 'ai-insight':
      return 'lg';
    case 'property-details':
    case 'track-application':
    case 'loan-track':
      return 'lg';
    default: return 'lg';
  }
}

/* ══════════════════════════════════════════════════════════
   MODAL CONTENT RENDERER
   ══════════════════════════════════════════════════════════ */

export function ModalContent({ state, onClose }: { state: ModalState; onClose: () => void }) {
  switch (state.type) {
    case 'closed': return null;
    case 'contact-banker': return <ContactBankerModal />;
    case 'export': return <ExportModal onClose={onClose} />;
    case 'refresh': return <RefreshModal onClose={onClose} />;
    case 'view-statement': return <ViewStatementModal property={state.property} />;
    case 'start-refinance': return <StartRefinanceModal property={state.property} onClose={onClose} />;
    case 'track-application': return <TrackApplicationModal property={state.property} />;
    case 'property-details': return <PropertyDetailsModal property={state.property} />;
    case 'loan-statement': return <LoanStatementModal loan={state.loan} />;
    case 'loan-track': return <LoanTrackModal loan={state.loan} />;
    case 'loan-docs': return <LoanDocsModal loan={state.loan} />;
    case 'loan-rm': return <LoanRMModal loan={state.loan} />;
    case 'ai-insight': return <AIInsightModal recommendation={state.recommendation} />;
  }
}

/* ══════════════════════════════════════════════════════════
   1. CONTACT BANKER
   ══════════════════════════════════════════════════════════ */

function ContactBankerModal() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Your Private Banker</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">Dedicated wealth advisory for your portfolio</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-5">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#8B7355] to-[#D4B15A] flex items-center justify-center text-[20px] font-bold text-white shrink-0">
          SA
        </div>
        <div>
          <p className="text-[15px] font-bold text-[var(--fg)]">Sarah Al-Mansoori</p>
          <p className="text-[12px] text-[var(--fg-muted)]">Senior Private Banker · HSBC Premier</p>
          <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">15+ years in UAE real estate financing</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { icon: Phone, label: '+971 4 123 4567', desc: 'Direct Line', color: '#4ADE80' },
          { icon: Mail, label: 'sarah.m@hsbc.ae', desc: 'Email', color: '#8B7355' },
          { icon: MessageSquare, label: '+971 50 123 4567', desc: 'WhatsApp', color: '#25D366' },
        ].map((contact) => (
          <button
            key={contact.label}
            className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3.5 hover:border-[rgba(139,115,85,0.2)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer text-left"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${contact.color}10`, border: `1px solid ${contact.color}20` }}>
              <contact.icon className="h-4 w-4" style={{ color: contact.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[var(--fg)]">{contact.label}</p>
              <p className="text-[11px] text-[var(--fg-muted)]">{contact.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--fg-muted)]" />
          </button>
        ))}
      </div>

      <button className="c-btn-primary w-full py-3 text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer">
        <Calendar className="h-4 w-4" />
        Schedule a Call
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   2. EXPORT
   ══════════════════════════════════════════════════════════ */

function ExportModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const formats = [
    { key: 'pdf', label: 'PDF Report', desc: 'Full portfolio analysis', icon: FileText, color: '#EF4444' },
    { key: 'excel', label: 'Excel Workbook', desc: 'Detailed data tables', icon: FileText, color: '#22C55E' },
    { key: 'csv', label: 'CSV Export', desc: 'Raw data for analysis', icon: Download, color: '#8B7355' },
  ];

  function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 1500);
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="h-14 w-14 rounded-full bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.15)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-[#4ADE80]" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-[var(--fg)]">Export Ready</p>
          <p className="text-[12px] text-[var(--fg-muted)] mt-1">Your {selected?.toUpperCase()} report has been generated</p>
        </div>
        <button onClick={onClose} className="c-btn-primary px-6 py-2.5 text-[12px] font-semibold cursor-pointer">
          Download Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Export Portfolio Report</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">Choose a format to export your lending data</p>
      </div>

      <div className="grid gap-3">
        {formats.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelected(f.key)}
            className={`w-full flex items-center gap-4 rounded-xl border px-4 py-4 transition-all cursor-pointer text-left ${
              selected === f.key
                ? 'border-[rgba(139,115,85,0.3)] bg-[rgba(139,115,85,0.04)] shadow-[0_0_0_1px_rgba(139,115,85,0.15)]'
                : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border-light)]'
            }`}
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
              <f.icon className="h-4.5 w-4.5" style={{ color: f.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[var(--fg)]">{f.label}</p>
              <p className="text-[11px] text-[var(--fg-muted)]">{f.desc}</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selected === f.key ? 'border-[#8B7355] bg-[#8B7355]' : 'border-[var(--fg-muted)]'
            }`}>
              {selected === f.key && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selected || generating}
        className="c-btn-primary w-full py-3 text-[13px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   3. REFRESH
   ══════════════════════════════════════════════════════════ */

function RefreshModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'confirm' | 'refreshing' | 'done'>('confirm');

  function handleRefresh() {
    setPhase('refreshing');
    setTimeout(() => setPhase('done'), 2000);
  }

  if (phase === 'done') {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="h-12 w-12 rounded-full bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.15)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6 text-[#4ADE80]" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-[var(--fg)]">Data Refreshed</p>
          <p className="text-[12px] text-[var(--fg-muted)] mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <button onClick={onClose} className="c-btn-primary px-5 py-2 text-[12px] font-semibold cursor-pointer">Done</button>
      </div>
    );
  }

  if (phase === 'refreshing') {
    return (
      <div className="text-center py-6 space-y-4">
        <RefreshCw className="h-8 w-8 text-[#8B7355] mx-auto animate-spin" />
        <p className="text-[13px] font-semibold text-[var(--fg)]">Syncing live data...</p>
        <p className="text-[11px] text-[var(--fg-muted)]">Connecting to lender APIs</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-bold text-[var(--fg)]">Refresh Data</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">Pull latest rates, balances & AI scores</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="c-btn-secondary flex-1 py-2.5 text-[12px] font-semibold cursor-pointer">Cancel</button>
        <button onClick={handleRefresh} className="c-btn-primary flex-1 py-2.5 text-[12px] font-semibold cursor-pointer">Refresh Now</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   4. VIEW STATEMENT (Property)
   ══════════════════════════════════════════════════════════ */

function ViewStatementModal({ property: p }: { property: FinancedProperty }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
  const principalPaid = p.originalLoan - p.loanOutstanding;
  const ytdInterest = Math.round(p.loanOutstanding * (p.interestRate / 100) * (4 / 12));
  const ytdPrincipal = Math.round(principalPaid * 0.08);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Loan Statement</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{p.name} · {p.lender}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Outstanding', value: fmtFull(p.loanOutstanding), color: 'var(--fg)' },
          { label: 'YTD Interest', value: fmtFull(ytdInterest), color: '#F59E0B' },
          { label: 'YTD Principal', value: fmtFull(ytdPrincipal), color: '#4ADE80' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-3 text-center">
            <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-medium">{s.label}</p>
            <p className="text-[14px] font-bold mt-1 tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => {
              const interest = Math.round((p.loanOutstanding + i * 2000) * (p.interestRate / 100 / 12));
              const principal = p.monthlyEMI - interest;
              const balance = p.loanOutstanding - principal * (i + 1);
              return (
                <tr key={m} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-3 py-2.5 font-medium text-[var(--fg)]">{m} 2026</td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--fg)]">{fmtFull(p.monthlyEMI)}</td>
                  <td className="px-3 py-2.5 tabular-nums text-[#4ADE80]">{fmtFull(Math.abs(principal))}</td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--fg-secondary)]">{fmtFull(interest)}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-[var(--fg)]">{fmtFull(Math.abs(balance))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="c-btn-primary w-full py-2.5 text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer">
        <Download className="h-3.5 w-3.5" />
        Download Full Statement
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   5. START REFINANCE (Property)
   ══════════════════════════════════════════════════════════ */

function StartRefinanceModal({ property: p, onClose }: { property: FinancedProperty; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const newRate = Math.max(3.5, p.interestRate - 0.85);
  const currentMonthlyInterest = Math.round(p.loanOutstanding * (p.interestRate / 100 / 12));
  const newMonthlyInterest = Math.round(p.loanOutstanding * (newRate / 100 / 12));
  const monthlySaving = currentMonthlyInterest - newMonthlyInterest;
  const annualSaving = monthlySaving * 12;

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="h-14 w-14 rounded-full bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.15)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-[#4ADE80]" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-[var(--fg)]">Refinance Request Submitted</p>
          <p className="text-[12px] text-[var(--fg-muted)] mt-1">Your banker will contact you within 24 hours</p>
        </div>
        <button onClick={onClose} className="c-btn-primary px-6 py-2.5 text-[12px] font-semibold cursor-pointer">Done</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Refinance Analysis</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{p.name} · AI Score: {p.aiRefinanceScore}/100</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-semibold mb-2">Current Terms</p>
          <p className="text-[24px] font-extrabold text-[var(--fg)] tabular-nums">{p.interestRate}%</p>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">{p.lender}</p>
          <p className="text-[11px] text-[var(--fg-muted)]">EMI: {fmtFull(p.monthlyEMI)}/mo</p>
        </div>
        <div className="rounded-xl border border-[rgba(74,222,128,0.15)] bg-[rgba(74,222,128,0.02)] p-4">
          <p className="text-[10px] text-[#4ADE80] uppercase tracking-wide font-semibold mb-2">Proposed Terms</p>
          <p className="text-[24px] font-extrabold text-[#4ADE80] tabular-nums">{newRate.toFixed(2)}%</p>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">ADCB Private Banking</p>
          <p className="text-[11px] text-[var(--fg-muted)]">EMI: {fmtFull(p.monthlyEMI - monthlySaving)}/mo</p>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 space-y-2.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--fg-muted)]">Monthly Saving</span>
          <span className="font-bold text-[#4ADE80]">+{fmtFull(monthlySaving)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--fg-muted)]">Annual Saving</span>
          <span className="font-bold text-[#4ADE80]">+{fmtFull(annualSaving)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--fg-muted)]">Rate Reduction</span>
          <span className="font-bold text-[var(--fg)]">-{(p.interestRate - newRate).toFixed(2)}%</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="c-btn-secondary flex-1 py-2.5 text-[12px] font-semibold cursor-pointer">Cancel</button>
        <button onClick={() => setSubmitted(true)} className="c-btn-primary flex-1 py-2.5 text-[12px] font-semibold cursor-pointer">Submit Refinance Request</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   6. TRACK APPLICATION (Property)
   ══════════════════════════════════════════════════════════ */

function TrackApplicationModal({ property: p }: { property: FinancedProperty }) {
  const stages = ['Application Submitted', 'Documentation', 'Credit Assessment', 'Valuation', 'Final Approval', 'Disbursement'];
  const activeIndex = p.status === 'review' ? 2 : p.status === 'refinance-ready' ? 4 : 5;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Application Status</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{p.name} · {p.lender}</p>
      </div>

      <div className="space-y-0">
        {stages.map((stage, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          const isPending = i > activeIndex;
          return (
            <div key={stage} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? 'bg-[#4ADE80]' : isActive ? 'bg-[#8B7355] ring-4 ring-[rgba(139,115,85,0.15)]' : 'bg-[var(--bg-tertiary)] border border-[var(--border)]'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  ) : isActive ? (
                    <Clock className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-[var(--fg-muted)]" />
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div className={`w-0.5 h-8 ${isCompleted ? 'bg-[#4ADE80]' : 'bg-[var(--border)]'}`} />
                )}
              </div>
              <div className="pb-6 pt-0.5">
                <p className={`text-[13px] font-semibold ${isActive ? 'text-[#8B7355]' : isCompleted ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}>
                  {stage}
                </p>
                {isActive && <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">In progress — estimated 5-7 business days</p>}
                {isCompleted && <p className="text-[11px] text-[#4ADE80] mt-0.5">Completed</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   7. PROPERTY DETAILS
   ══════════════════════════════════════════════════════════ */

function PropertyDetailsModal({ property: p }: { property: FinancedProperty }) {
  const equity = p.marketValue - p.loanOutstanding;
  const repaidPct = Math.round(((p.originalLoan - p.loanOutstanding) / p.originalLoan) * 100);
  const net = p.monthlyRental - p.monthlyEMI;

  const details = [
    { label: 'Market Value', value: fmtFull(p.marketValue) },
    { label: 'Original Loan', value: fmtFull(p.originalLoan) },
    { label: 'Outstanding Balance', value: fmtFull(p.loanOutstanding) },
    { label: 'Net Equity', value: fmtFull(equity) },
    { label: 'Interest Rate', value: `${p.interestRate}% p.a.` },
    { label: 'Loan-to-Value', value: `${p.ltv}%` },
    { label: 'Tenure', value: `${p.tenure / 12} years (${p.tenure} months)` },
    { label: 'Maturity Date', value: p.maturityDate },
    { label: 'Monthly EMI', value: p.monthlyEMI ? fmtFull(p.monthlyEMI) : 'TBD' },
    { label: 'Rental Income', value: p.monthlyRental ? fmtFull(p.monthlyRental) : 'N/A' },
    { label: 'Net Cash Flow', value: p.monthlyRental ? `${net >= 0 ? '+' : ''}${fmtFull(net)}/mo` : 'N/A' },
    { label: 'Repaid', value: `${repaidPct}% of original loan` },
    { label: 'Lender', value: p.lender },
    { label: 'AI Refinance Score', value: p.aiRefinanceScore > 0 ? `${p.aiRefinanceScore}/100` : 'N/A' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[var(--fg)]">{p.name}</h2>
          <Badge variant={p.status === 'active' ? 'success' : p.status === 'refinance-ready' ? 'warning' : 'secondary'}>
            {p.status === 'active' ? 'Active' : p.status === 'refinance-ready' ? 'Refinance Ready' : 'In Review'}
          </Badge>
        </div>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{p.location}</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {details.map((d, i) => (
          <div key={d.label} className={`flex justify-between items-center px-4 py-3 text-[12px] ${i < details.length - 1 ? 'border-b border-[var(--border-light)]' : ''} hover:bg-[var(--bg-secondary)] transition-colors`}>
            <span className="text-[var(--fg-muted)] font-medium">{d.label}</span>
            <span className="font-semibold text-[var(--fg)] tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>

      {p.potentialSaving > 0 && (
        <div className="rounded-xl bg-[rgba(74,222,128,0.04)] border border-[rgba(74,222,128,0.12)] p-4 flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-[#8B7355] shrink-0" />
          <p className="text-[12px] text-[var(--fg-secondary)]">
            AI estimates <span className="font-bold text-[#4ADE80]">{fmtFull(p.potentialSaving)}/mo</span> potential savings through refinancing
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   8. LOAN STATEMENT
   ══════════════════════════════════════════════════════════ */

function LoanStatementModal({ loan }: { loan: LoanApplication }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Loan Details</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{loan.lender} · {loan.property}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Amount', value: fmtFull(loan.requestedAmount) },
          { label: 'Rate', value: `${loan.offeredRate}% p.a.` },
          { label: 'Stage', value: loan.stage },
          { label: 'Status', value: loan.status === 'approved' ? 'Approved' : loan.status === 'in-review' ? 'In Review' : 'Pending' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-3">
            <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-medium">{s.label}</p>
            <p className="text-[14px] font-bold text-[var(--fg)] mt-1 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {loan.status === 'approved' && (
        <div className="rounded-xl border border-[rgba(74,222,128,0.15)] bg-[rgba(74,222,128,0.03)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
            <p className="text-[13px] font-semibold text-[var(--fg)]">Disbursement Complete</p>
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[var(--fg-muted)]">Disbursed Amount</span>
              <span className="font-semibold text-[var(--fg)] tabular-nums">{fmtFull(loan.requestedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--fg-muted)]">Disbursement Date</span>
              <span className="font-semibold text-[var(--fg)]">Mar 15, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--fg-muted)]">First EMI Due</span>
              <span className="font-semibold text-[var(--fg)]">May 1, 2026</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] px-4 py-3">
        <User className="h-4 w-4 text-[var(--fg-muted)]" />
        <div>
          <p className="text-[11px] text-[var(--fg-muted)]">Relationship Manager</p>
          <p className="text-[13px] font-semibold text-[var(--fg)]">{loan.rm}</p>
        </div>
      </div>

      <button className="c-btn-primary w-full py-2.5 text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer">
        <Download className="h-3.5 w-3.5" />
        Download Statement
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   9. LOAN TRACK
   ══════════════════════════════════════════════════════════ */

function LoanTrackModal({ loan }: { loan: LoanApplication }) {
  const stages = ['Application Filed', 'Documentation', 'Credit Assessment', 'Property Valuation', 'Final Approval', 'Disbursement'];
  const stageMap: Record<string, number> = {
    'Documentation': 1,
    'Credit Assessment': 2,
    'Property Valuation': 3,
    'Final Approval': 4,
    'Disbursed': 5,
  };
  const activeIndex = stageMap[loan.stage] ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Application Tracker</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{loan.lender} · {loan.property}</p>
      </div>

      {loan.estimatedApproval !== 'Completed' && (
        <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-[#8B7355]" />
          <p className="text-[12px] text-[var(--fg-secondary)]">
            Estimated approval: <span className="font-bold text-[var(--fg)]">{loan.estimatedApproval}</span>
          </p>
        </div>
      )}

      <div className="space-y-0">
        {stages.map((stage, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={stage} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? 'bg-[#4ADE80]' : isActive ? 'bg-[#8B7355] ring-4 ring-[rgba(139,115,85,0.15)]' : 'bg-[var(--bg-tertiary)] border border-[var(--border)]'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : isActive ? <Clock className="h-3.5 w-3.5 text-white" /> : <div className="h-2 w-2 rounded-full bg-[var(--fg-muted)]" />}
                </div>
                {i < stages.length - 1 && <div className={`w-0.5 h-8 ${isCompleted ? 'bg-[#4ADE80]' : 'bg-[var(--border)]'}`} />}
              </div>
              <div className="pb-6 pt-0.5">
                <p className={`text-[13px] font-semibold ${isActive ? 'text-[#8B7355]' : isCompleted ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}>{stage}</p>
                {isActive && <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Currently in progress</p>}
                {isCompleted && <p className="text-[11px] text-[#4ADE80] mt-0.5">Completed</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   10. LOAN DOCS
   ══════════════════════════════════════════════════════════ */

function LoanDocsModal({ loan }: { loan: LoanApplication }) {
  const docs = [
    { name: 'Emirates ID (Copy)', status: 'uploaded' },
    { name: 'Passport (Copy)', status: 'uploaded' },
    { name: 'Salary Certificate / Income Proof', status: loan.status === 'pending' ? 'pending' : 'uploaded' },
    { name: 'Bank Statements (6 months)', status: loan.status === 'pending' ? 'pending' : 'uploaded' },
    { name: 'Property Valuation Report', status: loan.status === 'approved' ? 'uploaded' : 'pending' },
    { name: 'Title Deed (Copy)', status: loan.status === 'approved' ? 'uploaded' : 'pending' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Required Documents</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{loan.lender} · {loan.property}</p>
      </div>

      <div className="space-y-2.5">
        {docs.map((doc) => (
          <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
              doc.status === 'uploaded' ? 'bg-[rgba(74,222,128,0.08)]' : 'bg-[rgba(245,158,11,0.08)]'
            }`}>
              {doc.status === 'uploaded'
                ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                : <Clock className="h-4 w-4 text-[#F59E0B]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--fg)] truncate">{doc.name}</p>
              <p className="text-[10px] text-[var(--fg-muted)]">{doc.status === 'uploaded' ? 'Uploaded' : 'Required'}</p>
            </div>
            {doc.status === 'pending' && (
              <button className="c-btn-secondary px-3 py-1.5 text-[10px] font-semibold cursor-pointer flex items-center gap-1">
                <Upload className="h-3 w-3" />Upload
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] p-6 text-center">
        <Upload className="h-6 w-6 text-[var(--fg-muted)] mx-auto mb-2" />
        <p className="text-[12px] font-semibold text-[var(--fg-secondary)]">Drop files here or click to upload</p>
        <p className="text-[10px] text-[var(--fg-muted)] mt-1">PDF, JPG, PNG up to 10MB</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   11. LOAN RM (Relationship Manager)
   ══════════════════════════════════════════════════════════ */

function LoanRMModal({ loan }: { loan: LoanApplication }) {
  const initials = loan.rm.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--fg)]">Relationship Manager</h2>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{loan.lender}</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-5">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#8B7355] to-[#D4B15A] flex items-center justify-center text-[18px] font-bold text-white shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-[15px] font-bold text-[var(--fg)]">{loan.rm}</p>
          <p className="text-[12px] text-[var(--fg-muted)]">Mortgage Specialist · {loan.lender}</p>
          <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Handling: {loan.property}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <button className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3.5 hover:border-[rgba(139,115,85,0.2)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer text-left">
          <div className="h-9 w-9 rounded-lg bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.15)] flex items-center justify-center">
            <Phone className="h-4 w-4 text-[#4ADE80]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[var(--fg)]">Call Now</p>
            <p className="text-[11px] text-[var(--fg-muted)]">Direct line available 9am-6pm</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--fg-muted)]" />
        </button>
        <button className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3.5 hover:border-[rgba(139,115,85,0.2)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer text-left">
          <div className="h-9 w-9 rounded-lg bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] flex items-center justify-center">
            <Mail className="h-4 w-4 text-[#8B7355]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[var(--fg)]">Send Email</p>
            <p className="text-[11px] text-[var(--fg-muted)]">Typical reply within 4 hours</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--fg-muted)]" />
        </button>
        <button className="w-full flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3.5 hover:border-[rgba(139,115,85,0.2)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer text-left">
          <div className="h-9 w-9 rounded-lg bg-[rgba(37,211,102,0.08)] border border-[rgba(37,211,102,0.15)] flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-[#25D366]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[var(--fg)]">WhatsApp</p>
            <p className="text-[11px] text-[var(--fg-muted)]">Quick message about {loan.property}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--fg-muted)]" />
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <textarea
          placeholder={`Message ${loan.rm.split(' ')[0]} about your application...`}
          rows={3}
          className="w-full bg-[var(--card-bg)] px-4 py-3 text-[12px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] resize-none focus:outline-none"
        />
        <div className="flex justify-end px-3 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-light)]">
          <button className="c-btn-primary px-4 py-1.5 text-[11px] font-semibold cursor-pointer">Send Message</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   12. AI INSIGHT DETAIL
   ══════════════════════════════════════════════════════════ */

function AIInsightModal({ recommendation: rec }: { recommendation: AIRecommendation }) {
  const typeLabels: Record<string, string> = {
    refinance: 'Refinance Opportunity',
    leverage: 'Leverage Optimization',
    optimize: 'Portfolio Optimization',
    alert: 'Risk Alert',
  };

  const typeIcons: Record<string, typeof BanknoteArrowDown> = {
    refinance: BanknoteArrowDown,
    leverage: Unlock,
    optimize: Target,
    alert: AlertTriangle,
  };

  const TypeIcon = typeIcons[rec.type] ?? Sparkles;

  const actionSteps: Record<string, string[]> = {
    'rec-1': ['Contact ADCB Private Banking for rate quote', 'Provide current loan statement from Standard Chartered', 'Compare total cost including fees', 'Submit refinance application if net positive'],
    'rec-2': ['Request equity release assessment from Emirates NBD', 'Identify target acquisition under ₹1.5M', 'Run yield analysis on new acquisition', 'Structure drawdown to maintain LTV below 60%'],
    'rec-3': ['Set up ₹3,000 monthly overpayment with HSBC', 'Choose principal-only overpayment option', 'Review impact quarterly', 'Consider lump-sum if bonus received'],
    'rec-4': ['Contact HSBC Premier before May 23, 2026', 'Request rate lock extension (30-60 days)', 'Compare current lock vs market rates', 'Lock in if spread is favorable'],
    'rec-5': ['Reduce revolving credit utilization to under 30%', 'Pay off any small outstanding balances', 'Request credit report from Al Etihad', 'Re-apply for rate review after 60 days'],
  };

  const steps = actionSteps[rec.id] ?? ['Contact your advisor for next steps'];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{
          background: rec.priority === 'high' ? 'rgba(74,222,128,0.08)' : rec.priority === 'medium' ? 'rgba(139,115,85,0.08)' : 'rgba(107,114,128,0.08)',
          border: `1px solid ${rec.priority === 'high' ? 'rgba(74,222,128,0.15)' : rec.priority === 'medium' ? 'rgba(139,115,85,0.15)' : 'rgba(107,114,128,0.12)'}`,
        }}>
          <TypeIcon className="h-5 w-5" style={{ color: rec.priority === 'high' ? '#4ADE80' : rec.priority === 'medium' ? '#8B7355' : 'var(--fg-muted)' }} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">{typeLabels[rec.type]}</p>
            <Badge variant={rec.priority === 'high' ? 'success' : rec.priority === 'medium' ? 'default' : 'secondary'}>{rec.priority}</Badge>
          </div>
          <h2 className="text-[18px] font-bold text-[var(--fg)]">{rec.title}</h2>
        </div>
      </div>

      <p className="text-[13px] text-[var(--fg-secondary)] leading-[1.7]">{rec.description}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 text-center">
          <DollarSign className="h-5 w-5 text-[#4ADE80] mx-auto mb-1.5" />
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-medium">Financial Impact</p>
          <p className="text-[16px] font-extrabold text-[#4ADE80] mt-1">{rec.impact}</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 text-center">
          <Shield className="h-5 w-5 text-[var(--fg-muted)] mx-auto mb-1.5" />
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-medium">AI Confidence</p>
          <p className="text-[16px] font-extrabold text-[var(--fg)] mt-1">{rec.confidence}%</p>
        </div>
      </div>

      <div>
        <p className="text-[12px] font-bold text-[var(--fg)] mb-3">Recommended Action Plan</p>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="h-5 w-5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[var(--fg-muted)]">{i + 1}</span>
              </div>
              <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="c-btn-primary w-full py-3 text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer">
        <ArrowRight className="h-4 w-4" />
        Take Action Now
      </button>
    </div>
  );
}
