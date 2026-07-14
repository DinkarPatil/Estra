'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, CheckCircle2, Circle, FileText,
  Shield, Upload, User, DollarSign, Calendar,
} from 'lucide-react';
import { mockTransactions, type Transaction } from '@/mock-data/transactions';
import { formatCurrency, formatDate } from '@/lib/formatters';

type TransactionStatus = Transaction['status'];
type TransactionStage = Transaction['stage'];

function statusVariant(status: TransactionStatus) {
  switch (status) {
    case 'completed': return 'success';
    case 'in-progress': return 'info';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
  }
}

function docStatusVariant(status: 'pending' | 'signed' | 'uploaded') {
  switch (status) {
    case 'signed': return 'success';
    case 'uploaded': return 'info';
    case 'pending': return 'warning';
  }
}

const STAGES: TransactionStage[] = ['offer', 'due-diligence', 'financing', 'legal', 'closing', 'closed'];
const stageLabel = (s: TransactionStage) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const txn = mockTransactions.find((t) => t.id === id);

  if (!txn) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-[var(--fg-muted)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--fg)]">Transaction Not Found</h2>
          <Link href="/investor/transactions" className="mt-4 text-[#8B7355] hover:underline text-sm">
            Back to Transactions
          </Link>
        </div>
      </PageContainer>
    );
  }

  const currentStageIdx = STAGES.indexOf(txn.stage);

  return (
    <PageContainer>
      <div className="mb-2">
        <Link
          href="/investor/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Transactions
        </Link>
      </div>

      <PageHeader
        title={txn.propertyTitle}
        description={`Transaction ID: ${txn.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(txn.status)}>{txn.status}</Badge>
          </div>
        }
      />

      {/* Stage Stepper */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
        <h2 className="text-sm font-semibold text-[var(--fg)] mb-6">Deal Progress</h2>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {STAGES.map((stage, idx) => {
            const isPast = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isFuture = idx > currentStageIdx;
            return (
              <div key={stage} className="flex items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                      isPast
                        ? 'border-[#8B7355] bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white'
                        : isCurrent
                        ? 'border-[#8B7355] bg-white text-[#8B7355] ring-4 ring-[rgba(139,115,85,0.1)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--fg-muted)]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center whitespace-nowrap font-medium ${
                      isCurrent ? 'text-[#8B7355]' : isFuture ? 'text-[var(--fg-muted)]' : 'text-[var(--fg-secondary)]'
                    }`}
                  >
                    {stageLabel(stage)}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div
                    className={`mt-4 h-0.5 w-10 sm:w-16 mx-1 shrink-0 ${
                      isPast ? 'bg-[#8B7355]' : 'bg-[var(--bg-tertiary)]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-[var(--fg-muted)] mb-1">
            <span>Overall Progress</span>
            <span>{txn.stageProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
            <div
              className="h-2 rounded-full bg-[#8B7355] transition-all"
              style={{ width: `${txn.stageProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Milestones + Escrow */}
        <div className="space-y-6">
          {/* Milestones */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Milestones</h2>
            <div className="space-y-3">
              {txn.milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-[#8B7355] mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--fg-muted)] mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${milestone.completed ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}>
                      {milestone.label}
                    </p>
                    {milestone.date && (
                      <p className="text-xs text-[var(--fg-muted)]">{formatDate(milestone.date)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow Info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Escrow Information</h2>
            <div className="space-y-3">
              {[
                { icon: DollarSign, label: 'Transaction Amount', value: formatCurrency(txn.amount) },
                { icon: Shield, label: 'Escrow Amount', value: formatCurrency(txn.escrowAmount) },
                { icon: Calendar, label: 'Closing Date', value: formatDate(txn.closingDate) },
                { icon: Calendar, label: 'Created At', value: formatDate(txn.createdAt) },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg bg-[var(--bg-secondary)] p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(139,115,85,0.1)] text-[#8B7355] shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--fg-muted)]">{item.label}</p>
                      <p className="text-sm font-semibold text-[var(--fg)]">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Documents + Agent */}
        <div className="space-y-6">
          {/* Documents */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Documents</h2>
            <div className="space-y-3">
              {txn.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(139,115,85,0.1)] text-[#8B7355] shrink-0">
                    {doc.status === 'signed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : doc.status === 'uploaded' ? (
                      <Upload className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{doc.name}</p>
                  </div>
                  <Badge variant={docStatusVariant(doc.status)}>{doc.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Agent Information</h2>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(139,115,85,0.1)] to-[rgba(139,115,85,0.12)] text-[#8B7355] shrink-0">
                <User className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold text-[var(--fg)]">{txn.agentName}</p>
                <p className="text-sm text-[var(--fg-muted)]">Assigned Agent</p>
                <div className="mt-2 flex gap-2">
                  <button className="c-btn-primary px-3 py-1.5 text-xs cursor-pointer">
                    Message
                  </button>
                  <button className="c-btn-secondary px-3 py-1.5 text-xs cursor-pointer">
                    Schedule Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Property Location Card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-3">Property Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--fg-muted)]">Property</span>
                <span className="text-xs font-medium text-[var(--fg)]">{txn.propertyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--fg-muted)]">Location</span>
                <span className="text-xs font-medium text-[var(--fg)]">{txn.propertyLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--fg-muted)]">Transaction ID</span>
                <span className="text-xs font-mono text-[var(--fg-secondary)]">{txn.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
