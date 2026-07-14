'use client';
import { useState, useEffect, useCallback } from 'react';

/* ── types ── */
export type MessageSender = 'Broker' | 'Investor';

export interface NegMessage {
  id: number;
  sender: MessageSender;
  text: string;
  time: string;
}

export interface NegotiationState {
  messages: NegMessage[];
  status: 'active' | 'stalled' | 'accepted' | 'closed';
  currentOffer: number;
  counterOffer: number;
  dealScore: number;
  history: {
    round: number;
    offer: number;
    date: string;
    by: 'Buyer' | 'Seller';
    notes?: string;
  }[];
}

/* ── seed data — keyed by property ID ── */
const SEED: Record<string, NegotiationState> = {
  'prop-001': {
    status: 'active',
    currentOffer: 4600000,
    counterOffer: 4800000,
    dealScore: 72,
    history: [
      { round: 1, offer: 4200000, date: '2026-03-18', by: 'Buyer' },
      { round: 2, offer: 4800000, date: '2026-03-20', by: 'Seller' },
      { round: 3, offer: 4600000, date: '2026-03-22', by: 'Buyer' },
    ],
    messages: [
      { id: 1, sender: 'Broker', text: "Hello! I'm your assigned broker for this property. I've reviewed your investment profile and I'm confident we can structure a strong offer. How can I help you today?", time: '9:14 AM' },
    ],
  },
  'prop-002': {
    status: 'active',
    currentOffer: 14500000,
    counterOffer: 15000000,
    dealScore: 85,
    history: [
      { round: 1, offer: 13000000, date: '2026-03-10', by: 'Buyer' },
      { round: 2, offer: 15000000, date: '2026-03-12', by: 'Seller' },
      { round: 3, offer: 14500000, date: '2026-03-15', by: 'Buyer' },
    ],
    messages: [
      { id: 1, sender: 'Investor', text: 'We are very interested but need some flexibility on the price.', time: '10:14 AM' },
      { id: 2, sender: 'Broker', text: "Understood. I'll present your offer to the seller today.", time: '10:32 AM' },
    ],
  },
  'prop-003': {
    status: 'stalled',
    currentOffer: 3200000,
    counterOffer: 3500000,
    dealScore: 55,
    history: [
      { round: 1, offer: 3000000, date: '2026-03-05', by: 'Buyer' },
      { round: 2, offer: 3500000, date: '2026-03-08', by: 'Seller' },
      { round: 3, offer: 3200000, date: '2026-03-14', by: 'Buyer' },
    ],
    messages: [
      { id: 1, sender: 'Investor', text: "We're at our limit. Is there any room for negotiation?", time: '03:20 PM' },
      { id: 2, sender: 'Broker', text: 'The seller is considering a fit-out allowance. Let me get back to you.', time: '04:01 PM' },
    ],
  },
};

const LS_KEY = (id: string) => `estra_neg_${id}`;

/** Empty-state for pipeline deals that haven't had an offer submitted yet */
const FALLBACK_STATE: NegotiationState = {
  messages: [],
  status: 'active',
  currentOffer: 0,
  counterOffer: 0,
  dealScore: 0,
  history: [],
};

function load(id: string): NegotiationState {
  if (typeof window === 'undefined') return SEED[id] ?? FALLBACK_STATE;
  try {
    const raw = localStorage.getItem(LS_KEY(id));
    if (raw) return JSON.parse(raw) as NegotiationState;
  } catch { /* ignore */ }
  return SEED[id] ?? FALLBACK_STATE;
}

const SYNC_EVENT = 'estra-neg-sync';

function save(id: string, state: NegotiationState) {
  try {
    const json = JSON.stringify(state);
    // Fires native 'storage' event in all OTHER tabs automatically
    localStorage.setItem(LS_KEY(id), json);
    // Broadcast to other useNegotiation subscribers in the SAME tab
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { id, payload: json } }));
  } catch { /* ignore */ }
}

/* ── hook ── */
export function useNegotiation(id: string) {
  const [state, setState] = useState<NegotiationState>(() => SEED[id] ?? FALLBACK_STATE);

  // Hydrate from localStorage after first mount
  useEffect(() => {
    setState(load(id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync from OTHER tabs (native storage event)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY(id) && e.newValue) {
        try { setState(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [id]);

  // Sync from SAME tab (other components using the same deal ID)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; payload: string }>;
      if (ce.detail.id === id) {
        try { setState(JSON.parse(ce.detail.payload)); } catch { /* ignore */ }
      }
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [id]);

  // Poll localStorage every 2 s as a failsafe (covers same-tab navigation where
  // the storage event doesn't fire and CustomEvent wasn't dispatched in this instance)
  useEffect(() => {
    const interval = setInterval(() => {
      const raw = localStorage.getItem(LS_KEY(id));
      if (!raw) return;
      try {
        const fresh = JSON.parse(raw) as NegotiationState;
        setState(prev => {
          if (
            prev.messages.length !== fresh.messages.length ||
            prev.status !== fresh.status ||
            prev.dealScore !== fresh.dealScore ||
            prev.currentOffer !== fresh.currentOffer
          ) return fresh;
          return prev;
        });
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const update = useCallback((patch: Partial<NegotiationState> | ((prev: NegotiationState) => NegotiationState)) => {
    setState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      // Defer save so dispatchEvent never fires inside a setState updater,
      // which would cause "setState during rendering" in sibling subscribers.
      setTimeout(() => save(id, next), 0);
      return next;
    });
  }, [id]);

  const sendMessage = useCallback((text: string, sender: MessageSender) => {
    update((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: prev.messages.length + 1,
          sender,
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
  }, [update]);

  const editMessage = useCallback((messageId: number, newText: string) => {
    update((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === messageId ? { ...m, text: newText } : m
      ),
    }));
  }, [update]);

  return { state, update, sendMessage, editMessage };
}

/* ── metadata (static, keyed by property ID) ── */
export const NEGOTIATION_META: Record<string, {
  property: string;
  investor: string;
  currency: string;
  location: string;
  type: string;
  bedrooms: number;
  area: number;
  aiRecommendation: string;
}> = {
  'prop-001': {
    property: 'Marina Bay Penthouse',
    investor: 'Arjun Mehta',
    currency: 'USD',
    location: 'Dubai Marina, Dubai, UAE',
    type: 'Penthouse',
    bedrooms: 4,
    area: 5200,
    aiRecommendation: 'Counter at $4,700,000. Buyer is price-sensitive but highly motivated. Due diligence is nearly complete — a small concession here will accelerate closing.',
  },
  'prop-002': {
    property: 'Palm Jumeirah Villa',
    investor: 'Khalid Al-Rashid',
    currency: 'AED',
    location: 'Palm Jumeirah, Dubai, UAE',
    type: 'Luxury Villa',
    bedrooms: 6,
    area: 9500,
    aiRecommendation: 'Accept counter offer — market comps support asking price. Buyer has high intent score (95). Consider offering flexible payment plan to close deal faster.',
  },
  'prop-003': {
    property: 'Downtown Dubai Office Tower',
    investor: 'Sofia Andersson',
    currency: 'AED',
    location: 'Downtown Dubai, UAE',
    type: 'Commercial Office',
    bedrooms: 0,
    area: 8000,
    aiRecommendation: 'Hold firm on asking price. Recent commercial transactions in Downtown Dubai show strong demand. Offer incentives (fit-out allowance) instead of price reduction.',
  },
};

export const ALL_DEAL_IDS = Object.keys(NEGOTIATION_META);
