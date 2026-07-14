'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit2, Trash2, MapPin, BedDouble, Bath, Maximize, Home,
  AlertCircle, Loader2, ExternalLink, Tag, Building2, Calendar,
} from 'lucide-react';
import { brokerService } from '@/services';
import type { BrokerListingDetail } from '@/services/interfaces/broker.interface';

function fmtINR(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(2)} L`;
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

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[var(--fg)]">{value ?? '—'}</p>
    </div>
  );
}

export default function ListingViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<BrokerListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    brokerService
      .getListing(id)
      .then((d) => { if (!cancelled) setListing(d); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load listing'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    if (!listing) return;
    if (!confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await brokerService.deleteListing(listing.id);
      router.push('/broker/listings');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--fg-muted)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading listing…
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <Link href="/broker/listings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Listings
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error ?? 'Listing not found'}</span>
        </div>
      </div>
    );
  }

  const cover = listing.images[0]?.url;
  const psf = listing.area_sqft > 0 ? Math.round(listing.price_inr / listing.area_sqft).toLocaleString('en-IN') : '—';
  const created = new Date(listing.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const updated = new Date(listing.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/broker/listings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Listings
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/broker/listings/${listing.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--fg)] hover:bg-[var(--bg-secondary)]"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden mb-6">
          <div className="relative aspect-[16/8] bg-[var(--bg-secondary)]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <Home className="h-10 w-10 text-[var(--fg-muted)] opacity-30" />
                <span className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">No Image</span>
              </div>
            )}
            <div className="absolute top-4 left-4"><StatusPill status={listing.status} /></div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-[var(--fg)]">{listing.title}</h1>
                <p className="mt-1 text-sm text-[var(--fg-muted)] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {listing.locality}, {listing.city}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[var(--fg)] tracking-tight">{fmtINR(listing.price_inr)}</p>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">₹{psf} / sqft</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--fg-muted)]">
              <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{listing.bedrooms} BHK</span>
              {listing.bathrooms != null && <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" />{listing.bathrooms} Bath</span>}
              <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" />{listing.area_sqft.toLocaleString('en-IN')} sqft</span>
              <span className="flex items-center gap-1.5 capitalize"><Building2 className="h-4 w-4" />{listing.property_type}</span>
              <span className="flex items-center gap-1.5 capitalize"><Tag className="h-4 w-4" />For {listing.listing_type}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Bedrooms" value={listing.bedrooms} />
          <Stat label="Bathrooms" value={listing.bathrooms ?? '—'} />
          <Stat label="Area (sqft)" value={listing.area_sqft.toLocaleString('en-IN')} />
          <Stat label="Price / sqft" value={`₹${psf}`} />
        </div>

        {/* Description */}
        {listing.description && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 mb-6">
            <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-3">Description</h2>
            <p className="text-sm text-[var(--fg-secondary)] whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Location */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 mb-6">
          <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-3">Location</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">City</p>
              <p className="mt-0.5 text-[var(--fg)]">{listing.city}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Locality</p>
              <p className="mt-0.5 text-[var(--fg)]">{listing.locality}</p>
            </div>
            {listing.address && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Address</p>
                <p className="mt-0.5 text-[var(--fg)]">{listing.address}</p>
              </div>
            )}
            {(listing.latitude != null || listing.longitude != null) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Coordinates</p>
                <p className="mt-0.5 text-[var(--fg)]">
                  {listing.latitude?.toFixed(5)}, {listing.longitude?.toFixed(5)}
                </p>
              </div>
            )}
            {listing.map_url && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Map</p>
                <a href={listing.map_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-sm text-[#8B7355] hover:underline">
                  Open in Maps <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Image gallery */}
        {listing.images.length > 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 mb-6">
            <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-3">Images ({listing.images.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {listing.images.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={`Image ${idx + 1}`} className="aspect-square rounded-lg border border-[var(--border)] object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-3">Listing Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Listing ID</p>
              <p className="mt-0.5 font-mono text-[12px] text-[var(--fg)] break-all">{listing.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Status</p>
              <p className="mt-0.5"><StatusPill status={listing.status} /></p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)] flex items-center gap-1"><Calendar className="h-3 w-3" /> Created</p>
              <p className="mt-0.5 text-[var(--fg)]">{created}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)] flex items-center gap-1"><Calendar className="h-3 w-3" /> Updated</p>
              <p className="mt-0.5 text-[var(--fg)]">{updated}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
