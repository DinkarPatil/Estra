'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Calendar, CheckCircle, Clock, Send, PhoneCall, X, Eye, FileText, Star } from 'lucide-react';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import type { LeadEventType } from '@/types/lead';

const mockLeads = [
  { id: 'lead-001', name: 'Khalid Al-Rashid', email: 'khalid@email.com', phone: '+971 50 123 4567', location: 'Dubai, UAE', interest: 'Villa', budget: 20000000, budgetCurrency: 'AED', score: 95, status: 'hot', source: 'Direct', createdAt: '2025-01-20' },
  { id: 'lead-002', name: 'Arjun Mehta', email: 'arjun@email.com', phone: '+91 98765 43210', location: 'Mumbai, India', interest: 'Luxury Residential', budget: 50000000, budgetCurrency: 'INR', score: 92, status: 'hot', source: 'Referral', createdAt: '2025-01-15' },
  { id: 'lead-003', name: 'Takeshi Yamada', email: 'takeshi@email.com', phone: '+81 90 1234 5678', location: 'Tokyo, Japan', interest: 'Investment Property', budget: 300000000, budgetCurrency: 'JPY', score: 83, status: 'warm', source: 'Event', createdAt: '2025-01-25' },
  { id: 'lead-004', name: 'Sofia Andersson', email: 'sofia@email.com', phone: '+46 70 123 4567', location: 'Stockholm, Sweden', interest: 'Commercial Office', budget: 2000000, budgetCurrency: 'EUR', score: 78, status: 'warm', source: 'Platform', createdAt: '2025-01-18' },
  { id: 'lead-005', name: 'Emma Fitzgerald', email: 'emma@email.com', phone: '+44 7700 900123', location: 'London, UK', interest: 'Penthouse', budget: 5000000, budgetCurrency: 'GBP', score: 65, status: 'cold', source: 'Web', createdAt: '2025-01-22' },
];

const activityTimeline = [
  { event: 'Lead created', date: '2025-01-15', icon: CheckCircle, color: 'text-[#8B7355]' },
  { event: 'First contact made', date: '2025-01-16', icon: PhoneCall, color: 'text-info' },
  { event: 'Property shortlist sent', date: '2025-01-18', icon: Send, color: 'text-warning' },
  { event: 'Follow-up scheduled', date: '2025-01-22', icon: Clock, color: 'text-[#8B7355]' },
];

function eventMeta(type: LeadEventType): { label: string; Icon: React.ElementType; color: string } {
  switch (type) {
    case 'visit-scheduled': return { label: 'Visit scheduled', Icon: Eye,         color: 'text-emerald-500' };
    case 'created':         return { label: 'Lead created',    Icon: CheckCircle,  color: 'text-[#8B7355]' };
    case 'stage-change':    return { label: 'Stage updated',   Icon: Clock,        color: 'text-info' };
    case 'call':            return { label: 'Call logged',     Icon: PhoneCall,    color: 'text-info' };
    case 'proposal':        return { label: 'Proposal sent',   Icon: Send,         color: 'text-warning' };
    case 'note':            return { label: 'Note added',      Icon: FileText,     color: 'text-[var(--fg-muted)]' };
    case 'marked-as-deal':  return { label: 'Marked as deal',  Icon: Star,         color: 'text-emerald-500' };
    default:                return { label: String(type),      Icon: Clock,        color: 'text-[var(--fg-muted)]' };
  }
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-[#8B7355]';
  if (score >= 70) return 'text-warning';
  return 'text-danger';
}

function getScoreRingColor(score: number) {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getLeadById } = useLeadPipeline();

  // Try pipeline context first (covers investor-created leads), then fall back to mock leads
  const pipelineLead = getLeadById(id);
  const mockLead = mockLeads.find((l) => l.id === id);

  // Build a unified lead object that both sources can satisfy
  const lead = pipelineLead
    ? {
        id: pipelineLead.id,
        name: pipelineLead.investorName,
        email: pipelineLead.investorEmail ?? '—',
        phone: pipelineLead.investorPhone ?? '—',
        location: pipelineLead.propertyLocation,
        interest: pipelineLead.propertyName,
        budget: pipelineLead.investorBudget?.amount ?? 0,
        budgetCurrency: pipelineLead.investorBudget?.currency ?? 'USD',
        score: pipelineLead.aiScore,
        status: pipelineLead.intentLevel === 'high' ? 'hot' : pipelineLead.intentLevel === 'medium' ? 'warm' : 'cold',
        source: pipelineLead.source,
        createdAt: pipelineLead.createdAt.split('T')[0],
      }
    : mockLead;

  const [modal, setModal] = useState<'call' | 'proposal' | 'converted' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Show proper 404 if lead not found in either source
  if (!lead) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm font-semibold text-[var(--fg)]">Lead not found</p>
          <p className="text-xs text-[var(--fg-muted)]">The lead with ID &quot;{id}&quot; does not exist.</p>
          <button
            onClick={() => router.push('/broker/leads')}
            className="rounded-lg bg-[#6F5C46] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer"
          >
            Back to Leads
          </button>
        </div>
      </PageContainer>
    );
  }

  const scoreColor = getScoreColor(lead.score ?? 0);
  const ringColor = getScoreRingColor(lead.score ?? 0);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - ((lead.score ?? 0) / 100) * circumference;

  const aiInsights = [
    `High purchase intent detected — ${lead.name} has viewed 12+ listings in the ${lead.interest} category this month.`,
    `Budget of ${lead.budget.toLocaleString()} ${lead.budgetCurrency} aligns with 8 current active listings. Send curated shortlist within 24 hours for maximum conversion.`,
    `Lead sourced via ${lead.source} — these leads historically convert 2.3x faster. Prioritize personal outreach over automated emails.`,
  ];

  return (
    <PageContainer>
      <PageHeader
        title={lead.name}
        description={lead.email}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { setSubmitted(false); setModal('call'); }} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--bg-secondary)] cursor-pointer">
              <PhoneCall className="h-4 w-4" />
              Schedule Call
            </button>
            <button onClick={() => { setSubmitted(false); setModal('proposal'); }} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--bg-secondary)] cursor-pointer">
              <Send className="h-4 w-4" />
              Send Proposal
            </button>
            <button onClick={() => { setSubmitted(false); setModal('converted'); }} className="c-btn-primary flex items-center gap-2 px-4 py-2 text-sm cursor-pointer">
              <CheckCircle className="h-4 w-4" />
              Mark as Converted
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* AI Score Card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">AI Lead Score</h3>
            <div className="flex items-center gap-6">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
                  <circle
                    cx="56" cy="56" r="40"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56" cy="56" r="40"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`text-3xl font-bold ${scoreColor}`}>{lead.score}</span>
              </div>
              <div>
                <p className="text-sm text-[var(--fg-secondary)]">Score Category</p>
                <p className={`text-lg font-semibold ${scoreColor}`}>
                  {lead.score >= 85 ? 'High Priority' : lead.score >= 70 ? 'Medium Priority' : 'Low Priority'}
                </p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">Based on 14 behavioral signals</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-sm text-[var(--fg)]">{lead.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-sm text-[var(--fg)]">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-sm text-[var(--fg)]">{lead.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-sm text-[var(--fg)]">Created {lead.createdAt}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4">
              <div>
                <p className="text-xs text-[var(--fg-muted)]">Status</p>
                <Badge variant={lead.status === 'hot' ? 'danger' : lead.status === 'warm' ? 'warning' : 'secondary'} className="mt-1 capitalize">
                  {lead.status}
                </Badge>
              </div>
              <div className="ml-6">
                <p className="text-xs text-[var(--fg-muted)]">Source</p>
                <Badge variant="info" className="mt-1">{lead.source}</Badge>
              </div>
            </div>
          </div>

          {/* Interest & Budget */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Purchase Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--fg-secondary)]">Interest</span>
                <span className="text-sm font-medium text-[var(--fg)]">{lead.interest}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--fg-secondary)]">Budget</span>
                <span className="text-sm font-medium text-[var(--fg)]">
                  {lead.budget.toLocaleString()} {lead.budgetCurrency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Activity Timeline</h3>
            <div className="space-y-4">
              {pipelineLead ? (
                pipelineLead.history.map((evt, index) => {
                  const { label, Icon, color } = eventMeta(evt.type);
                  const dateStr = new Date(evt.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  return (
                    <div key={evt.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--fg)]">{evt.message || label}</p>
                        <p className="text-xs text-[var(--fg-muted)]">{dateStr}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                activityTimeline.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--fg)]">{activity.event}</p>
                        <p className="text-xs text-[var(--fg-muted)]">{activity.date}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B7355]">
                <span className="text-xs font-bold text-[#1A1A1A]">AI</span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)]">AI Insights & Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {aiInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#8B7355]" />
                  <p className="text-sm text-[var(--fg-secondary)]">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Action Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModal(null)} className="absolute right-4 top-4 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>

            {!submitted ? (
              <>
                {modal === 'call' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7DF]">
                        <PhoneCall className="h-5 w-5 text-[#6F5C46]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--fg)]">Schedule Call</h3>
                        <p className="text-xs text-[var(--fg-muted)]">with {lead.name}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Date</label>
                        <input type="date" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Time</label>
                        <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]">
                          <option>09:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
                          <option>12:00 PM</option><option>01:00 PM</option><option>02:00 PM</option>
                          <option>03:00 PM</option><option>04:00 PM</option><option>05:00 PM</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Notes (optional)</label>
                        <textarea rows={3} placeholder="Add call agenda or notes..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46] resize-none" />
                      </div>
                      <button onClick={() => setSubmitted(true)} className="w-full rounded-lg bg-[#6F5C46] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer">
                        Schedule Call
                      </button>
                    </div>
                  </>
                )}

                {modal === 'proposal' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7DF]">
                        <Send className="h-5 w-5 text-[#6F5C46]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--fg)]">Send Proposal</h3>
                        <p className="text-xs text-[var(--fg-muted)]">to {lead.name} ({lead.email})</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Proposal Type</label>
                        <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]">
                          <option>Property Shortlist</option>
                          <option>Investment Analysis</option>
                          <option>Pricing Proposal</option>
                          <option>Custom Package</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Subject</label>
                        <input type="text" defaultValue={`${lead.interest} — Curated Selection for ${lead.name}`} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Message</label>
                        <textarea rows={4} defaultValue={`Dear ${lead.name},\n\nPlease find attached our curated selection of ${lead.interest.toLowerCase()} properties matching your requirements.\n\nBest regards`} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46] resize-none" />
                      </div>
                      <button onClick={() => setSubmitted(true)} className="w-full rounded-lg bg-[#6F5C46] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer">
                        Send Proposal
                      </button>
                    </div>
                  </>
                )}

                {modal === 'converted' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4]">
                        <CheckCircle className="h-5 w-5 text-[#10B981]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--fg)]">Mark as Converted</h3>
                        <p className="text-xs text-[var(--fg-muted)]">{lead.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--fg-secondary)] mb-4">
                      This will mark <strong>{lead.name}</strong> as a converted client. The lead will be moved to the &quot;Closed Won&quot; pipeline stage.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Deal Value</label>
                        <input type="text" defaultValue={`${lead.budget.toLocaleString()} ${lead.budgetCurrency}`} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Conversion Notes</label>
                        <textarea rows={3} placeholder="Add notes about the conversion..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46] resize-none" />
                      </div>
                      <button onClick={() => setSubmitted(true)} className="w-full rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] transition-colors cursor-pointer">
                        Confirm Conversion
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4] mb-4">
                  <CheckCircle className="h-7 w-7 text-[#10B981]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--fg)] mb-1">
                  {modal === 'call' && 'Call Scheduled'}
                  {modal === 'proposal' && 'Proposal Sent'}
                  {modal === 'converted' && 'Lead Converted'}
                </h3>
                <p className="text-sm text-[var(--fg-muted)] mb-5">
                  {modal === 'call' && `Your call with ${lead.name} has been scheduled.`}
                  {modal === 'proposal' && `Proposal has been sent to ${lead.email}.`}
                  {modal === 'converted' && `${lead.name} has been marked as a converted client.`}
                </p>
                <button onClick={() => setModal(null)} className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-6 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--border)] transition-colors cursor-pointer">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
