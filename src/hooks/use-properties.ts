'use client';

import { useEffect, useState } from 'react';
import type { Property } from '@/types/property';
import { ApiError } from '@/lib/api';
import {
  getProperty,
  listProperties,
  type ListPropertiesParams,
} from '@/lib/api/properties';

interface PropertiesState {
  properties: Property[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useProperties(params: ListPropertiesParams = {}): PropertiesState {
  const [state, setState] = useState<PropertiesState>({
    properties: [],
    total: 0,
    loading: true,
    error: null,
  });

  // Stable key so callers don't have to memoize params
  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    listProperties(params)
      .then((res) => {
        if (cancelled) return;
        setState({
          properties: res.items,
          total: res.total,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.detail : 'Failed to load properties';
        setState({ properties: [], total: 0, loading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

interface PropertyState {
  property: Property | null;
  loading: boolean;
  error: string | null;
}

export function useProperty(id: string | null | undefined): PropertyState {
  const [state, setState] = useState<PropertyState>({
    property: null,
    loading: !!id,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ property: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ property: null, loading: true, error: null });

    getProperty(id)
      .then((p) => {
        if (cancelled) return;
        setState({ property: p, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.detail : 'Failed to load property';
        setState({ property: null, loading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
