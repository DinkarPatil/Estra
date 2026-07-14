// @ts-nocheck
'use client';
import { use, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Gavel, CheckCircle, MessageSquare, Send, ArrowLeft, Star, Pencil,
  TrendingUp, TrendingDown, Zap, Clock, Eye, Download, Bell, ChevronDown, Check,
  Trophy, Target, Sparkles, MapPin, Info, SlidersHorizontal, Building2,
} from 'lucide-react';
import { mockProperties } from '@/mock-data/properties';
import { formatCurrency } from '@/lib/formatters';
import { useNegotiation } from '@/lib/negotiations-store';
import { useAuth } from '@/contexts/auth-context';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import { apiPropertyService } from '@/services';
import { adaptBackendProperty } from '@/services/api/property.api';
import type { Property } from '@/types/property';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const BROKER = {
  name: 'Rania Al-Masri',
  title: 'Senior Investment Broker',
  rating: 4.9,
  deals: 134,
  initials: 'RA',
};

type AiMessage = { role: 'ai' | 'user'; text: string; time: string };

const AI_SEED: AiMessage[] = [
  {
    role: 'ai',
    text: "I've analyzed this property's market position. The listing price is 4.2% above the 90-day area median. Comparable sales suggest a fair value range of ±8%.",
    time: '9:41 AM',
  },
  {
    role: 'ai',
    text: 'The seller has reduced price twice in 60 days — a strong motivation signal. I recommend opening at 8% below asking with a 30-day closing timeline.',
    time: '9:42 AM',
  },
];

const OFFER_STRATEGIES = [
  {
    key: 'aggressive',
    label: 'Aggressive',
    desc: 'Maximum leverage',
    insight: '88% of ask',
    probability: '52%',
    probabilityLabel: 'acceptance',
    pct: 0.88,
    color: '#A0845C',
    gradFrom: '#8B7355',
    gradTo: '#A0845C',
    icon: Zap,
  },
  {
    key: 'balanced',
    label: 'Balanced',
    desc: 'AI recommended',
    insight: '92% of ask',
    probability: '78%',
    probabilityLabel: 'acceptance',
    pct: 0.92,
    color: '#6F5C46',
    gradFrom: '#6F5C46',
    gradTo: '#8B7355',
    icon: Target,
    recommended: true,
  },
  {
    key: 'strong',
    label: 'Strong Close',
    desc: 'Fastest close',
    insight: '96% of ask',
    probability: '91%',
    probabilityLabel: 'acceptance',
    pct: 0.96,
    color: '#4A3C2E',
    gradFrom: '#5A4A38',
    gradTo: '#6F5C46',
    icon: Trophy,
  },
] as const;

const TIMELINE_OPTIONS = [
  { value: '7',      label: '7 Days',  note: 'Very fast close' },
  { value: '14',     label: '14 Days', note: 'Motivated close' },
  { value: '30',     label: '30 Days', note: 'Standard' },
  { value: '45',     label: '45 Days', note: 'Comfortable' },
  { value: '60',     label: '60 Days', note: 'Flexible' },
  { value: 'custom', label: 'Custom',  note: 'Enter manually' },
] as const;

const PRICE_CHIPS = [
  { label: '-5%',      pct: -0.05 },
  { label: '-8%',      pct: -0.08 },
  { label: '-12%',     pct: -0.12 },
  { label: 'Match AI', pct: -0.04 },
];

const ROTATING_INSIGHTS = [
  'Seller reduced price twice in 60 days — strong motivation signal.',
  'Opening at 8% below asking gives the strongest negotiation position.',
  'Cash offer + 30-day close increases acceptance probability by 22%.',
  'Area median up 4.2% in 90 days — market timing favors the buyer.',
  'Comparable sales suggest fair value range of ±8% from asking.',
];

const AI_QUICK_CHIPS = [
  'What if I offer 5% less?',
  'Best negotiation strategy?',
  'Market trend here?',
  'How motivated is the seller?',
];

type OfferStatus  = 'idle' | 'reviewing';
type StrategyKey  = 'aggressive' | 'balanced' | 'strong';
type TermsKey     = 'cash' | 'mortgage' | 'flexible';
type TimelineValue = '7' | '14' | '30' | '45' | '60' | 'custom';

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────── */
function StepBadge({ n }: { n: string }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #8B7355, #6F5C46)',
      color: 'white', fontSize: '11px', fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(139,115,85,0.35)',
    }}>{n}</div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: 'var(--fg-muted)',
    }}>{children}</span>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function NegotiatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const dealId   = id;
  const { state, sendMessage, update, editMessage } = useNegotiation(dealId);
  const { user } = useAuth();
  const { leads: pipelineLeads, createLead, logAction, updateLeadStage } = useLeadPipeline();

  /* ── Load the real property (API or mock fallback) ── */
  const [property, setProperty] = useState<Property>(
    () => mockProperties.find(p => p.id === id) ?? mockProperties[0],
  );
  const [propLoading, setPropLoading] = useState(!mockProperties.find(p => p.id === id));

  useEffect(() => {
    // If the id matches a mock entry directly, no API call needed
    if (mockProperties.find(p => p.id === id)) return;
    let cancelled = false;
    setPropLoading(true);
    apiPropertyService
      .getDetail(id)
      .then((detail) => {
        if (!cancelled) {
          setProperty(adaptBackendProperty(detail));
          setPropLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setPropLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  /* Chat */
  const [aiMessages,  setAiMessages]  = useState<AiMessage[]>(AI_SEED);
  const [aiInput,     setAiInput]     = useState('');
  const [aiLoading,   setAiLoading]   = useState(false);
  const [brokerInput, setBrokerInput] = useState('');
  // Auto-open the chat panel if there's already stored negotiation data
  // (i.e. messages have been exchanged before). Stays closed on a fresh visit.
  const [chatOpen, setChatOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(`estra_neg_${id}`);
      return !!raw;
    } catch { return false; }
  });

  /* Offer */
  const [offerAmount,      setOfferAmount]      = useState(property.price.amount * 0.92);
  const [offerBtnBusy,     setOfferBtnBusy]     = useState(false);
  const [offerStatus,      setOfferStatus]      = useState<OfferStatus>('idle');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>('balanced');
  const [selectedTerms,    setSelectedTerms]    = useState<TermsKey>('cash');
  const [closingTimeline,  setClosingTimeline]  = useState<TimelineValue>('30');
  const [contingencyFree,  setContingencyFree]  = useState(false);
  const [showTimeline,     setShowTimeline]     = useState(false);
  const [showAdvanced,     setShowAdvanced]     = useState(false);
  const [brochureLoading,  setBrochureLoading]  = useState(false);

  /* Toast */
  const [toast,   setToast]   = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* Rotating AI insights */
  const [insightIdx, setInsightIdx] = useState(0);
  const [insightVisible, setInsightVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setInsightVisible(false);
      setTimeout(() => {
        setInsightIdx(i => (i + 1) % ROTATING_INSIGHTS.length);
        setInsightVisible(true);
      }, 350);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  /* Editing */
  const [editMessageId, setEditMessageId] = useState<number | null>(null);
  const [editText,      setEditText]      = useState('');

  /* Refs */
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const timelineRef   = useRef<HTMLDivElement>(null);

  /* Derived */
  const fairValue      = property.price.amount * 0.96;
  const suggestedOffer = property.price.amount * 0.92;
  const pctVsAsking    = ((offerAmount / property.price.amount - 1) * 100).toFixed(1);
  const dealScoreLabel = state.dealScore >= 80 ? 'Strong Deal' : state.dealScore >= 65 ? 'Good Deal' : 'Moderate';
  const selectedTL     = TIMELINE_OPTIONS.find(o => o.value === closingTimeline)?.label ?? '30 Days';
  const heroImage      = property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop&q=80';
  const currSymbol     = property.price.currency === 'AED' ? 'AED '
    : property.price.currency === 'GBP' ? '£'
    : property.price.currency === 'INR' ? '₹'
    : '$';
  const amtLocale      = property.price.currency === 'INR' ? 'en-IN' : 'en-US';
  const fmtAmt         = (n: number) => Math.round(n).toLocaleString(amtLocale);
  const sliderMin      = Math.round(property.price.amount * 0.70);
  const sliderMax      = Math.round(property.price.amount * 1.05);
  const sliderStep     = Math.max(1000, Math.round(property.price.amount * 0.001));
  const sliderPct      = ((offerAmount - sliderMin) / (sliderMax - sliderMin)) * 100;
  const activeSt       = OFFER_STRATEGIES.find(s => s.key === selectedStrategy)!;

  /* Outside-click: timeline */
  useEffect(() => {
    if (!showTimeline) return;
    const h = (e: MouseEvent) => {
      if (timelineRef.current && !timelineRef.current.contains(e.target as Node))
        setShowTimeline(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showTimeline]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.messages]);

  // Auto-open the chat panel whenever the broker sends a new message
  // (handles real-time storage-event sync from broker's NegotiationDrawer)
  const msgCountRef = useRef(state.messages.length);
  useEffect(() => {
    const count = state.messages.length;
    if (count > msgCountRef.current) {
      const newMsgs = state.messages.slice(msgCountRef.current);
      if (newMsgs.some(m => m.sender === 'Broker')) setChatOpen(true);
    }
    msgCountRef.current = count;
  }, [state.messages]);

  const showToast = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* Handlers */
  const applyStrategy = (key: StrategyKey) => {
    const s = OFFER_STRATEGIES.find(s => s.key === key)!;
    setSelectedStrategy(key);
    setOfferAmount(Math.round(property.price.amount * s.pct));
    showToast(`${s.label} strategy applied`, 'info');
  };

  const applyChip = (pct: number) => setOfferAmount(Math.round(property.price.amount * (1 + pct)));

  const applyAiSuggestion = () => {
    setOfferAmount(Math.round(suggestedOffer));
    setSelectedStrategy('balanced');
    setSelectedTerms('cash');
    setClosingTimeline('30');
    showToast('AI suggestion applied', 'info');
  };

  const sendBrokerMessage = useCallback(() => {
    const text = brokerInput.trim();
    if (!text) return;
    // sendMessage stores under estra_neg_${id} (property UUID) — the broker's
    // NegotiationDrawer now uses the same key, so both sides share the thread.
    sendMessage(text, 'Investor');
    setBrokerInput('');
    // Mirror the message in LeadPipelineContext and ensure lead is in 'negotiation'
    // stage so the deal appears in the broker's Negotiations page.
    const existingLead = pipelineLeads.find((l) => l.propertyId === id);
    if (existingLead) {
      if (existingLead.stage !== 'negotiation') {
        updateLeadStage(existingLead.id, 'negotiation');
      }
      logAction(existingLead.id, 'note', `Investor: ${text}`);
    } else {
      const newLead = createLead({
        propertyId: id,
        propertyName: property.title,
        propertyLocation: `${property.location.city}, ${property.location.country}`,
        propertyPrice: property.price,
        investorId: user?.id ?? 'investor',
        investorName: user?.name ?? 'Investor',
        investorEmail: user?.email,
        intentLevel: 'medium',
        source: 'contact-broker',
      });
      updateLeadStage(newLead.id, 'negotiation');
      logAction(newLead.id, 'note', `Investor: ${text}`);
    }
  }, [brokerInput, sendMessage, pipelineLeads, id, property, user, createLead, logAction, updateLeadStage]);

  const sendAiMessage = useCallback(() => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAiMessages(prev => [...prev, { role: 'user', text, time: now }]);
    setAiLoading(true);
    setTimeout(() => {
      setAiMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: 'Based on comparable transactions and seller motivation signals, this approach has a 68% success probability. Consider adding a financing contingency waiver to strengthen the offer.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setAiLoading(false);
    }, 1200);
  }, [aiInput, aiLoading]);

  const submitOffer = () => {
    if (offerBtnBusy || offerStatus === 'reviewing' || offerAmount <= 0) return;
    const formatted = `${currSymbol}${fmtAmt(offerAmount)}`;
    setOfferBtnBusy(true);
    sendMessage(
      `Formal offer: ${formatted} (${pctVsAsking}% vs asking). Terms: ${selectedTerms}, ${selectedTL} close${contingencyFree ? ', contingency-free' : ''}.`,
      'Investor',
    );
    update({ currentOffer: offerAmount, status: 'active' });

    // Log offer to LeadPipelineContext so broker sees it
    const existingLead = pipelineLeads.find((l) => l.propertyId === id);
    if (existingLead) {
      updateLeadStage(existingLead.id, 'negotiation');
      logAction(existingLead.id, 'proposal',
        `Formal offer: ${formatted} (${pctVsAsking}% vs asking). Terms: ${selectedTerms}, ${selectedTL} close${contingencyFree ? ', contingency-free' : ''}.`);
    } else {
      const newLead = createLead({
        propertyId: id,
        propertyName: property.title,
        propertyLocation: `${property.location.city}, ${property.location.country}`,
        propertyPrice: property.price,
        investorId: user?.id ?? 'investor',
        investorName: user?.name ?? 'Investor',
        investorEmail: user?.email,
        intentLevel: 'high',
        source: 'invest-now',
      });
      updateLeadStage(newLead.id, 'negotiation');
      logAction(newLead.id, 'proposal',
        `Formal offer: ${formatted} (${pctVsAsking}% vs asking). Terms: ${selectedTerms}, ${selectedTL} close${contingencyFree ? ', contingency-free' : ''}.`);
    }

    setTimeout(() => {
      setOfferStatus('reviewing');
      setOfferBtnBusy(false);
      setChatOpen(true);
      showToast('Offer submitted — broker notified!');
    }, 600);
  };

  const downloadBrochure = () => {
    setBrochureLoading(true);
    setTimeout(() => {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${property.title} — Glimmora Brochure</title>
<style>body{font-family:system-ui,sans-serif;color:#2A211B;margin:0;background:#fff;}
.hero{width:100%;height:280px;object-fit:cover;}
.body{padding:40px;max-width:680px;margin:0 auto;}
h1{font-size:26px;font-weight:800;color:#6F5C46;margin:0 0 6px;}
.sub{font-size:13px;color:#9A8B7E;margin-bottom:28px;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;}
.tile{padding:14px;border-radius:10px;border:1px solid #e8dfd5;background:#faf8f5;}
.tile-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#A89478;margin-bottom:4px;letter-spacing:.06em;}
.tile-val{font-size:16px;font-weight:800;color:#6F5C46;}
p{font-size:13px;color:#6F5C46;line-height:1.7;}
.footer{margin-top:40px;font-size:10px;color:#B0A090;border-top:1px solid #e8dfd5;padding-top:12px;}
</style></head><body>
<img src="${heroImage}" class="hero" alt="${property.title}" />
<div class="body">
<h1>${property.title}</h1>
<p class="sub">${property.location.city}, ${property.location.country} · ${property.developer || 'Premium Developer'}</p>
<div class="grid">
  <div class="tile"><div class="tile-label">Asking Price</div><div class="tile-val">${formatCurrency(property.price)}</div></div>
  <div class="tile"><div class="tile-label">Rental Yield</div><div class="tile-val">${property.rentalYield}% p.a.</div></div>
  <div class="tile"><div class="tile-label">Bedrooms</div><div class="tile-val">${property.bedrooms ?? '—'} BR</div></div>
  <div class="tile"><div class="tile-label">Area</div><div class="tile-val">${property.area?.value?.toLocaleString() ?? '—'} sqft</div></div>
</div>
<p>This premium investment opportunity offers exceptional value. Backed by Glimmora's AI analysis with a deal score reflecting strong fundamentals, favorable yield metrics, and long-term capital appreciation potential.</p>
<p class="footer">Glimmora Platform · Confidential · For authorized investors only · ${new Date().toLocaleDateString()}</p>
</div></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${property.title.replace(/\s+/g, '-')}-brochure.html`;
      a.click();
      URL.revokeObjectURL(url);
      setBrochureLoading(false);
      showToast('Brochure downloaded');
    }, 900);
  };

  const startEdit  = (id: number, text: string) => { setEditMessageId(id); setEditText(text); };
  const cancelEdit = () => { setEditMessageId(null); setEditText(''); };
  const saveEdit   = (id: number) => {
    if (editText.trim()) editMessage(id, editText.trim());
    setEditMessageId(null);
    setEditText('');
  };

  /* ─── Shared style tokens ─── */
  const shadow  = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)';
  const shadowHover = '0 2px 8px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.10)';
  const accentGlow  = '0 0 0 3px rgba(139,115,85,0.16)';

  const card: React.CSSProperties = {
    background: 'var(--card-bg)',
    borderRadius: 18,
    border: '1px solid var(--border)',
    boxShadow: shadow,
    padding: '20px',
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="dr-root">

      {/* ── Toast — rendered via portal so it escapes the z-10 stacking context ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0,   x: '-50%' }}
              exit={  { opacity: 0, y: -12,  x: '-50%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: 20, left: '50%', zIndex: 99999,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 99,
                background: 'var(--card-bg)',
                border: '1px solid rgba(139,115,85,0.22)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                fontSize: '12.5px', fontWeight: 600, color: 'var(--fg)',
                whiteSpace: 'nowrap',
              }}
            >
              <CheckCircle style={{ width: 14, height: 14, color: '#8B7355', flexShrink: 0 }} />
              <span>{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ════════════════════════ HEADER ════════════════════════ */}
      <div className="dr-page-header">
        <button type="button" onClick={() => router.back()} className="dr-back-btn">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline text-[12px]">Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--fg)', margin: 0, letterSpacing: '-0.01em' }}>Deal Room</h1>
          <div style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0 }} className="hidden sm:block" />
          <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0 }} className="hidden sm:block">
            Submit your offer in 3 steps
          </p>
          {offerStatus === 'reviewing' && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '10.5px', fontWeight: 700, color: '#8B7355',
              padding: '3px 10px', borderRadius: 99,
              background: 'rgba(139,115,85,0.10)',
              border: '1px solid rgba(139,115,85,0.20)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B7355' }} className="animate-pulse" />
              Offer Under Review
            </span>
          )}
        </div>

        <div className="dr-header-actions">
          <button type="button" className="dr-header-action" title="Notifications">
            <Bell className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ════════════════════════ GRID ════════════════════════ */}
      <div className="dr-grid">

        {/* ══════════════════════════════════════════════════════
            LEFT — Property Card
        ══════════════════════════════════════════════════════ */}
        <aside className="dr-left-panel">
          <div className="dr-sticky-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Hero with gradient overlay */}
            <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3', position: 'relative', boxShadow: shadow }}>
              <img
                src={heroImage}
                alt={property.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80'; }}
              />
              {/* Gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)' }} />
              {/* Live pill */}
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 99, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A0845C' }} className="animate-pulse" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>LIVE</span>
              </div>
              {/* Property info at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
                <p style={{ fontSize: '13.5px', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{property.title}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.80)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin style={{ width: 10, height: 10, flexShrink: 0 }} />
                  {property.location.city}, {property.location.country}
                  {property.developer && <> · {property.developer}</>}
                </p>
              </div>
            </div>

            {/* 3 key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                <SectionLabel>Asking Price</SectionLabel>
                <p style={{ fontSize: '16px', fontWeight: 900, color: 'var(--fg)', margin: '3px 0 0', letterSpacing: '-0.01em' }}>{formatCurrency(property.price)}</p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.14)' }}>
                <SectionLabel>AI Fair Value</SectionLabel>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#8B7355', margin: '3px 0 0' }}>{formatCurrency({ ...property.price, amount: fairValue })}</p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.14)' }}>
                <SectionLabel>Deal Score</SectionLabel>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#8B7355', margin: '3px 0 0' }}>{state.dealScore}<span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)' }}>/100</span></p>
              </div>
            </div>

            {/* CTA buttons */}
            <button
              type="button"
              onClick={() => router.push(`/investor/properties/${id}`)}
              style={{
                width: '100%', padding: '9px 0', borderRadius: 11,
                border: '1px solid var(--border)', background: 'var(--card-bg)',
                color: 'var(--fg)', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: shadow, transition: 'box-shadow 0.18s',
              }}
            >
              <Eye style={{ width: 13, height: 13 }} />
              View Full Details
            </button>

            <button
              type="button"
              onClick={downloadBrochure}
              disabled={brochureLoading}
              style={{
                width: '100%', padding: '9px 0', borderRadius: 11,
                border: '1px solid var(--border)', background: 'var(--card-bg)',
                color: 'var(--fg)', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: shadow, transition: 'box-shadow 0.18s',
                opacity: brochureLoading ? 0.7 : 1,
              }}
            >
              {brochureLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  style={{ width: 13, height: 13, border: '2px solid #8B7355', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : (
                <Download style={{ width: 13, height: 13 }} />
              )}
              {brochureLoading ? 'Generating…' : 'Download Brochure'}
            </button>

          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════
            CENTER — 3-Step Guided Flow
        ══════════════════════════════════════════════════════ */}
        <main className="dr-center-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Step progress bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 18px', borderRadius: 14,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            boxShadow: shadow,
          }}>
            {[{ n: '1', label: 'Choose Strategy' }, { n: '2', label: 'Adjust Offer' }, { n: '3', label: 'Confirm' }].map(({ n, label }, i) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #8B7355, #6F5C46)',
                    color: 'white', fontSize: '11px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(139,115,85,0.30)',
                  }}>{n}</div>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 10px' }} />}
              </div>
            ))}
          </div>

          {/* ────────────────────────────────────────────
              STEP 1 — Strategy Selection
          ──────────────────────────────────────────── */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <StepBadge n="1" />
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fg)', margin: 0, letterSpacing: '-0.01em' }}>Choose Your Strategy</h3>
                <p style={{ fontSize: '11px', color: 'var(--fg-muted)', margin: '1px 0 0' }}>
                  AI recommends <strong style={{ color: '#8B7355' }}>Balanced</strong> based on seller signals &amp; area data.
                </p>
              </div>
            </div>

            {/* Pill selector */}
            <div style={{
              display: 'flex', gap: 5, padding: '4px',
              borderRadius: 13, background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', marginBottom: 14,
            }}>
              {OFFER_STRATEGIES.map(s => {
                const isActive = selectedStrategy === s.key;
                return (
                  <motion.button
                    key={s.key}
                    type="button"
                    onClick={() => applyStrategy(s.key as StrategyKey)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '8px 10px', borderRadius: 9,
                      background: isActive ? `linear-gradient(135deg, ${s.gradFrom}, ${s.gradTo})` : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: isActive ? 'white' : 'var(--fg-muted)',
                      fontSize: '11.5px', fontWeight: isActive ? 700 : 500,
                      boxShadow: isActive ? `0 2px 10px ${s.color}45` : 'none',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <s.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {s.label}
                    {'recommended' in s && s.recommended && (
                      <span style={{
                        fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: 99,
                        background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(139,115,85,0.12)',
                        color: isActive ? 'white' : '#8B7355', letterSpacing: '0.04em', flexShrink: 0,
                      }}>AI</span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Detail card — animates between strategies */}
            <AnimatePresence mode="wait">
              {OFFER_STRATEGIES.filter(s => s.key === selectedStrategy).map(s => {
                const savings     = Math.round(property.price.amount * (1 - s.pct));
                const savingsPct  = Math.min(98, Math.round((1 - s.pct) * 100 * 8));
                const certaintyPct = s.key === 'aggressive' ? 30 : s.key === 'balanced' ? 62 : 86;
                const certaintyLabel = s.key === 'aggressive' ? 'Low' : s.key === 'balanced' ? 'Moderate' : 'High';
                const tradeoff = s.key === 'aggressive'
                  ? 'Maximum savings, but the seller may counter sharply. Best if you have competing properties in mind.'
                  : s.key === 'balanced'
                  ? 'AI-optimized sweet spot — strong savings with the highest likelihood of acceptance for this seller profile.'
                  : 'Near-asking signals commitment. Fastest path to close; ideal when you want to avoid a competing bid.';
                return (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      padding: '18px',
                      borderRadius: 14,
                      border: `1.5px solid ${s.color}30`,
                      background: `linear-gradient(145deg, ${s.gradFrom}0A, ${s.gradTo}06)`,
                      boxShadow: `0 0 0 3px ${s.color}0C, 0 4px 22px ${s.color}10`,
                    }}
                  >
                    {/* Header row: icon + name + price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg, ${s.gradFrom}, ${s.gradTo})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 14px ${s.color}38`,
                      }}>
                        <s.icon style={{ width: 19, height: 19, color: 'white' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <p style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--fg)', margin: 0, letterSpacing: '-0.01em' }}>{s.label}</p>
                          {'recommended' in s && s.recommended && (
                            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${s.color}16`, color: s.color, border: `1px solid ${s.color}22`, flexShrink: 0 }}>
                              AI PICK
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--fg-muted)', margin: '2px 0 0' }}>{s.desc}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '17px', fontWeight: 900, color: s.color, margin: '0 0 1px', letterSpacing: '-0.02em', lineHeight: 1 }}>
                          {formatCurrency({ ...property.price, amount: Math.round(property.price.amount * s.pct) })}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--fg-muted)', margin: 0 }}>{s.insight}</p>
                      </div>
                    </div>

                    {/* Three metric bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                      {([
                        { label: 'Acceptance probability', pct: parseInt(s.probability), suffix: s.probability },
                        { label: 'Potential savings',      pct: savingsPct,              suffix: `${currSymbol}${fmtAmt(savings)}` },
                        { label: 'Certainty level',        pct: certaintyPct,            suffix: certaintyLabel },
                      ] as const).map(m => (
                        <div key={m.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fg-secondary)' }}>{m.label}</span>
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: s.color }}>{m.suffix}</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(m.pct, 100)}%` }}
                              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                              style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${s.gradFrom}BB, ${s.gradTo})` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Trade-off note */}
                    <div style={{
                      padding: '10px 13px', borderRadius: 10,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      fontSize: '11px', color: 'var(--fg-muted)', lineHeight: 1.65,
                    }}>
                      {tradeoff}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ────────────────────────────────────────────
              STEP 2 — Adjust Offer
          ──────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20 }}>
              <StepBadge n="2" />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fg)', margin: 0, letterSpacing: '-0.01em' }}>Adjust Offer</h3>
                <p style={{ fontSize: '11px', color: 'var(--fg-muted)', margin: '1px 0 0' }}>Fine-tune or accept the strategy price as-is.</p>
              </div>
            </div>

            {/* Price display */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '13px', color: 'var(--fg-muted)', fontWeight: 700 }}>{currSymbol}</span>
              <motion.span
                key={Math.round(offerAmount / sliderStep)}
                initial={{ opacity: 0.6, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14 }}
                style={{
                  fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
                  background: `linear-gradient(135deg, ${activeSt.gradFrom}, ${activeSt.gradTo})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}
              >
                {fmtAmt(offerAmount)}
              </motion.span>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: Number(pctVsAsking) < 0 ? 'rgba(139,115,85,0.10)' : 'rgba(210,80,80,0.08)',
                color: Number(pctVsAsking) < 0 ? '#8B7355' : '#B06060',
                border: `1px solid ${Number(pctVsAsking) < 0 ? 'rgba(139,115,85,0.20)' : 'rgba(210,80,80,0.15)'}`,
              }}>
                {Number(pctVsAsking) < 0
                  ? `${Math.abs(Number(pctVsAsking))}% below asking`
                  : `${pctVsAsking}% above asking`}
              </span>
            </div>

            {/* Slider */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'var(--bg-secondary)', marginBottom: 4 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${sliderPct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${activeSt.gradFrom}, ${activeSt.gradTo})`, transition: 'width 0.1s' }} />
                <input
                  type="range"
                  min={sliderMin} max={sliderMax} step={sliderStep}
                  value={offerAmount}
                  onChange={e => setOfferAmount(Number(e.target.value))}
                  disabled={offerStatus === 'reviewing'}
                  style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%', margin: 0 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--fg-muted)' }}>70% of ask</span>
                <span style={{ fontSize: '9.5px', color: '#8B7355', fontWeight: 600 }}>
                  AI fair value: {formatCurrency({ ...property.price, amount: fairValue })}
                </span>
                <span style={{ fontSize: '9.5px', color: 'var(--fg-muted)' }}>105%</span>
              </div>
            </div>

            {/* Quick chips */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
              {PRICE_CHIPS.map(chip => (
                <motion.button
                  key={chip.label}
                  type="button"
                  onClick={() => applyChip(chip.pct)}
                  disabled={offerStatus === 'reviewing'}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    fontSize: '11px', fontWeight: 700,
                    padding: '5px 14px', borderRadius: 99,
                    border: '1px solid rgba(139,115,85,0.22)',
                    background: 'rgba(139,115,85,0.07)',
                    color: '#8B7355', cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {chip.label}
                </motion.button>
              ))}
            </div>

            {/* Payment terms */}
            <div style={{ marginBottom: 14 }}>
              <SectionLabel>Payment Method</SectionLabel>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {(['cash', 'mortgage', 'flexible'] as TermsKey[]).map(t => {
                  const active = selectedTerms === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTerms(t)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 10,
                        border: `1.5px solid ${active ? 'rgba(139,115,85,0.40)' : 'var(--border)'}`,
                        background: active ? 'rgba(139,115,85,0.08)' : 'var(--bg-secondary)',
                        color: active ? '#8B7355' : 'var(--fg-muted)',
                        fontSize: '11.5px', fontWeight: active ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.16s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        boxShadow: active ? accentGlow : 'none',
                      }}
                    >
                      {active && <Check style={{ width: 11, height: 11 }} />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 14 }}>
              <SectionLabel>Closing Timeline</SectionLabel>
              <div style={{ position: 'relative', marginTop: 8 }} ref={timelineRef}>
                <button
                  type="button"
                  onClick={() => setShowTimeline(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 11,
                    border: `1.5px solid ${showTimeline ? 'rgba(139,115,85,0.35)' : 'var(--border)'}`,
                    background: 'var(--bg-secondary)', cursor: 'pointer',
                    boxShadow: showTimeline ? accentGlow : 'none',
                    transition: 'border-color 0.16s, box-shadow 0.16s',
                  }}
                >
                  <Clock style={{ width: 13, height: 13, color: '#8B7355', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left', fontSize: '12.5px', fontWeight: 600, color: 'var(--fg)' }}>{selectedTL}</span>
                  <motion.span animate={{ rotate: showTimeline ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown style={{ width: 13, height: 13, color: 'var(--fg-muted)', flexShrink: 0 }} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {showTimeline && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.16 }}
                      style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                        marginTop: 4, borderRadius: 12,
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                      }}
                    >
                      {TIMELINE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setClosingTimeline(opt.value); setShowTimeline(false); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            gap: 8, padding: '10px 14px',
                            background: closingTimeline === opt.value ? 'rgba(139,115,85,0.07)' : 'transparent',
                            border: 'none', cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.12s',
                          }}
                        >
                          <span style={{ flex: 1, textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>{opt.label}</span>
                          <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)' }}>{opt.note}</span>
                          {closingTimeline === opt.value && <Check style={{ width: 12, height: 12, color: '#8B7355', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Advanced options */}
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
            >
              <SlidersHorizontal style={{ width: 12, height: 12 }} />
              Advanced Options
              <motion.span animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.18 }}>
                <ChevronDown style={{ width: 12, height: 12 }} />
              </motion.span>
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: 12 }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      padding: '10px 12px', borderRadius: 11,
                      background: contingencyFree ? 'rgba(139,115,85,0.06)' : 'var(--bg-secondary)',
                      border: `1px solid ${contingencyFree ? 'rgba(139,115,85,0.20)' : 'var(--border)'}`,
                      transition: 'all 0.18s',
                    }}>
                      <span className="dr-toggle-wrap">
                        <input type="checkbox" checked={contingencyFree} onChange={e => setContingencyFree(e.target.checked)} />
                        <span className="dr-toggle-slider" />
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--fg-secondary)', userSelect: 'none', lineHeight: 1.4 }}>
                        Contingency-free{' '}
                        <span style={{ color: '#8B7355', fontWeight: 700 }}>(+22% acceptance rate)</span>
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Live Offer Preview ── */}
          <motion.div
            key={`${Math.round(offerAmount / 1000)}-${selectedTerms}-${closingTimeline}-${contingencyFree}`}
            initial={{ opacity: 0.7, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: '14px 18px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(139,115,85,0.07), rgba(111,92,70,0.05))',
              border: '1px solid rgba(139,115,85,0.18)',
              boxShadow: '0 2px 12px rgba(139,115,85,0.08)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #8B7355, #6F5C46)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 10px rgba(139,115,85,0.30)' }}>
              <Gavel style={{ width: 15, height: 15, color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#8B7355', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Offer Preview</p>
              <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--fg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currSymbol}{fmtAmt(offerAmount)}
                {' · '}{selectedTerms.charAt(0).toUpperCase() + selectedTerms.slice(1)}
                {' · '}{selectedTL}
                {contingencyFree ? ' · Contingency-free' : ''}
              </p>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 99, flexShrink: 0,
              background: Number(pctVsAsking) < 0 ? 'rgba(139,115,85,0.14)' : 'rgba(210,80,80,0.08)',
              color: Number(pctVsAsking) < 0 ? '#8B7355' : '#B06060',
              border: `1px solid ${Number(pctVsAsking) < 0 ? 'rgba(139,115,85,0.22)' : 'rgba(210,80,80,0.15)'}`,
            }}>
              {Number(pctVsAsking) < 0 ? '▼' : '▲'} {Math.abs(Number(pctVsAsking))}%
            </span>
          </motion.div>

          {/* ── Collapsible Broker Chat ── */}
          <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card-bg)', boxShadow: shadow }}>

            <button
              type="button"
              onClick={() => setChatOpen(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 18px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: chatOpen ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(139,115,85,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare style={{ width: 14, height: 14, color: '#8B7355' }} />
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--fg)', flex: 1, textAlign: 'left' }}>
                Broker Conversation
              </span>
              {!chatOpen && state.messages.length > 0 && (
                <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {state.messages[state.messages.length - 1]?.text}
                </span>
              )}
              <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(139,115,85,0.10)', color: '#8B7355', flexShrink: 0 }}>
                {state.messages.length}
              </span>
              <motion.span animate={{ rotate: chatOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown style={{ width: 14, height: 14, color: 'var(--fg-muted)', flexShrink: 0 }} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {chatOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Broker info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #8B7355, #6F5C46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                      {BROKER.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--fg)', margin: 0 }}>{BROKER.name}</p>
                      <p style={{ fontSize: '10.5px', color: 'var(--fg-muted)', margin: 0 }}>{BROKER.title}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star style={{ width: 11, height: 11, fill: '#FBBF24', color: '#FBBF24' }} />
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fg)' }}>{BROKER.rating}</span>
                      <span className="dr-live-badge"><span className="dr-live-dot" />Available</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="dr-msg-list" style={{ maxHeight: 240 }}>
                    {state.messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`dr-msg-row group ${msg.sender === 'Investor' ? 'investor' : ''}`}
                      >
                        <div className={`dr-msg-avatar ${msg.sender === 'Broker' ? 'broker' : 'investor'}`}>
                          {msg.sender === 'Broker' ? BROKER.initials : 'You'}
                        </div>
                        <div className={`dr-msg-body ${msg.sender === 'Investor' ? 'investor' : ''}`}>
                          {msg.sender === 'Investor' && editMessageId === msg.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                              <textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Escape') cancelEdit();
                                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(msg.id);
                                }}
                                rows={Math.max(2, editText.split('\n').length + 1)}
                                autoFocus
                                className="dr-edit-textarea"
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button type="button" onClick={cancelEdit} className="dr-edit-cancel">Cancel</button>
                                <button type="button" onClick={() => saveEdit(msg.id)} className="dr-edit-save">Save</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ position: 'relative' }}>
                              <div className={`dr-bubble ${msg.sender === 'Investor' ? 'investor' : 'broker'}`}>{msg.text}</div>
                              {msg.sender === 'Investor' && (
                                <button type="button" onClick={() => startEdit(msg.id, msg.text)} className="dr-edit-btn opacity-0 group-hover:opacity-100">
                                  <Pencil className="h-2.5 w-2.5" />Edit
                                </button>
                              )}
                            </div>
                          )}
                          <span className="dr-msg-time">{msg.time}</span>
                        </div>
                      </motion.div>
                    ))}
                    {offerBtnBusy && (
                      <div className="dr-msg-row">
                        <div className="dr-msg-avatar broker">{BROKER.initials}</div>
                        <div className="dr-typing-indicator"><span /><span /><span /></div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Composer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                    <input
                      value={brokerInput}
                      onChange={e => setBrokerInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBrokerMessage(); } }}
                      placeholder="Message your broker…"
                      style={{
                        flex: 1, fontSize: '12px', padding: '8px 12px',
                        borderRadius: 99, border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)', color: 'var(--fg)',
                        outline: 'none',
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={sendBrokerMessage}
                      disabled={!brokerInput.trim()}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: brokerInput.trim() ? 'linear-gradient(135deg, #8B7355, #6F5C46)' : 'var(--bg-secondary)',
                        border: 'none', color: brokerInput.trim() ? 'white' : 'var(--fg-muted)',
                        cursor: brokerInput.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'background 0.18s',
                        boxShadow: brokerInput.trim() ? '0 3px 10px rgba(139,115,85,0.30)' : 'none',
                      }}
                    >
                      <Send style={{ width: 14, height: 14 }} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </main>

        {/* ══════════════════════════════════════════════════════
            RIGHT — Intelligence Panel
        ══════════════════════════════════════════════════════ */}
        <aside className="dr-right-panel">
          <div className="dr-sticky-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ── Live Deal Score — Decision Engine ── */}
            <div style={{ ...card, padding: 18 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg, #8B7355, #6F5C46)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(139,115,85,0.32)', flexShrink: 0 }}>
                  <Target style={{ width: 13, height: 13, color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fg)', margin: 0, letterSpacing: '-0.01em' }}>Live Deal Score</p>
                  <p style={{ fontSize: '9.5px', color: 'var(--fg-muted)', margin: 0 }}>AI decision engine · updated live</p>
                </div>
                <span className="dr-live-badge"><span className="dr-live-dot" />Live</span>
              </div>

              {/* Score ring + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
                  <svg style={{ width: 76, height: 76, transform: 'rotate(-90deg)' }} viewBox="0 0 76 76">
                    <defs>
                      <linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C4A882" />
                        <stop offset="100%" stopColor="#8B7355" />
                      </linearGradient>
                    </defs>
                    <circle cx="38" cy="38" r="30" fill="none" stroke="var(--bg-secondary)" strokeWidth="7" />
                    <motion.circle
                      cx="38" cy="38" r="30" fill="none"
                      stroke="url(#scoreGrad2)" strokeWidth="7" strokeLinecap="round"
                      initial={{ strokeDasharray: `0 ${2 * Math.PI * 30}` }}
                      animate={{ strokeDasharray: `${2 * Math.PI * 30 * state.dealScore / 100} ${2 * Math.PI * 30}` }}
                      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.4 }}
                      style={{ fontSize: '21px', fontWeight: 900, color: 'var(--fg)', lineHeight: 1, letterSpacing: '-0.02em' }}
                    >{state.dealScore}</motion.span>
                    <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--fg-muted)' }}>/100</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 900, color: 'var(--fg)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>{dealScoreLabel}</p>
                  <p style={{ fontSize: '10px', color: 'var(--fg-muted)', margin: '0 0 8px' }}>Favorable conditions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: 'rgba(139,115,85,0.08)', border: '1px solid rgba(139,115,85,0.15)', width: 'fit-content' }}>
                      <TrendingUp style={{ width: 9, height: 9, color: '#8B7355' }} />
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8B7355' }}>+4 pts this week</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.10)', width: 'fit-content' }}>
                      <Zap style={{ width: 9, height: 9, color: '#A89478' }} />
                      <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#A89478' }}>Act within 48h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { label: 'Price vs Market', value: Math.min(96, Math.round(state.dealScore * 1.08)), tooltip: 'How competitive the current offer is vs. 90-day area comps' },
                  { label: 'Demand Level', value: Math.min(96, Math.round(state.dealScore * 1.14)), tooltip: 'Buyer demand in this micro-market over the last 30 days' },
                  { label: 'Seller Motivation', value: state.dealScore >= 70 ? 88 : 62, tooltip: 'Estimated seller urgency based on price reductions and days on market' },
                  { label: 'Area Trend', value: 72, tooltip: '3-month capital appreciation momentum for this sub-market' },
                ].map(metric => (
                  <div key={metric.label} className="group/metric" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-secondary)' }}>{metric.label}</span>
                        <div style={{ position: 'relative' }} className="group/tip">
                          <Info style={{ width: 9, height: 9, color: 'var(--fg-muted)', opacity: 0.5, cursor: 'default' }} />
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150"
                            style={{ whiteSpace: 'nowrap', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', padding: '5px 9px', fontSize: '10px', color: 'var(--fg-secondary)', boxShadow: '0 4px 16px rgba(0,0,0,0.14)', width: 'max-content', maxWidth: 180, whiteSpace: 'normal' }}>
                            {metric.tooltip}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#8B7355' }}>{metric.value}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                        style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C4A882, #8B7355)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Opportunity signals */}
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Opportunity Signals</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    '2× price reductions in 60 days',
                    'Below area median by ~4%',
                    'No competing offers on record',
                  ].map(signal => (
                    <div key={signal} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(139,115,85,0.10)', border: '1px solid rgba(139,115,85,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Check style={{ width: 8, height: 8, color: '#8B7355' }} />
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--fg-secondary)', lineHeight: 1.4 }}>{signal}</span>
                    </div>
                  ))}
                </div>
                {/* Risk factors */}
                <p style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '10px 0 6px' }}>Risk Factors</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[state.dealScore < 75 ? 'Moderate seller resistance likely' : 'Competing buyers may emerge', 'Market volatility: medium'].map(risk => (
                    <div key={risk} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(180,110,80,0.08)', border: '1px solid rgba(180,110,80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <TrendingDown style={{ width: 7, height: 7, color: '#B06060' }} />
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--fg-muted)', lineHeight: 1.4 }}>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── AI Suggested Offer — with comparison layer ── */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Sparkles style={{ width: 13, height: 13, color: '#8B7355', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fg)', margin: 0, flex: 1 }}>AI Suggested Offer</p>
                <button type="button" title="Based on seller motivation signals, 90-day area median comparables, and historical close rates."
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', opacity: 0.55 }}>
                  <Info style={{ width: 12, height: 12, color: 'var(--fg-muted)' }} />
                </button>
              </div>

              {/* Comparison rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {[
                  { label: 'Asking Price', amount: property.price.amount, pct: 100, dim: true },
                  { label: 'AI Suggested', amount: suggestedOffer, pct: 92, highlight: true },
                  { label: 'Your Offer', amount: offerAmount, pct: Math.round(offerAmount / property.price.amount * 100), current: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 28, borderRadius: 99, background: row.highlight ? '#8B7355' : row.current ? '#A89478' : 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '9.5px', fontWeight: 700, color: row.highlight ? '#8B7355' : 'var(--fg-muted)', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</p>
                      <p style={{ fontSize: '12px', fontWeight: 900, color: row.dim ? 'var(--fg-muted)' : 'var(--fg)', margin: 0, letterSpacing: '-0.01em' }}>
                        {currSymbol}{fmtAmt(row.amount)}
                      </p>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: row.highlight ? 'rgba(139,115,85,0.10)' : 'var(--bg-secondary)', color: row.highlight ? '#8B7355' : 'var(--fg-muted)', border: `1px solid ${row.highlight ? 'rgba(139,115,85,0.18)' : 'var(--border)'}`, flexShrink: 0 }}>
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Savings + probability */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.12)' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#8B7355', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Potential Saving</p>
                  <p style={{ fontSize: '12px', fontWeight: 900, color: '#8B7355', margin: 0 }}>{currSymbol}{fmtAmt(property.price.amount - suggestedOffer)}</p>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--fg-muted)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accept Probability</p>
                  <p style={{ fontSize: '12px', fontWeight: 900, color: 'var(--fg)', margin: 0 }}>78%</p>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={applyAiSuggestion}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 18px rgba(139,115,85,0.22)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 10,
                  border: '1px solid rgba(139,115,85,0.28)',
                  background: 'rgba(139,115,85,0.08)',
                  color: '#8B7355', fontSize: '11.5px', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
              >
                <Sparkles style={{ width: 11, height: 11 }} />
                Apply AI Suggestion
              </motion.button>
            </div>

            {/* ── AI Insight — dynamic rotating panel ── */}
            <div style={{
              ...card, padding: 16,
              background: 'linear-gradient(145deg, var(--card-bg), rgba(196,168,130,0.04))',
              border: '1px solid rgba(139,115,85,0.16)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Radial glow */}
              <div style={{ position: 'absolute', top: -10, right: -10, width: 90, height: 90, background: 'radial-gradient(circle, rgba(196,168,130,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <motion.div
                  animate={{ boxShadow: ['0 3px 8px rgba(139,115,85,0.28)', '0 3px 16px rgba(139,115,85,0.45)', '0 3px 8px rgba(139,115,85,0.28)'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #C4A882, #8B7355)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Brain style={{ width: 12, height: 12, color: 'white' }} />
                </motion.div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fg)', margin: 0, flex: 1 }}>AI Insight</p>
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(139,115,85,0.10)', color: '#8B7355', border: '1px solid rgba(139,115,85,0.18)' }}>
                  Live
                </motion.span>
              </div>

              {/* Rotating insight text */}
              <motion.p
                key={insightIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: insightVisible ? 1 : 0, y: insightVisible ? 0 : -4 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontSize: '11.5px', color: 'var(--fg-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}
              >
                {ROTATING_INSIGHTS[insightIdx]}
              </motion.p>

              {/* Quick-action chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {AI_QUICK_CHIPS.map(chip => (
                  <motion.button
                    key={chip}
                    type="button"
                    onClick={() => { setAiInput(chip); }}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      fontSize: '10px', fontWeight: 600,
                      padding: '4px 10px', borderRadius: 99,
                      border: '1px solid rgba(139,115,85,0.18)',
                      background: 'rgba(139,115,85,0.05)',
                      color: 'var(--fg-secondary)', cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    {chip}
                  </motion.button>
                ))}
              </div>

              {/* Recent AI chat */}
              {aiMessages.length > 2 && (
                <div style={{ borderTop: '1px solid rgba(139,115,85,0.10)', paddingTop: 10, marginBottom: 10 }}>
                  {aiMessages.slice(-2).map((msg, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: msg.role === 'ai' ? '#8B7355' : 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {msg.role === 'ai' ? 'AI' : 'You'}
                      </span>
                      <p style={{ fontSize: '11px', color: 'var(--fg-secondary)', margin: '2px 0 0', lineHeight: 1.5 }}>{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* AI input */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                  placeholder="Ask AI anything…"
                  style={{
                    flex: 1, fontSize: '11px', padding: '7px 12px',
                    borderRadius: 99, border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)', color: 'var(--fg)', outline: 'none',
                  }}
                />
                <motion.button
                  type="button"
                  onClick={sendAiMessage}
                  disabled={aiLoading || !aiInput.trim()}
                  whileHover={aiInput.trim() ? { scale: 1.08 } : undefined}
                  whileTap={aiInput.trim() ? { scale: 0.93 } : undefined}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: aiInput.trim() ? 'linear-gradient(135deg, #C4A882, #8B7355)' : 'var(--bg-secondary)',
                    border: 'none', color: aiInput.trim() ? 'white' : 'var(--fg-muted)',
                    cursor: !aiInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: aiInput.trim() ? '0 3px 10px rgba(139,115,85,0.30)' : 'none',
                    transition: 'background 0.18s, box-shadow 0.18s',
                  }}
                >
                  {aiLoading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} style={{ width: 13, height: 13, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    : <Send style={{ width: 13, height: 13 }} />
                  }
                </motion.button>
              </div>
            </div>

            {/* Offer submitted status */}
            <AnimatePresence>
              {offerStatus === 'reviewing' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(139,115,85,0.08)',
                    border: '1px solid rgba(139,115,85,0.22)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 2px 12px rgba(139,115,85,0.10)',
                  }}
                >
                  <CheckCircle style={{ width: 15, height: 15, color: '#8B7355', flexShrink: 0 }} />
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#8B7355', margin: 0, lineHeight: 1.4 }}>
                    Offer submitted<br />
                    <span style={{ fontWeight: 500, fontSize: '10.5px' }}>Awaiting seller response</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </aside>
      </div>

      {/* ════════════════════════ STICKY CTA BAR ════════════════════════ */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 40,
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        padding: '11px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 12,
      }}>
        {/* Summary */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,115,85,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Gavel style={{ width: 13, height: 13, color: '#8B7355' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--fg-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 — Confirm</p>
            <p style={{ fontSize: '12px', color: 'var(--fg)', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong>{currSymbol}{fmtAmt(offerAmount)}</strong>
              {' · '}{selectedTerms} · {selectedTL}
            </p>
          </div>
        </div>

        {/* Discuss with broker */}
        <motion.button
          type="button"
          onClick={() => { setChatOpen(true); setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 250); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '9px 16px', borderRadius: 11,
            border: '1px solid rgba(139,115,85,0.28)',
            background: 'rgba(139,115,85,0.06)',
            color: '#8B7355', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'background 0.16s, box-shadow 0.16s',
          }}
        >
          <MessageSquare style={{ width: 13, height: 13 }} />
          Discuss with Broker
        </motion.button>

        {/* Submit offer */}
        <motion.button
          type="button"
          onClick={submitOffer}
          disabled={offerBtnBusy || offerStatus === 'reviewing' || offerAmount <= 0}
          whileHover={offerStatus !== 'reviewing' && !offerBtnBusy ? { scale: 1.025 } : undefined}
          whileTap={offerStatus !== 'reviewing' && !offerBtnBusy ? { scale: 0.975 } : undefined}
          style={{
            padding: '10px 28px', borderRadius: 12, flexShrink: 0,
            background: offerStatus === 'reviewing'
              ? 'rgba(139,115,85,0.12)'
              : 'linear-gradient(135deg, #8B7355 0%, #6F5C46 100%)',
            border: 'none',
            color: offerStatus === 'reviewing' ? '#8B7355' : 'white',
            fontSize: '13px', fontWeight: 800,
            cursor: offerBtnBusy || offerStatus === 'reviewing' || offerAmount <= 0 ? 'not-allowed' : 'pointer',
            opacity: offerAmount <= 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: offerStatus !== 'reviewing' ? '0 4px 18px rgba(139,115,85,0.40), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
            letterSpacing: '-0.01em',
            transition: 'opacity 0.2s, box-shadow 0.2s',
          }}
        >
          {offerBtnBusy ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                style={{ width: 15, height: 15, border: '2.5px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
              Sending…
            </>
          ) : offerStatus === 'reviewing' ? (
            <>
              <CheckCircle style={{ width: 15, height: 15 }} />
              Offer Submitted
            </>
          ) : (
            <>
              <Gavel style={{ width: 15, height: 15 }} />
              Submit Offer
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
