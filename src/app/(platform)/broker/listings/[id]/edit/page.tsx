'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { brokerService } from '@/services';
import type {
  BrokerListingCreate,
  BrokerListingDetail,
} from '@/services/interfaces/broker.interface';
import { ListingForm, detailToForm, type FormState } from '../../_components/listing-form';

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [initial, setInitial] = useState<FormState | null>(null);
  const [detail, setDetail] = useState<BrokerListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    brokerService
      .getListing(id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setInitial(detailToForm(d));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load listing');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  async function save(payload: BrokerListingCreate) {
    // BrokerListingCreate is a structural superset of BrokerListingUpdate.
    await brokerService.updateListing(id, payload);
    router.push(`/broker/listings/${id}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--fg-muted)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading listing…
      </div>
    );
  }

  if (loadError || !initial || !detail) {
    return (
      <PageContainer>
        <Link href="/broker/listings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Listings
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError ?? 'Listing not found'}</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-3">
        <Link href={`/broker/listings/${id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Listing
        </Link>
      </div>
      <PageHeader title="Edit Listing" description={detail.title} />

      <ListingForm
        initial={initial}
        submitLabel="Save Changes"
        onSubmit={save}
        onCancel={() => router.push(`/broker/listings/${id}`)}
      />
    </PageContainer>
  );
}
