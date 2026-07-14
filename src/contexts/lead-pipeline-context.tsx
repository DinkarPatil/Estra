'use client';

/**
 * Cross-role lead pipeline.
 *
 * Investor actions create leads here; Broker dashboard reads from the same
 * store. Persisted to localStorage so state survives route navigation (no
 * backend in this slice). Seeded with legacy brokerLeads on first load so
 * the broker page isn't empty before any investor action.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { brokerLeads } from '@/mock-data/market-data';
import type {
  CreateLeadInput,
  IntentLevel,
  Lead,
  LeadEvent,
  LeadEventType,
  LeadStage,
} from '@/types/lead';

const STORAGE_KEY = 'glimmora:leads:v1';
const SEEDED_FLAG = 'glimmora:leads:seeded:v1';

/* ── Helpers ── */

function uid(prefix = 'lead'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function eventUid(): string {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Map legacy brokerLeads "status" → our pipeline model. */
function seedFromLegacy(): Lead[] {
  const now = new Date().toISOString();
  const intentByScore: Record<'hot' | 'warm' | 'cold', IntentLevel> = {
    hot: 'high',
    warm: 'medium',
    cold: 'low',
  };
  return brokerLeads.map((l): Lead => {
    const intent = intentByScore[l.status];
    return {
      id: l.id,
      propertyId: 'legacy-unknown',
      propertyName: `${l.interest} · ${l.location}`,
      propertyLocation: l.location,
      investorId: l.id,
      investorName: l.name,
      investorEmail: l.email,
      investorPhone: l.phone,
      investorBudget: { amount: l.budget.amount, currency: l.budget.currency },
      intentLevel: intent,
      aiScore: l.score,
      stage: 'new',
      source: 'legacy-mock',
      createdAt: l.createdAt,
      updatedAt: now,
      history: [
        {
          id: eventUid(),
          at: l.createdAt,
          type: 'created',
          byRole: 'system',
          message: 'Seeded from legacy mock data',
        },
      ],
    };
  });
}

/* ── Context shape ── */

interface LeadPipelineContextValue {
  leads: Lead[];
  isHydrated: boolean;
  createLead: (input: CreateLeadInput) => Lead;
  updateLeadStage: (id: string, stage: LeadStage, reason?: string) => void;
  logAction: (id: string, type: LeadEventType, message?: string) => void;
  addNote: (id: string, note: string) => void;
  getLeadById: (id: string) => Lead | undefined;
  clearAll: () => void;
  /** Counts per stage — useful for pipeline tabs */
  countsByStage: Record<LeadStage, number>;
}

const LeadCtx = createContext<LeadPipelineContextValue | undefined>(undefined);

/* ── Provider ── */

export function LeadPipelineProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage; seed on first run
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLeads(JSON.parse(stored));
      } else if (!localStorage.getItem(SEEDED_FLAG)) {
        const seeded = seedFromLegacy();
        setLeads(seeded);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        localStorage.setItem(SEEDED_FLAG, '1');
      }
    } catch {
      /* ignore storage errors */
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      /* ignore */
    }
  }, [leads, isHydrated]);

  const createLead = useCallback((input: CreateLeadInput): Lead => {
    const now = new Date().toISOString();
    // Derive AI score if not supplied — weighted by intent + budget presence
    const baseScore =
      input.intentLevel === 'high' ? 85 : input.intentLevel === 'medium' ? 68 : 48;
    const budgetBonus = input.investorBudget?.amount ? 6 : 0;
    const aiScore = input.aiScore ?? Math.min(99, baseScore + budgetBonus);

    const lead: Lead = {
      id: uid(),
      propertyId: input.propertyId,
      propertyName: input.propertyName,
      propertyLocation: input.propertyLocation,
      propertyPrice: input.propertyPrice,
      investorId: input.investorId,
      investorName: input.investorName,
      investorEmail: input.investorEmail,
      investorPhone: input.investorPhone,
      investorBudget: input.investorBudget,
      intentLevel: input.intentLevel,
      aiScore,
      stage: 'new',
      source: input.source,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: eventUid(),
          at: now,
          type: 'created',
          byRole: 'investor',
          message:
            input.source === 'invest-now'
              ? 'Investor clicked "Invest Now"'
              : input.source === 'contact-broker'
                ? 'Investor requested broker contact'
                : 'Lead created',
        },
      ],
    };
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, []);

  const updateLeadStage = useCallback((id: string, stage: LeadStage, reason?: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (l.stage === stage) return l;
        const now = new Date().toISOString();
        const evt: LeadEvent = {
          id: eventUid(),
          at: now,
          type: stage === 'closed' ? 'marked-as-deal' : 'stage-change',
          byRole: 'broker',
          message: reason ?? `Moved to ${stage}`,
        };
        return {
          ...l,
          stage,
          updatedAt: now,
          history: [evt, ...l.history],
        };
      }),
    );
  }, []);

  const logAction = useCallback(
    (id: string, type: LeadEventType, message?: string) => {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const now = new Date().toISOString();
          const evt: LeadEvent = { id: eventUid(), at: now, type, byRole: 'broker', message };
          return { ...l, updatedAt: now, history: [evt, ...l.history] };
        }),
      );
    },
    [],
  );

  const addNote = useCallback((id: string, note: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const now = new Date().toISOString();
        return {
          ...l,
          notes: note,
          updatedAt: now,
          history: [
            { id: eventUid(), at: now, type: 'note', byRole: 'broker', message: note },
            ...l.history,
          ],
        };
      }),
    );
  }, []);

  const getLeadById = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads],
  );

  const clearAll = useCallback(() => {
    setLeads([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SEEDED_FLAG);
    } catch {
      /* ignore */
    }
  }, []);

  const countsByStage = useMemo<Record<LeadStage, number>>(() => {
    const acc: Record<LeadStage, number> = { new: 0, contacted: 0, negotiation: 0, closed: 0 };
    for (const l of leads) acc[l.stage]++;
    return acc;
  }, [leads]);

  return (
    <LeadCtx.Provider
      value={{
        leads,
        isHydrated,
        createLead,
        updateLeadStage,
        logAction,
        addNote,
        getLeadById,
        clearAll,
        countsByStage,
      }}
    >
      {children}
    </LeadCtx.Provider>
  );
}

/* ── Hook ── */

export function useLeadPipeline(): LeadPipelineContextValue {
  const ctx = useContext(LeadCtx);
  if (!ctx) {
    throw new Error('useLeadPipeline must be used within LeadPipelineProvider');
  }
  return ctx;
}
