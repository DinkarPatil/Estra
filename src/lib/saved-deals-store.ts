'use client';

import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'estra_saved_deals';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {}
}

/** Shared hook — reads/writes saved property IDs in localStorage.
 *  Consistent across Properties listing, Property detail, and Saved Deals page. */
export function useSavedDeals() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    setSavedIds(readIds());
  }, []);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds],
  );

  const toggleSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeIds(next);
      return next;
    });
  }, []);

  const removeSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      writeIds(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSavedIds([]);
    writeIds([]);
  }, []);

  return {
    savedIds,
    count: savedIds.length,
    isSaved,
    toggleSave,
    removeSave,
    clearAll,
  };
}
