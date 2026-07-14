'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle, X, Building2 } from 'lucide-react';
import { ALL_DEAL_IDS, NEGOTIATION_META } from '@/lib/negotiations-store';
import type { NegotiationState } from '@/lib/negotiations-store';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';

/* ── internal constants ──────────────────────────────────────────────────── */

const LS_KEY = (id: string) => `estra_neg_${id}`;
const SYNC_EVENT = 'estra-neg-sync';
const TOAST_DURATION = 6000; // ms

/* ── types ───────────────────────────────────────────────────────────────── */

interface ToastItem {
  id: number;
  type: 'message' | 'accepted' | 'counter';
  title: string;
  body: string;
  sub?: string;
}

interface DealSnapshot {
  brokerMsgCount: number;
  status: string;
}

/* ── progress bar (auto-dismiss indicator) ───────────────────────────────── */

function ProgressBar({ duration }: { duration: number }) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
      style={{ background: 'linear-gradient(90deg, #8B7355, #C4A882)' }}
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: duration / 1000, ease: 'linear' }}
    />
  );
}

/* ── single toast card ───────────────────────────────────────────────────── */

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const icons = {
    message:  <MessageSquare className="h-[17px] w-[17px]" style={{ color: '#8B7355' }} strokeWidth={1.75} />,
    accepted: <CheckCircle   className="h-[17px] w-[17px]" style={{ color: '#7A9A7A' }} strokeWidth={1.75} />,
    counter:  <Building2     className="h-[17px] w-[17px]" style={{ color: '#9E7B4A' }} strokeWidth={1.75} />,
  };
  const iconBg = {
    message:  'rgba(139,115,85,0.09)',
    accepted: 'rgba(122,154,122,0.09)',
    counter:  'rgba(158,123,74,0.09)',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 64, scale: 0.90, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.94, y: 16, filter: 'blur(2px)', transition: { duration: 0.22 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 260, mass: 0.9 }}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        background: '#FFFFFF',
        borderColor: 'rgba(139,115,85,0.13)',
        boxShadow: [
          '0 20px 60px rgba(0,0,0,0.09)',
          '0 8px 24px rgba(139,115,85,0.07)',
          '0 1px 0 rgba(255,255,255,0.9) inset',
          '0 0 0 1px rgba(139,115,85,0.05)',
        ].join(', '),
        width: 360,
      }}
    >
      {/* Subtle top shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(196,168,130,0.35), transparent)' }}
      />

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
          style={{ background: iconBg[toast.type] }}
        >
          {icons[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <p
            className="text-[12.5px] font-semibold leading-snug"
            style={{ color: '#4E3C2B', letterSpacing: '-0.01em' }}
          >
            {toast.title}
          </p>
          <p
            className="mt-0.5 text-[11px] leading-relaxed line-clamp-2"
            style={{ color: '#9E8870' }}
          >
            {toast.body}
          </p>
          {toast.sub && (
            <p className="mt-1 text-[10px] font-medium" style={{ color: '#C4A882' }}>
              {toast.sub}
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="shrink-0 mt-0.5 cursor-pointer rounded-lg p-1 transition-opacity hover:opacity-50"
          style={{ color: '#C4A882' }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar duration={TOAST_DURATION} />
    </motion.div>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

export function NegotiationNotifications() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef   = useRef(0);
  const prevSnaps    = useRef<Record<string, DealSnapshot>>({});
  const watchIdsRef  = useRef<string[]>([]);

  /* resolve watch IDs: static + pipeline */
  const { leads } = useLeadPipeline();
  useEffect(() => {
    const pipelineIds = leads
      .filter(l => l.propertyId && l.propertyId !== 'legacy-unknown' && !ALL_DEAL_IDS.includes(l.propertyId))
      .map(l => l.propertyId)
      .filter((id, i, arr) => arr.indexOf(id) === i);
    watchIdsRef.current = [...ALL_DEAL_IDS, ...pipelineIds];
  }, [leads]);

  /* stable add-toast helper via ref so event handlers don't go stale */
  function addToast(item: Omit<ToastItem, 'id'>) {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { ...item, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION + 400);
  }
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; });

  function dismiss(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  /* core change-detection */
  function checkChanges(dealId: string, fresh: NegotiationState) {
    const brokerMsgCount = fresh.messages.filter(m => m.sender === 'Broker').length;
    const prev = prevSnaps.current[dealId];

    if (!prev) {
      // First time seeing this deal — set baseline, don't fire toast
      prevSnaps.current[dealId] = { brokerMsgCount, status: fresh.status };
      return;
    }

    // New broker message(s)
    if (brokerMsgCount > prev.brokerMsgCount) {
      const latestMsg = [...fresh.messages].reverse().find(m => m.sender === 'Broker');
      const propName  = NEGOTIATION_META[dealId]?.property;
      addToastRef.current({
        type:  'message',
        title: 'New message from your broker',
        body:  latestMsg?.text ?? 'You have a new message.',
        sub:   propName ? `Re: ${propName}` : undefined,
      });
    }

    // Deal accepted
    if (prev.status !== 'accepted' && fresh.status === 'accepted') {
      const propName = NEGOTIATION_META[dealId]?.property;
      addToastRef.current({
        type:  'accepted',
        title: 'Offer Accepted',
        body:  'Your offer has been accepted. The deal is now confirmed.',
        sub:   propName ? propName : undefined,
      });
    }

    // Counter offer received (seller updated asking price)
    if (prev.status === 'active' && fresh.status === 'active' && fresh.history.length > (
      // Only if seller added a round
      prev.brokerMsgCount === brokerMsgCount && fresh.history.some(h => h.by === 'Seller')
        ? fresh.history.length - 1
        : fresh.history.length
    )) {
      // skip — seller counter round detection is handled via status/message path for now
    }

    prevSnaps.current[dealId] = { brokerMsgCount, status: fresh.status };
  }

  /* set up listeners */
  useEffect(() => {
    // Initialize snapshots from current localStorage (baseline = what's already stored)
    for (const id of watchIdsRef.current) {
      try {
        const raw = localStorage.getItem(LS_KEY(id));
        if (raw) {
          const s = JSON.parse(raw) as NegotiationState;
          prevSnaps.current[id] = {
            brokerMsgCount: s.messages.filter(m => m.sender === 'Broker').length,
            status: s.status,
          };
        }
      } catch { /* ignore */ }
    }

    // Cross-tab: native storage event
    const storageHandler = (e: StorageEvent) => {
      const id = watchIdsRef.current.find(id => e.key === LS_KEY(id));
      if (id && e.newValue) {
        try { checkChanges(id, JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };

    // Same-tab: custom event from save()
    const syncHandler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; payload: string }>;
      if (watchIdsRef.current.includes(ce.detail.id)) {
        try { checkChanges(ce.detail.id, JSON.parse(ce.detail.payload)); } catch { /* ignore */ }
      }
    };

    // Polling fallback (2 s) — catches pipeline deals and any missed events
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

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse items-center gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Negotiation notifications"
    >
      <AnimatePresence mode="sync">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
