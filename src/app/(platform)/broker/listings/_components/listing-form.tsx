'use client';

import { useState } from 'react';
import { Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import type {
  BrokerListingCreate,
  BrokerListingDetail,
} from '@/services/interfaces/broker.interface';

const PROPERTY_TYPES = [
  { value: 'apartment',  label: 'Apartment' },
  { value: 'villa',      label: 'Villa' },
  { value: 'plot',       label: 'Plot / Land' },
  { value: 'commercial', label: 'Commercial' },
];

const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
];

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft',     label: 'Draft' },
  { value: 'sold',      label: 'Sold' },
];

export interface FormState {
  title: string;
  description: string;
  listing_type: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  area_sqft: string;
  price_inr: string;
  city: string;
  locality: string;
  address: string;
  latitude: string;
  longitude: string;
  map_url: string;
  status: string;
  imageInput: string;
  images: string[];
}

export const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  listing_type: 'sale',
  property_type: 'apartment',
  bedrooms: '',
  bathrooms: '',
  area_sqft: '',
  price_inr: '',
  city: '',
  locality: '',
  address: '',
  latitude: '',
  longitude: '',
  map_url: '',
  status: 'published',
  imageInput: '',
  images: [],
};

export function detailToForm(d: BrokerListingDetail): FormState {
  return {
    title:        d.title ?? '',
    description:  d.description ?? '',
    listing_type: d.listing_type ?? 'sale',
    property_type: d.property_type ?? 'apartment',
    bedrooms:     d.bedrooms != null ? String(d.bedrooms) : '',
    bathrooms:    d.bathrooms != null ? String(d.bathrooms) : '',
    area_sqft:    d.area_sqft != null ? String(d.area_sqft) : '',
    price_inr:    d.price_inr != null ? String(d.price_inr) : '',
    city:         d.city ?? '',
    locality:     d.locality ?? '',
    address:      d.address ?? '',
    latitude:     d.latitude != null ? String(d.latitude) : '',
    longitude:    d.longitude != null ? String(d.longitude) : '',
    map_url:      d.map_url ?? '',
    status:       d.status ?? 'published',
    imageInput:   '',
    images:       (d.images ?? []).map((img) => img.url),
  };
}

export function buildPayload(form: FormState, status: string): { ok: true; data: BrokerListingCreate } | { ok: false; error: string } {
  if (!form.title.trim() || !form.city.trim() || !form.locality.trim()) {
    return { ok: false, error: 'Title, city and locality are required.' };
  }
  const bedrooms = parseInt(form.bedrooms, 10);
  const area_sqft = parseFloat(form.area_sqft);
  const price_inr = parseFloat(form.price_inr);
  if (!Number.isFinite(bedrooms) || bedrooms < 0) return { ok: false, error: 'Bedrooms must be a non-negative number.' };
  if (!Number.isFinite(area_sqft) || area_sqft <= 0) return { ok: false, error: 'Area (sqft) must be greater than 0.' };
  if (!Number.isFinite(price_inr) || price_inr <= 0) return { ok: false, error: 'Price (INR) must be greater than 0.' };

  const data: BrokerListingCreate = {
    title:        form.title.trim(),
    description:  form.description.trim() || undefined,
    listing_type: form.listing_type,
    property_type: form.property_type,
    bedrooms,
    bathrooms:    form.bathrooms ? parseInt(form.bathrooms, 10) : undefined,
    area_sqft,
    price_inr,
    city:         form.city.trim(),
    locality:     form.locality.trim(),
    address:      form.address.trim() || undefined,
    latitude:     form.latitude ? parseFloat(form.latitude) : undefined,
    longitude:    form.longitude ? parseFloat(form.longitude) : undefined,
    map_url:      form.map_url.trim() || undefined,
    status,
    images:       form.images.map((url, i) => ({ url, display_order: i })),
  };
  return { ok: true, data };
}

interface ListingFormProps {
  initial?: FormState;
  submitLabel: string;
  draftLabel?: string;
  /** Receives (payload, target_status). Throws to surface an error in the form. */
  onSubmit: (payload: BrokerListingCreate) => Promise<void>;
  onCancel?: () => void;
}

export function ListingForm({ initial, submitLabel, draftLabel, onSubmit, onCancel }: ListingFormProps) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addImage() {
    const url = form.imageInput.trim();
    if (!url) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, url], imageInput: '' }));
  }

  function removeImage(idx: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  async function submit(targetStatus: string) {
    setError(null);
    const built = buildPayload(form, targetStatus);
    if (built.ok === false) {
      setError(built.error);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(built.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355]';

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Property Information */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Property Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Listing Title *</label>
            <input
              type="text" value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. 3 BHK Sea View Apartment in Bandra West"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Listing Type *</label>
            <select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)} className={inputCls}>
              {LISTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Property Type *</label>
            <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} className={inputCls}>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">City *</label>
            <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Locality / Area *</label>
            <input type="text" value={form.locality} onChange={(e) => set('locality', e.target.value)} placeholder="Bandra West" className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Address</label>
            <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Building / Street / Landmark" className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Description</label>
            <textarea
              rows={4} value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the property, its features, and unique selling points..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Pricing & Specs */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Pricing & Specs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Price (INR) *</label>
            <input type="number" value={form.price_inr} onChange={(e) => set('price_inr', e.target.value)} placeholder="35000000" min="0" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Area (sqft) *</label>
            <input type="number" value={form.area_sqft} onChange={(e) => set('area_sqft', e.target.value)} placeholder="1450" min="0" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Bedrooms (BHK) *</label>
            <input type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} placeholder="3" min="0" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Bathrooms</label>
            <input type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} placeholder="2" min="0" className={inputCls} />
          </div>
          <div />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Latitude</label>
            <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="19.0596" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Longitude</label>
            <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="72.8295" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Map URL</label>
            <input type="text" value={form.map_url} onChange={(e) => set('map_url', e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Images</h2>
        <p className="mb-3 text-xs text-[var(--fg-muted)]">Paste hosted image URLs (S3, Cloudinary, etc). The first one is used as the cover image.</p>
        <div className="flex items-center gap-2">
          <input
            type="text" value={form.imageInput}
            onChange={(e) => set('imageInput', e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
            className={`${inputCls} flex-1`}
          />
          <button type="button" onClick={addImage} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-sm font-semibold text-white hover:bg-primary-700">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {form.images.length > 0 && (
          <ul className="mt-3 space-y-2">
            {form.images.map((url, idx) => (
              <li key={idx} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs">
                <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-semibold text-[var(--fg-muted)]">{idx === 0 ? 'cover' : idx + 1}</span>
                <span className="flex-1 truncate text-[var(--fg)]">{url}</span>
                <button type="button" onClick={() => removeImage(idx)} className="rounded-md p-1 text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-6 py-2.5 text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-secondary)] disabled:opacity-50">
            Cancel
          </button>
        )}
        {draftLabel && (
          <button type="button" disabled={submitting} onClick={() => submit('draft')} className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-6 py-2.5 text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-secondary)] disabled:opacity-50">
            {draftLabel}
          </button>
        )}
        <button
          type="button" disabled={submitting}
          onClick={() => submit(form.status || 'published')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-primary-600/40 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
