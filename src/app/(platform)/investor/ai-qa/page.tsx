'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, Building2, TrendingUp, Shield,
  Star, Zap, RotateCcw, Copy, Check, ArrowRight,
  MessageCircle, MapPin, ChevronRight, AlertCircle, Trophy,
  ThumbsUp, ThumbsDown, BarChart3, DollarSign, Lock, Mic,
  Minimize2,
} from 'lucide-react';
import { InvestorPageHeader } from '@/components/layout/investor-page-header';
import { useFunnel } from '@/contexts/investor-funnel-context';
import { apiPropertyService } from '@/services';
import { adaptBackendProperty } from '@/services/api/property.api';
import { mockProperties } from '@/mock-data/properties';
import type { Property } from '@/types/property';

/* ─── Types ─── */

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  reaction?: 'up' | 'down' | null;
  copied?: boolean;
}

/* ─── Suggested questions ─── */

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp,  text: 'Which property has the best ROI potential?',       color: '#6F5C46' },
  { icon: Shield,      text: 'What are the key risks I should consider?',         color: '#EF4444' },
  { icon: DollarSign,  text: 'How do financing options compare?',                 color: '#8B7355' },
  { icon: Sparkles,    text: 'Which market has a stronger long-term outlook?',    color: '#A89478' },
  { icon: Zap,         text: 'What\'s the ideal holding period for each?',        color: '#C4B19A' },
  { icon: Trophy,      text: 'Which property should I invest in first?',          color: '#D4B896' },
];

const CHIP_COLORS = ['#8B7355', '#6F5C46', '#A89478', '#C4B19A', '#D4B896'];

const RISK_ALERTS = [
  { severity: 'medium', text: 'Interest rate changes may affect leveraged returns by 1–2%' },
  { severity: 'high',   text: 'Multi-jurisdiction currency exposure adds forex risk' },
  { severity: 'medium', text: 'Luxury segment exit typically takes 90–180 days' },
];

const TREND_DATA = [
  { market: 'Dubai',     growth: 12.8, pct: 100, color: '#8B7355' },
  { market: 'Singapore', growth: 8.2,  pct: 82,  color: '#6F5C46' },
  { market: 'Bangkok',   growth: 6.5,  pct: 65,  color: '#A89478' },
  { market: 'London',    growth: 4.1,  pct: 41,  color: '#C4B19A' },
];

/* ─── Mock AI response engine ─── */

function formatCurrency(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function generateAIResponse(question: string, properties: Property[]): string {
  const q = question.toLowerCase();
  const sorted = [...properties].sort((a, b) => b.aiScore - a.aiScore);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const markets = [...new Set(properties.map(p => p.location.country))].join(' and ');

  /* ROI / return */
  if (q.match(/roi|return|yield|income|earn/)) {
    return [
      `Here's a full ROI breakdown for your ${properties.length} shortlisted properties:\n`,
      ...properties.map(p =>
        `**${p.title}** (${p.location.city})\n` +
        `• Rental Yield: **${p.rentalYield}%** p.a.\n` +
        `• Capital Appreciation: **${p.capitalAppreciation}%** p.a.\n` +
        `• Combined Total Return: **${(p.rentalYield + p.capitalAppreciation).toFixed(1)}%**\n` +
        `• 5-Year Projected Value: **${formatCurrency(Math.round(p.price.amount * Math.pow(1 + p.capitalAppreciation / 100, 5)))}**`
      ),
      `\n**My verdict:** ${top.title} delivers the strongest combined return at ${(top.rentalYield + top.capitalAppreciation).toFixed(1)}% annually. Its ${top.location.city} market has consistently outperformed regional benchmarks over the past 3 years.`,
      `\n*Note: Past performance does not guarantee future results. These projections assume stable market conditions.*`,
    ].join('\n');
  }

  /* Risk */
  if (q.match(/risk|danger|safe|volatile|concern|worry|downside/)) {
    const riskMap: Record<string, { label: string; color: string; note: string }> = {
      low:    { label: 'Low Risk',    color: '🟢', note: 'stable fundamentals, strong demand' },
      medium: { label: 'Medium Risk', color: '🟡', note: 'some market sensitivity, watch liquidity' },
      high:   { label: 'High Risk',   color: '🔴', note: 'higher volatility, shorter liquidity window' },
    };
    return [
      `Risk assessment across your shortlist:\n`,
      ...properties.map(p => {
        const r = riskMap[p.riskScore] || riskMap.medium;
        return `**${p.title}** — ${r.color} ${r.label}\n• ${r.note}\n• Market: ${p.location.country} (${p.location.neighborhood || p.location.city})\n• Developer: ${p.developer}`;
      }),
      `\n**Key risk factors to watch:**\n• Currency exposure in ${markets}\n• Regulatory changes in foreign ownership rules\n• Interest rate sensitivity on leveraged positions\n• Liquidity constraints in luxury segments\n\n**Safest pick:** ${top.riskScore === 'low' ? top.title : sorted.find(p => p.riskScore === 'low')?.title ?? top.title} based on current market stability and developer track record.`,
    ].join('\n');
  }

  /* Financing / mortgage / loan */
  if (q.match(/financ|mortgage|loan|leverage|ltv|down payment|equity/)) {
    return [
      `Financing comparison for your shortlisted properties:\n`,
      ...properties.map(p => {
        const ltv = p.riskScore === 'low' ? 70 : p.riskScore === 'medium' ? 60 : 50;
        const downPayment = Math.round(p.price.amount * (1 - ltv / 100));
        const loanAmt = Math.round(p.price.amount * (ltv / 100));
        const rate = p.location.country === 'Singapore' ? 3.2 : p.location.country === 'United Arab Emirates' ? 4.1 : 4.8;
        const emi = Math.round((loanAmt * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -240)));
        return `**${p.title}** (${p.location.country})\n• Estimated LTV: ${ltv}%\n• Down Payment: ${formatCurrency(downPayment)}\n• Loan Amount: ${formatCurrency(loanAmt)}\n• Est. Rate: ${rate}% p.a.\n• Monthly EMI (20yr): ${formatCurrency(emi)}`;
      }),
      `\n**Financing tip:** ${top.location.country === 'Singapore' ? 'Singapore offers the most competitive rates' : top.location.country === 'United Arab Emirates' ? 'UAE banks offer attractive non-resident mortgages' : 'Consider local financing vs international bridge loans'} for your top-scoring property. Pre-approval adds negotiation leverage.`,
    ].join('\n');
  }

  /* Market / outlook / long-term */
  if (q.match(/market|outlook|long.term|future|trend|growth|forecast/)) {
    return [
      `Long-term market outlook for your shortlisted regions:\n`,
      ...properties.map(p => {
        const outlook = p.capitalAppreciation >= 10 ? 'Strong Bullish' : p.capitalAppreciation >= 7 ? 'Bullish' : 'Stable';
        return `**${p.location.city}, ${p.location.country}** — ${outlook}\n• Forecast appreciation: ${p.capitalAppreciation}% p.a.\n• AI Market Score: ${p.aiScore}/100\n• Demand drivers: ${p.features.slice(0, 2).join(', ')}`;
      }),
      `\n**Macro tailwinds across ${markets}:**\n• Continued UHNW capital inflows from Asia and Europe\n• Infrastructure pipeline supporting urban premiums\n• Limited new luxury supply in established micro-markets\n• Strong rental demand from expat and corporate sectors\n\n**Recommended horizon:** 5–7 years to fully capture compounding appreciation in these markets.`,
    ].join('\n');
  }

  /* Holding period */
  if (q.match(/hold|period|when.*sell|exit|years|horizon|term/)) {
    return [
      `Optimal holding periods based on each property's return profile:\n`,
      ...properties.map(p => {
        const years = p.capitalAppreciation >= 10 ? '3–5 years' : p.capitalAppreciation >= 7 ? '5–7 years' : '7–10 years';
        return `**${p.title}**\n• Recommended hold: **${years}**\n• Break-even point: ~${Math.ceil(100 / p.rentalYield)} years (yield only)\n• Peak return window: year ${p.capitalAppreciation >= 10 ? '3–5' : '5–8'}`;
      }),
      `\n**General strategy:** Properties in high-appreciation markets (${top.location.city}) reward shorter holds of 3–5 years. Yield-focused assets benefit from longer 7–10 year holds to maximize compounding rental income.\n\nAlways align your exit strategy with local market cycles and tax treatment in ${markets}.`,
    ].join('\n');
  }

  /* Which to buy / recommend */
  if (q.match(/which|recommend|buy|invest|pick|choose|best|winner|first/)) {
    const scores = properties.map(p => ({
      p,
      total: p.aiScore * 0.4 + p.rentalYield * 5 + p.capitalAppreciation * 3,
    })).sort((a, b) => b.total - a.total);

    return [
      `Based on a holistic analysis combining AI score, yield, and growth:\n`,
      ...scores.map((s, i) => {
        const medal = ['🥇', '🥈', '🥉'][i] ?? '•';
        return `${medal} **${s.p.title}** — Score: ${s.p.aiScore}/100\n• ${s.p.rentalYield}% yield + ${s.p.capitalAppreciation}% appreciation\n• Risk: ${s.p.riskScore} | Location: ${s.p.location.city}`;
      }),
      `\n**My recommendation: ${scores[0].p.title}**\n\nIt ranks first on the composite score due to its superior AI rating (${scores[0].p.aiScore}/100), proven developer (${scores[0].p.developer}), and balanced risk-return profile. Ideal for investors seeking both income and capital growth.\n\n*Want me to model a specific scenario — e.g., 30% leverage, 5-year hold?*`,
    ].join('\n');
  }

  /* Fractional */
  if (q.match(/fractional|token|partial|share|crowdfund/)) {
    return `Fractional ownership could be a compelling alternative for your shortlist:\n\n**Benefits for these properties:**\n• Lower capital commitment (entry from ₹50K vs ${formatCurrency(bottom.price.amount)} full purchase)\n• Diversify across ${properties.length} properties simultaneously\n• Liquidity via tokenized secondary market\n• Same rental yield exposure (${top.rentalYield}%+) without full leverage\n\n**Limitations to consider:**\n• No direct control over asset management decisions\n• Secondary market liquidity can be thin for luxury assets\n• Potential governance dilution in co-ownership structures\n\nGlimmora's Fractional platform currently lists ${top.title} and similar assets. Check the [Fractional Investments](/investor/fractional) section to compare tokenized options alongside your full-purchase shortlist.`;
  }

  /* Tax */
  if (q.match(/tax|stamp duty|capital gain|withhold|jurisdiction/)) {
    return [
      `Tax considerations by jurisdiction for your shortlisted properties:\n`,
      ...properties.map(p => {
        if (p.location.country === 'Singapore') {
          return `**Singapore (${p.title})**\n• ABSD for foreigners: 60% on residential\n• Rental income tax: 17% (corporate) / progressive (individual)\n• Capital gains: None (no CGT in Singapore)\n• Annual property tax: 10–20% of annual value`;
        } else if (p.location.country === 'United Arab Emirates') {
          return `**UAE (${p.title})**\n• No personal income tax, no CGT\n• DLD registration fee: 4% of purchase price\n• Annual service charges: 1–3% of value\n• VAT on commercial: 5%`;
        } else {
          return `**${p.location.country} (${p.title})**\n• Consult a local tax advisor for current rates\n• Consider double taxation treaties with your home jurisdiction\n• Currency repatriation rules vary by country`;
        }
      }),
      `\n**Key takeaway:** UAE properties in your shortlist carry zero capital gains tax, making them highly attractive for exit strategy planning. Singapore's ABSD for foreign buyers is a significant upfront cost to factor into your return calculations.`,
    ].join('\n');
  }

  /* Default / fallback */
  const propList = properties.map(p => `**${p.title}** (${p.location.city}, AI Score: ${p.aiScore}/100)`).join('\n');
  return `I've reviewed your shortlisted properties:\n\n${propList}\n\nHere's what stands out:\n\n• **${top.title}** leads with the highest AI score of ${top.aiScore}/100, driven by its ${top.location.city} location premium and ${top.rentalYield}% rental yield\n• The portfolio spans ${markets}, offering geographic diversification\n• Combined weighted return range: ${Math.min(...properties.map(p => p.rentalYield + p.capitalAppreciation)).toFixed(1)}%–${Math.max(...properties.map(p => p.rentalYield + p.capitalAppreciation)).toFixed(1)}% annually\n\nYou can ask me about specific topics like ROI analysis, risk comparison, financing options, market outlook, holding period strategy, or which property to prioritize. What would you like to explore?`;
}

/* ─── Render helpers ─── */

/** Glimmora AI mascot — rounded robot head with antenna spark, eyes, smile,
 *  and a tiny three-bar skyline base. Stands in for the generic Brain icon
 *  inside chat avatars and the floating minimized bubble. */
function GlimmoraAIAvatar({
  size = 18,
  className = '',
  stroke = 1.6,
}: { size?: number; className?: string; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2v2" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="12" cy="1.6" r="1.1" fill="currentColor" />
      <rect x="4" y="5" width="16" height="10.5" rx="3.4" stroke="currentColor" strokeWidth={stroke} />
      <circle cx="9" cy="10.2" r="1.15" fill="currentColor" />
      <circle cx="15" cy="10.2" r="1.15" fill="currentColor" />
      <path d="M10 13.2c0.55 0.42 1.25 0.6 2 0.6s1.45-0.18 2-0.6" stroke="currentColor" strokeWidth={stroke * 0.85} strokeLinecap="round" />
      <rect x="7.4" y="17.6" width="2.3" height="3.4" rx="0.4" fill="currentColor" opacity="0.78" />
      <rect x="10.85" y="16" width="2.3" height="5" rx="0.4" fill="currentColor" />
      <rect x="14.3" y="17.6" width="2.3" height="3.4" rx="0.4" fill="currentColor" opacity="0.78" />
    </svg>
  );
}

/** Converts **bold** and \n to JSX */
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-[13px] leading-relaxed text-[var(--fg)]">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <span key={j} className="font-semibold text-[var(--fg)]">{part.slice(2, -2)}</span>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ─── Page ─── */

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } },
};

const msgVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function AIQAPage() {
  const router = useRouter();
  const { selectedPropertyIds, setCurrentStep, completeStep } = useFunnel();

  const [properties, setProperties] = useState<Property[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [msgStates, setMsgStates] = useState<Record<string, { reaction?: 'up' | 'down'; copied?: boolean }>>({});
  // UI-only: collapse the whole advisor into a small floating bubble so the
  // user can recover screen real-estate without losing the conversation.
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch the selected properties' details from backend (for context chips
  // + welcome message). The QA endpoint itself is per-property; we route
  // questions to the first selected property below.
  // Fallback: if no property is selected (e.g. user navigated here directly
  // for testing), auto-load the first property from the backend so QA still
  // has context and can be exercised without walking the full funnel.
  useEffect(() => {
    let cancelled = false;
    if (selectedPropertyIds.length === 0) {
      apiPropertyService
        .listProperties({ limit: 1 })
        .then((res) => {
          if (cancelled) return;
          const first = res.properties[0];
          if (first) setProperties([adaptBackendProperty(first)]);
          else setProperties([]);
        })
        .catch(() => { if (!cancelled) setProperties([]); });
      return () => { cancelled = true; };
    }
    Promise.all(
      selectedPropertyIds.map((id) =>
        apiPropertyService.getDetail(id).then(adaptBackendProperty).catch(() => null),
      ),
    ).then((results) => {
      if (!cancelled) setProperties(results.filter((p): p is Property => p !== null));
    });
    return () => { cancelled = true; };
  }, [selectedPropertyIds]);

  // Recompute the welcome message when properties land.
  useEffect(() => {
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'ai',
      content: properties.length > 0
        ? `I've analyzed your ${properties.length} shortlisted propert${properties.length === 1 ? 'y' : 'ies'}:\n\n${properties.map(p => `**${p.title}** — ${p.location.city}${p.aiScore ? ` · AI Score ${p.aiScore}/100` : ''}${p.rentalYield ? ` · ${p.rentalYield}% yield` : ''}`).join('\n')}\n\nAsk me anything — ROI analysis, risk breakdown, financing options, which to buy first, or tax implications by jurisdiction.`
        : `Welcome to your AI Property Advisor.\n\nIt looks like you haven't shortlisted any properties yet. Head back to **Properties** to select some, then return here for a deep analysis.\n\nOr ask me a general question about real estate investment strategy.`,
      timestamp: new Date(),
    };
    setMessages((prev) => (prev.length === 0 || prev[0].id === 'welcome' ? [welcomeMsg] : prev));
  }, [properties]);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Voice input (Web Speech API, client-side only) ──
     Append the live transcript to whatever the user has already typed.
     We hold the pre-listen value in a ref so each onresult tick rebuilds
     from a stable base instead of accumulating across interim results. */
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<unknown>(null);
  const voiceBaseRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new (SR as new () => unknown)();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const base = voiceBaseRef.current;
      const sep = base && !base.endsWith(' ') ? ' ' : '';
      setInput((base + sep + transcript).trimStart());
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* noop */ }
    };
  }, []);

  /* ── Rotating placeholder hints ──
     When the input is empty, cycle through example questions every ~2.6s
     with a soft fade-slide so the bar feels alive and gives the user a
     concrete prompt to start from instead of a static "Ask about…" line. */
  const rotatingPrompts = useMemo(() => {
    const contextual = properties.length > 0
      ? `Ask about your ${properties.length} shortlisted propert${properties.length === 1 ? 'y' : 'ies'}…`
      : 'Ask about ROI, risk, financing, market outlook…';
    return [
      contextual,
      'Which property has the best ROI?',
      'What are the key risks here?',
      'Compare these on rental yield…',
      'What is the long-term outlook?',
    ];
  }, [properties.length]);

  const [promptIdx, setPromptIdx] = useState(0);
  useEffect(() => {
    if (input.trim()) return;
    const t = setInterval(
      () => setPromptIdx((i) => (i + 1) % rotatingPrompts.length),
      2600,
    );
    return () => clearInterval(t);
  }, [input, rotatingPrompts.length]);

  const toggleVoiceInput = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = recognitionRef.current;
    if (!rec) return;
    if (isListening) {
      try { rec.stop(); } catch { /* noop */ }
      setIsListening(false);
      return;
    }
    voiceBaseRef.current = input;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening, input]);

  /* Step tracking */
  useEffect(() => {
    completeStep(4);
    setCurrentStep(5);
  }, [completeStep, setCurrentStep]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Auto-resize textarea */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
  }, [input]);

  /** Route a question to the backend QA endpoint. The first shortlisted
   *  property is the primary; the rest are sent as comparison context so
   *  the bot can answer "which is best across these?" style questions
   *  instead of replying about a single property. Falls back to the
   *  client-side generateAIResponse() if the backend errors. */
  const askAI = useCallback(async (text: string): Promise<string> => {
    if (properties.length === 0) {
      return `I don't have any properties in context yet. Head back to **Properties** to shortlist some, then ask again.`;
    }
    const [primary, ...rest] = properties;
    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({
          role: (m.role === 'user' ? 'user' : 'bot') as 'user' | 'bot',
          text: m.content,
        }));
      const additionalPropertyIds = [...new Set(
        rest
          .map((p) => p?.id)
          .filter((id): id is string => Boolean(id) && id !== primary.id),
      )];
      console.log('[AI-QA] Primary Property:', primary.id);
      console.log('[AI-QA] Comparison Properties:', additionalPropertyIds);
      const resp = await apiPropertyService.askQuestion(
        primary.id,
        text,
        history,
        additionalPropertyIds,
      );
      return resp.source ? `${resp.answer}\n\n*Source: ${resp.source}*` : resp.answer;
    } catch {
      // backend unavailable — fall through to offline keyword-driven generator
      return generateAIResponse(text, properties);
    }
  }, [properties, messages]);

  const sendText = useCallback((text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    askAI(text.trim()).then((content) => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    });
  }, [isTyping, askAI]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    askAI(text).then((content) => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    });
  }, [input, isTyping, askAI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setMsgStates(prev => ({ ...prev, [id]: { ...prev[id], copied: true } }));
    setTimeout(() => setMsgStates(prev => ({ ...prev, [id]: { ...prev[id], copied: false } })), 2000);
  };

  const handleReaction = (id: string, reaction: 'up' | 'down') => {
    setMsgStates(prev => ({
      ...prev,
      [id]: { ...prev[id], reaction: prev[id]?.reaction === reaction ? undefined : reaction },
    }));
  };

  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser || isTyping) return;
    setIsTyping(true);
    askAI(lastUser.content).then((content) => {
      const aiMsg: Message = {
        id: `ai-regen-${Date.now()}`,
        role: 'ai',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    });
  }, [messages, isTyping, askAI]);

  const showSuggestions = messages.length <= 1;

  /* ── Sidebar derived data ── */
  const activeProps = properties.length > 0 ? properties : mockProperties.slice(0, 3);
  const topProp = activeProps.length > 0 ? [...activeProps].sort((a, b) => b.aiScore - a.aiScore)[0] : null;
  const avgYield = activeProps.length > 0 ? (activeProps.reduce((s, p) => s + p.rentalYield, 0) / activeProps.length).toFixed(1) : '0.0';
  const avgGrowth = activeProps.length > 0 ? (activeProps.reduce((s, p) => s + p.capitalAppreciation, 0) / activeProps.length).toFixed(1) : '0.0';
  const avgScore = activeProps.length > 0 ? Math.round(activeProps.reduce((s, p) => s + p.aiScore, 0) / activeProps.length) : 0;
  const uniqueMarkets = [...new Set(activeProps.map(p => p.location.country))];

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="aiq-page"
    >
      {/* ── Header ── */}
      <InvestorPageHeader
        icon={Brain}
        title="AI Property Advisor"
        subtitle={
          properties.length > 0
            ? `Analyzing ${properties.length} shortlisted opportunit${properties.length === 1 ? 'y' : 'ies'}`
            : 'Ask anything about real estate investment'
        }
        animate={false}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {properties.length > 0 && (
              <button
                onClick={() => router.push('/investor/compare')}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-primary-400/40 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3 w-3 rotate-180" />
                Back to Compare
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize advisor"
              title="Minimize advisor"
              className="aiq-minimize-btn"
            >
              <Minimize2 className="h-3 w-3" />
            </button>
            <button
              onClick={() => router.push('/investor/portfolio')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-r from-[#8B7355] to-[#6F5C46] text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              View Portfolio
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        }
      />

      {/* ── Property Context Chips ── */}
      {!isMinimized && properties.length > 0 && (
        <div className="aiq-chips-row">
          <span className="text-[10px] font-semibold text-[var(--fg-muted)] shrink-0 self-center">In context:</span>
          {properties.map((p, i) => {
            const c = CHIP_COLORS[i % CHIP_COLORS.length];
            return (
              <div
                key={p.id}
                className="aiq-chip"
                style={{ background: `${c}10`, borderColor: `${c}22` }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                <span className="text-[10px] font-semibold text-[var(--fg-secondary)] truncate max-w-[90px]">{p.title}</span>
                <span className="text-[9px] text-[var(--fg-muted)] flex items-center gap-0.5 shrink-0">
                  <MapPin className="h-2.5 w-2.5" />{p.location.city}
                </span>
                <span className="text-[9px] font-bold shrink-0 px-1 py-0.5 rounded" style={{ background: `${c}18`, color: c }}>{p.aiScore}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 2-Column Layout ── */}
      <div
        className="aiq-layout"
        aria-hidden={isMinimized}
        style={isMinimized ? { display: 'none' } : undefined}
      >

        {/* ── Main Content (70%) ── */}
        <div className="aiq-main">

          {/* Messages */}
          <div className="aiq-messages-wrapper">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  variants={msgVariants}
                  initial="hidden"
                  animate="visible"
                  className={`aiq-msg-row ${msg.role === 'user' ? 'aiq-msg-row-user' : ''}`}
                >
                  {msg.role === 'ai' && (
                    <div className="aiq-msg-avatar aiq-msg-avatar-ai aiq-msg-avatar-ai-live">
                      <GlimmoraAIAvatar size={18} className="text-white" />
                    </div>
                  )}

                  <div className={`aiq-msg-bubble ${msg.role === 'ai' ? 'aiq-msg-bubble-ai' : 'aiq-msg-bubble-user'}`}>
                    {msg.role === 'user'
                      ? <p className="text-[13px] leading-relaxed text-white">{msg.content}</p>
                      : <RichText text={msg.content} />
                    }
                    {msg.role === 'ai' && msg.id !== 'welcome' && (
                      <div className="aiq-msg-footer">
                        <span className="aiq-msg-time">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleReaction(msg.id, 'up')}
                            className={`aiq-msg-action ${msgStates[msg.id]?.reaction === 'up' ? 'text-[#22C55E]' : ''}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleReaction(msg.id, 'down')}
                            className={`aiq-msg-action ${msgStates[msg.id]?.reaction === 'down' ? 'text-[#EF4444]' : ''}`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleCopy(msg.id, msg.content)} className="aiq-msg-action">
                            {msgStates[msg.id]?.copied
                              ? <Check className="h-3 w-3 text-[#22C55E]" />
                              : <Copy className="h-3 w-3" />
                            }
                          </button>
                        </div>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="aiq-msg-footer aiq-msg-footer-user">
                        <span className="aiq-msg-time text-white/60">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="aiq-msg-avatar aiq-msg-avatar-user">
                      <span className="text-[10px] font-bold text-white">You</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="aiq-msg-row"
                >
                  <div className="aiq-msg-avatar aiq-msg-avatar-ai aiq-msg-avatar-ai-live">
                    <GlimmoraAIAvatar size={18} className="text-white" />
                  </div>
                  <div className="aiq-msg-bubble aiq-msg-bubble-ai">
                    <div className="flex items-center gap-1.5 py-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                          className="h-1.5 w-1.5 rounded-full bg-primary-500"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          {/* ── Suggested Prompts (6-card grid) ── */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mt-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-muted)] mb-3">Suggested questions</p>
                <div className="aiq-prompts-grid">
                  {SUGGESTED_QUESTIONS.map(({ icon: Icon, text, color }, i) => (
                    <motion.button
                      key={text}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      onClick={() => sendText(text)}
                      className="aiq-prompt-card"
                    >
                      <div className="aiq-prompt-icon" style={{ background: `${color}15`, color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-medium leading-snug text-[var(--fg-secondary)] mt-2 text-left">{text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input Bar ── */}
          <div className="aiq-input-bar sticky bottom-4 z-40 mt-4">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative flex-1 flex items-center">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  rows={1}
                  className="aiq-input-textarea"
                  style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
                />
                {/* Animated example-prompt overlay. Sits behind the cursor
                    while the textarea is empty; fades + slides between hints
                    so the bar feels interactive instead of static. */}
                {!input && !isListening && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={promptIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-1.5 select-none"
                      style={{
                        color: 'var(--fg-muted)',
                        fontSize: '14px',
                        fontStyle: 'italic',
                      }}
                    >
                      <motion.span
                        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-flex"
                        style={{ color: '#8B5A2B' }}
                      >
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                      </motion.span>
                      <span>{rotatingPrompts[promptIdx]}</span>
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {messages.length > 1 && !isTyping && (
                  <button onClick={handleRegenerate} className="aiq-input-regen" title="Regenerate last response">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                {/* Voice input — Web Speech API, client-side only. Pulse ring
                    + gold glow signal the "listening" state. Disabled when
                    the browser doesn't expose SpeechRecognition. */}
                <motion.button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={!voiceSupported}
                  aria-label={
                    !voiceSupported
                      ? 'Voice input not supported in this browser'
                      : isListening
                        ? 'Stop voice input'
                        : 'Voice Input'
                  }
                  aria-pressed={isListening}
                  title={
                    !voiceSupported
                      ? 'Voice input not supported in this browser'
                      : isListening
                        ? 'Listening — tap to stop'
                        : 'Voice Input'
                  }
                  whileHover={voiceSupported ? { scale: 1.06 } : undefined}
                  whileTap={voiceSupported ? { scale: 0.92 } : undefined}
                  animate={{ scale: isListening ? 1.06 : 1 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: isListening
                      ? 'rgba(139,115,85,0.18)'
                      : 'var(--bg-secondary)',
                    color: isListening ? '#8B5A2B' : 'var(--fg-secondary)',
                    border: `1px solid ${isListening ? 'rgba(139,115,85,0.55)' : 'var(--border)'}`,
                    boxShadow: isListening
                      ? '0 0 0 4px rgba(139,115,85,0.18), 0 0 18px rgba(139,115,85,0.35)'
                      : 'none',
                  }}
                >
                  {isListening && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ border: '2px solid rgba(139,115,85,0.55)' }}
                      animate={{ scale: [1, 1.8], opacity: [0.55, 0] }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <Mic className="h-3.5 w-3.5" />
                </motion.button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className={`aiq-input-send ${input.trim() && !isTyping ? 'active' : 'disabled'}`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            {(isTyping || isListening) && (
              <div className="px-4 pb-3 flex items-center justify-end gap-3">
                {isListening && (
                  <motion.span
                    animate={{ opacity: [1, 0.55, 1] }}
                    transition={{ duration: 1.0, repeat: Infinity }}
                    className="text-[10px] font-medium"
                    style={{ color: '#8B5A2B' }}
                  >
                    Listening…
                  </motion.span>
                )}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-[10px] text-primary-600 font-medium"
                  >
                    AI is thinking…
                  </motion.span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Insight Panel ── */}
        <div className="aiq-sidebar">

          {/* Top Recommendation */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="aiq-sidebar-card"
          >
            <div className="aiq-sidebar-card-header">
              <Trophy className="h-3.5 w-3.5 text-primary-600" />
              Top Recommendation
            </div>
            {topProp ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={topProp.images?.[0] || ''}
                      alt={topProp.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=80&fit=crop'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[var(--fg)] truncate">{topProp.title}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      {topProp.location.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[24px] font-bold text-primary-600 leading-none">{topProp.aiScore}</span>
                      <span className="text-[11px] text-[var(--fg-muted)]">/100</span>
                    </div>
                    <p className="text-[9px] text-[var(--fg-muted)] uppercase tracking-wide mt-0.5">AI Score</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className="aiq-badge aiq-badge-green">{topProp.rentalYield}% yield</span>
                    <span className="aiq-badge aiq-badge-amber">+{topProp.capitalAppreciation}% p.a.</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--fg-muted)]">Add properties to your shortlist to see the top recommendation.</p>
            )}
          </motion.div>

          {/* Portfolio Snapshot */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="aiq-sidebar-card"
          >
            <div className="aiq-sidebar-card-header">
              <BarChart3 className="h-3.5 w-3.5 text-primary-600" />
              Portfolio Snapshot
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Avg Yield',  value: `${avgYield}%`,        color: '#22C55E' },
                { label: 'Avg Growth', value: `${avgGrowth}%`,       color: '#F59E0B' },
                { label: 'Avg Score',  value: `${avgScore}`,         color: '#8B7355' },
                { label: 'Markets',    value: `${uniqueMarkets.length}`, color: '#A89478' },
              ].map(({ label, value, color }) => (
                <div key={label} className="aiq-sidebar-stat">
                  <span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">{label}</span>
                  <span className="text-[15px] font-bold mt-0.5" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="aiq-sidebar-card"
          >
            <div className="aiq-sidebar-card-header">
              <AlertCircle className="h-3.5 w-3.5 text-[#F59E0B]" />
              Risk Alerts
            </div>
            <div className="space-y-2.5">
              {RISK_ALERTS.map((alert, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: alert.severity === 'high' ? '#EF4444' : '#F59E0B' }}
                  />
                  <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">{alert.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trend Snapshot */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="aiq-sidebar-card"
          >
            <div className="aiq-sidebar-card-header">
              <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
              Trend Snapshot
            </div>
            <div className="space-y-3">
              {TREND_DATA.map((t) => (
                <div key={t.market}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-[var(--fg-secondary)]">{t.market}</span>
                    <span className="text-[11px] font-bold" style={{ color: t.color }}>+{t.growth}%</span>
                  </div>
                  <div className="aiq-trend-bar-bg">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.pct}%` }}
                      transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="aiq-trend-bar"
                      style={{ background: t.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Floating restore bubble (visible only while minimized) ──
          Re-expands the advisor without re-mounting the chat state. */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            type="button"
            onClick={() => setIsMinimized(false)}
            initial={{ opacity: 0, scale: 0.7, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Restore Glimmora AI advisor"
            title="Resume Glimmora AI"
            className="aiq-floating-bubble"
          >
            <span aria-hidden className="aiq-floating-bubble-pulse" />
            <GlimmoraAIAvatar size={24} className="text-white relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
