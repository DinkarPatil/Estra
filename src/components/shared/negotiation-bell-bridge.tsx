'use client';

/**
 * NegotiationBellBridge
 *
 * Silently watches all negotiation states (static deals + pipeline deals) and
 * injects AppNotifications into the bell panel when relevant events occur:
 *
 *  • broker role  → fires when an investor sends a new message
 *  • investor role → fires when a broker sends a message or accepts a deal
 *
 * This component renders nothing — it's mounted purely for its side-effects.
 */

import { useEffect, useRef } from 'react';
import { ALL_DEAL_IDS, NEGOTIATION_META } from '@/lib/negotiations-store';
import type { NegotiationState } from '@/lib/negotiations-store';
import { useNotifications } from '@/contexts/notification-context';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import { useAuth } from '@/contexts/auth-context';

const LS_KEY = (id: string) => `estra_neg_${id}`;
const SYNC_EVENT = 'estra-neg-sync';

interface DealSnap {
  investorMsgCount: number;
  brokerMsgCount: number;
  status: string;
}

export function NegotiationBellBridge() {
  const { addNotification } = useNotifications();
  const { leads }           = useLeadPipeline();
  const { user }            = useAuth();

  const prevSnaps         = useRef<Record<string, DealSnap>>({});
  const watchIdsRef       = useRef<string[]>([]);
  const addNotifRef       = useRef(addNotification);
  const userRef           = useRef(user);

  useEffect(() => { addNotifRef.current = addNotification; });
  useEffect(() => { userRef.current = user; });

  /* keep watchIds in sync with pipeline leads */
  useEffect(() => {
    const pipelineIds = leads
      .filter(l => l.propertyId && l.propertyId !== 'legacy-unknown' && !ALL_DEAL_IDS.includes(l.propertyId))
      .map(l => l.propertyId)
      .filter((id, i, arr) => arr.indexOf(id) === i);
    watchIdsRef.current = [...ALL_DEAL_IDS, ...pipelineIds];
  }, [leads]);

  /* core change-detection — runs inside event handlers / interval so uses refs */
  function checkChanges(dealId: string, fresh: NegotiationState) {
    const role            = userRef.current?.role;
    const brokerMsgCount  = fresh.messages.filter(m => m.sender === 'Broker').length;
    const investorMsgCount = fresh.messages.filter(m => m.sender === 'Investor').length;
    const prev            = prevSnaps.current[dealId];

    if (!prev) {
      prevSnaps.current[dealId] = { brokerMsgCount, investorMsgCount, status: fresh.status };
      return;
    }

    const propName   = NEGOTIATION_META[dealId]?.property ?? 'your property';
    const investorName = NEGOTIATION_META[dealId]?.investor ?? 'Investor';

    if (role === 'investor') {
      /* New broker message */
      if (brokerMsgCount > prev.brokerMsgCount) {
        const latest = [...fresh.messages].reverse().find(m => m.sender === 'Broker');
        addNotifRef.current({
          type:      'transaction',
          title:     'New message from your broker',
          message:   latest?.text ?? 'Your broker sent a new message.',
          actionUrl: '/investor/negotiations',
        });
      }
      /* Deal accepted */
      if (prev.status !== 'accepted' && fresh.status === 'accepted') {
        addNotifRef.current({
          type:      'transaction',
          title:     'Offer Accepted!',
          message:   `Your offer on ${propName} has been accepted. The deal is now confirmed.`,
          actionUrl: '/investor/negotiations',
        });
      }
    } else if (role === 'broker') {
      /* New investor message */
      if (investorMsgCount > prev.investorMsgCount) {
        const latest = [...fresh.messages].reverse().find(m => m.sender === 'Investor');
        addNotifRef.current({
          type:      'transaction',
          title:     `Message from ${investorName}`,
          message:   latest?.text ?? 'An investor sent you a new message.',
          actionUrl: '/broker/negotiations',
        });
      }
    }

    prevSnaps.current[dealId] = { brokerMsgCount, investorMsgCount, status: fresh.status };
  }

  useEffect(() => {
    /* Initialize baselines from current localStorage */
    for (const id of watchIdsRef.current) {
      try {
        const raw = localStorage.getItem(LS_KEY(id));
        if (raw) {
          const s = JSON.parse(raw) as NegotiationState;
          prevSnaps.current[id] = {
            brokerMsgCount:   s.messages.filter(m => m.sender === 'Broker').length,
            investorMsgCount: s.messages.filter(m => m.sender === 'Investor').length,
            status:           s.status,
          };
        }
      } catch { /* ignore */ }
    }

    /* Cross-tab: native storage event */
    const storageHandler = (e: StorageEvent) => {
      const id = watchIdsRef.current.find(id => e.key === LS_KEY(id));
      if (id && e.newValue) {
        try { checkChanges(id, JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };

    /* Same-tab: custom event fired by save() in negotiations-store.ts */
    const syncHandler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; payload: string }>;
      if (watchIdsRef.current.includes(ce.detail.id)) {
        try { checkChanges(ce.detail.id, JSON.parse(ce.detail.payload)); } catch { /* ignore */ }
      }
    };

    /* Polling fallback every 2 s — catches pipeline deals and missed events */
    const interval = setInterval(() => {
      for (const id of watchIdsRef.current) {
        try {
          const raw = localStorage.getItem(LS_KEY(id));
          if (raw) checkChanges(id, JSON.parse(raw));
        } catch { /* ignore */ }
      }
    }, 2000);

    window.addEventListener('storage', storageHandler);
    window.addEventListener(SYNC_EVENT, syncHandler as EventListener);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener(SYNC_EVENT, syncHandler as EventListener);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
