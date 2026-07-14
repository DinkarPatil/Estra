'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home, Eye, Plus, Edit2, Search, LayoutGrid, List,
  X, BedDouble, Bath, Maximize, MapPin, AlertCircle,
  Trash2, Loader2, CheckCircle2,
} from 'lucide-react';
import { brokerService } from '@/services';
import type { BrokerListing } from '@/services/interfaces/broker.interface';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'published' | 'draft' | 'sold';

function fmtINR(v: number): string {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { dot: string; label: string; cls: string }> = {
    published: { dot: 'bg-emerald-500', label: 'Published', cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    draft:     { dot: 'bg-amber-400',   label: 'Draft',     cls: 'text-amber-700  bg-amber-50  border-amber-100'  },
    sold:      { dot: 'bg-neutral-400', label: 'Sold',      cls: 'text-neutral-500 bg-neutral-50 border-neutral-200' },
  };
  const c = cfg[status] ?? { dot: 'bg-neutral-400', label: status, cls: 'text-neutral-600 bg-neutral-50 border-neutral-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ListingThumb({ src, title }: { src: string | null | undefined; title: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[var(--bg-secondary)]">
        <Home className="h-7 w-7 text-[var(--fg-muted)] opacity-30" />
        <span className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">No image</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={title} className="h-full w-full object-cover" />
  );
}

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createdId = searchParams.get('created');

  const [listings, setListings] = useState<BrokerListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await brokerService.listListings({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Show a confirmation toast when redirected from /new with ?created=<id>,
  // and strip the param so refresh doesn't re-toast.
  useEffect(() => {
    if (!createdId) return;
    setToast('Listing published. It is now live in the database.');
    const t = setTimeout(() => setToast(null), 3500);
    router.replace('/broker/listings');
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdId]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await brokerService.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const cities = useMemo(() => Array.from(new Set(listings.map((l) => l.city))), [listings]);

  const filtered = useMemo(() => {
    let rows = [...listings];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((l) =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.locality.toLowerCase().includes(q),
      );
    }
    if (cityFilter !== 'All') rows = rows.filter((l) => l.city === cityFilter);
    return rows;
  }, [listings, search, cityFilter]);

  const counts = useMemo(() => ({
    all: listings.length,
    published: listings.filter((l) => l.status === 'published').length,
    draft: listings.filter((l) => l.status === 'draft').length,
    sold: listings.filter((l) => l.status === 'sold').length,
  }), [listings]);

  const selCls = 'h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--fg)] outline-none focus:border-primary-500 cursor-pointer';

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700 shadow-xl">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">My Listings</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">
            {counts.published} published · {counts.draft} draft · {counts.sold} sold
          </p>
        </div>
        <Link
          href="/broker/listings/new"
          className="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Listing
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 mb-5">
        {([
          { key: 'all',       label: `All ${counts.all}` },
          { key: 'published', label: `Published ${counts.published}` },
          { key: 'draft',     label: `Draft ${counts.draft}` },
          { key: 'sold',      label: `Sold ${counts.sold}` },
        ] as { key: StatusFilter; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-[var(--fg)] text-[var(--card-bg)]'
                : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, city, locality…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--fg)] outline-none focus:border-primary-500"
          />
        </div>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selCls}>
          <option value="All">All Cities</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        {(search || cityFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCityFilter('All'); }}
            className="h-9 px-3 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] text-sm hover:bg-[var(--bg-secondary)] flex items-center gap-1.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        <div className="ml-auto flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-1 gap-0.5">
          {([{ v: 'grid' as ViewMode, icon: LayoutGrid }, { v: 'list' as ViewMode, icon: List }] as const).map(({ v, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                viewMode === v
                  ? 'bg-[var(--card-bg)] shadow-sm text-primary-600 border border-[var(--border)]'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-[var(--fg-muted)]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading listings…
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3">
            <Home className="h-5 w-5 text-[var(--fg-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--fg)]">No listings yet</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">Click <span className="font-semibold">New Listing</span> to add your first property.</p>
        </div>
      )}

      {!isLoading && viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <div key={l.id} className="group rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-bg)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="relative aspect-[16/10] bg-[var(--bg-secondary)] overflow-hidden">
                <ListingThumb src={l.cover_image} title={l.title} />
                <div className="absolute top-3 left-3 z-10"><StatusPill status={l.status} /></div>
                <p className="absolute bottom-3 left-3 text-white text-base font-bold drop-shadow-md">{fmtINR(l.price_inr)}</p>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--fg)] truncate">{l.title}</h3>
                <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />{l.locality}, {l.city}
                </p>
                <div className="flex items-center gap-3 text-xs text-[var(--fg-muted)] mt-3">
                  <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{l.bedrooms}</span>
                  {l.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{l.bathrooms}</span>}
                  <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{l.area_sqft.toLocaleString()} ft²</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider">{l.property_type}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                  <Link
                    href={`/broker/listings/${l.id}/edit`}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--fg)] hover:bg-[var(--bg-secondary)]"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                  <Link
                    href={`/broker/listings/${l.id}`}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--fg)] hover:bg-[var(--bg-secondary)]"
                  >
                    <Eye className="h-3 w-3" /> View
                  </Link>
                  <button
                    onClick={() => handleDelete(l.id, l.title)}
                    className="ml-auto flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && viewMode === 'list' && filtered.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="w-16 flex-shrink-0" />
            <span className="flex-1 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Property</span>
            <span className="hidden sm:block w-32 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide flex-shrink-0">Price</span>
            <span className="hidden md:block w-40 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide flex-shrink-0">Specs</span>
            <span className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide flex-shrink-0">Actions</span>
          </div>
          {filtered.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]">
              <div className="relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)]">
                <ListingThumb src={l.cover_image} title={l.title} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[var(--fg)] truncate">{l.title}</p>
                  <StatusPill status={l.status} />
                </div>
                <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />{l.locality}, {l.city}
                </p>
              </div>
              <div className="hidden sm:block w-32 flex-shrink-0">
                <p className="text-sm font-bold text-[var(--fg)]">{fmtINR(l.price_inr)}</p>
                <p className="text-[10px] text-[var(--fg-muted)]">{l.property_type}</p>
              </div>
              <div className="hidden md:flex items-center gap-3 w-40 flex-shrink-0 text-xs text-[var(--fg-muted)]">
                <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{l.bedrooms}</span>
                {l.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{l.bathrooms}</span>}
                <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{l.area_sqft.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/broker/listings/${l.id}`}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--fg-muted)] hover:bg-[var(--bg-secondary)]"
                  title="View"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/broker/listings/${l.id}/edit`}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--fg-muted)] hover:bg-[var(--bg-secondary)]"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => handleDelete(l.id, l.title)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
