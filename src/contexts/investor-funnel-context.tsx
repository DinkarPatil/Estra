'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */

/** Structured intent captured on Smart Search (step 1). Drives every downstream step. */
export interface InvestorIntent {
  /** Free-text query (kept as AI context even when structured fields are set) */
  rawQuery: string;
  /** Maximum budget in USD. null = "any". */
  budgetMaxUsd: number | null;
  /** Target annual ROI (%). null = "any". Matched against yield + appreciation. */
  roiTargetPct: number | null;
  /** Tolerated risk level. 'any' = no filter. */
  riskTolerance: 'low' | 'medium' | 'high' | 'any';
  /** Target city. 'any' = no geo filter. */
  locationCity: string | null;
}

const EMPTY_INTENT: InvestorIntent = {
  rawQuery: '',
  budgetMaxUsd: null,
  roiTargetPct: null,
  riskTolerance: 'any',
  locationCity: null,
};

/** An intent is "captured" (step 1 complete) when the user has expressed SOMETHING:
 *  a location, a budget, an ROI target, a non-any risk preference, or a free-text query. */
export function isIntentCaptured(i: InvestorIntent): boolean {
  return Boolean(
    i.locationCity ||
    i.budgetMaxUsd ||
    i.roiTargetPct ||
    (i.riskTolerance && i.riskTolerance !== 'any') ||
    (i.rawQuery && i.rawQuery.trim().length > 0),
  );
}

export interface FunnelState {
  /** Structured intent. Replaces the old free-text-only searchQuery as the source of truth. */
  intent: InvestorIntent;
  /** Areas shortlisted for comparison (2–3) */
  selectedAreaIds: string[];
  /** Names of selected areas (parallel to selectedAreaIds) — needed to call backend
   *  endpoints like /orchestrator/analyze that key by exact area_name and can't
   *  reverse a slug. */
  selectedAreaNames: string[];
  /** The ONE final area chosen on the Compare page — drives Properties filtering */
  selectedAreaId: string | null;
  /** (Legacy) multi-property shortlist — retained so older routes don't break */
  selectedPropertyIds: string[];
  /** The ONE property chosen on the Properties page — drives AI Q&A + lead creation */
  selectedPropertyId: string | null;
  currentStep: number;
  completedSteps: number[];
}

interface FunnelContextType extends FunnelState {
  /** @deprecated use intent.rawQuery */
  searchQuery: string;
  setIntent: (patch: Partial<InvestorIntent>) => void;
  resetIntent: () => void;
  /** @deprecated call setIntent({ rawQuery }) */
  setSearchQuery: (q: string) => void;
  toggleArea: (id: string, name?: string) => void;
  selectAreaFinal: (id: string | null) => void;
  toggleProperty: (id: string) => void;
  selectPropertyFinal: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  resetFunnel: () => void;
  clearAreas: () => void;
  clearProperties: () => void;
}

const INITIAL_STATE: FunnelState = {
  intent: EMPTY_INTENT,
  selectedAreaIds: [],
  selectedAreaNames: [],
  selectedAreaId: null,
  selectedPropertyIds: [],
  selectedPropertyId: null,
  currentStep: 1,
  completedSteps: [],
};

const STORAGE_KEY = 'glimmora-funnel';
const FunnelContext = createContext<FunnelContextType | undefined>(undefined);

/* ══════════════════════════════════════
   PROVIDER
   ══════════════════════════════════════ */

export function InvestorFunnelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FunnelState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FunnelState> & { searchQuery?: string };
        // Backfill: older persisted state may have `searchQuery` but no `intent`
        const intent: InvestorIntent = parsed.intent
          ? { ...EMPTY_INTENT, ...parsed.intent }
          : parsed.searchQuery
            ? { ...EMPTY_INTENT, rawQuery: parsed.searchQuery }
            : EMPTY_INTENT;
        // Backfill: older persisted state may have selectedAreaIds but no names
        const selectedAreaNames =
          parsed.selectedAreaNames && parsed.selectedAreaNames.length === parsed.selectedAreaIds?.length
            ? parsed.selectedAreaNames
            : (parsed.selectedAreaIds ?? []);
        setState({ ...INITIAL_STATE, ...parsed, intent, selectedAreaNames });
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state, hydrated]);

  const setIntent = useCallback((patch: Partial<InvestorIntent>) => {
    setState(prev => ({ ...prev, intent: { ...prev.intent, ...patch } }));
  }, []);

  const resetIntent = useCallback(() => {
    setState(prev => ({ ...prev, intent: EMPTY_INTENT }));
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setState(prev => ({ ...prev, intent: { ...prev.intent, rawQuery: q } }));
  }, []);

  const toggleArea = useCallback((id: string, name?: string) => {
    setState(prev => {
      const exists = prev.selectedAreaIds.includes(id);
      if (exists) {
        const idx = prev.selectedAreaIds.indexOf(id);
        const nextIds = prev.selectedAreaIds.filter(a => a !== id);
        const nextNames = prev.selectedAreaNames.filter((_, i) => i !== idx);
        const clearFinal = prev.selectedAreaId === id;
        return {
          ...prev,
          selectedAreaIds: nextIds,
          selectedAreaNames: nextNames,
          selectedAreaId: clearFinal ? null : prev.selectedAreaId,
        };
      }
      if (prev.selectedAreaIds.length >= 3) return prev;
      return {
        ...prev,
        selectedAreaIds: [...prev.selectedAreaIds, id],
        selectedAreaNames: [...prev.selectedAreaNames, name ?? id],
      };
    });
  }, []);

  const selectAreaFinal = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedAreaId: id,
      // Changing the chosen area invalidates any chosen property
      selectedPropertyId:
        id && prev.selectedPropertyId ? null : prev.selectedPropertyId,
    }));
  }, []);

  const toggleProperty = useCallback((id: string) => {
    setState(prev => {
      const exists = prev.selectedPropertyIds.includes(id);
      if (exists) return { ...prev, selectedPropertyIds: prev.selectedPropertyIds.filter(p => p !== id) };
      if (prev.selectedPropertyIds.length >= 5) return prev;
      return { ...prev, selectedPropertyIds: [...prev.selectedPropertyIds, id] };
    });
  }, []);

  const selectPropertyFinal = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedPropertyId: id }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const completeStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
    }));
  }, []);

  const resetFunnel = useCallback(() => {
    setState(INITIAL_STATE);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const clearAreas = useCallback(() => {
    setState(prev => ({ ...prev, selectedAreaIds: [], selectedAreaNames: [], selectedAreaId: null }));
  }, []);

  const clearProperties = useCallback(() => {
    setState(prev => ({ ...prev, selectedPropertyIds: [], selectedPropertyId: null }));
  }, []);

  return (
    <FunnelContext.Provider
      value={{
        ...state,
        searchQuery: state.intent.rawQuery,
        setIntent,
        resetIntent,
        setSearchQuery,
        toggleArea,
        selectAreaFinal,
        toggleProperty,
        selectPropertyFinal,
        setCurrentStep,
        completeStep,
        resetFunnel,
        clearAreas,
        clearProperties,
      }}
    >
      {children}
    </FunnelContext.Provider>
  );
}

/* ══════════════════════════════════════
   HOOK
   ══════════════════════════════════════ */

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error('useFunnel must be used within InvestorFunnelProvider');
  return ctx;
}
