'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { brokerService } from '@/services';
import type { BrokerListingCreate } from '@/services/interfaces/broker.interface';
import { ListingForm } from '../_components/listing-form';

export default function NewListingPage() {
  const router = useRouter();

  async function create(payload: BrokerListingCreate) {
    const created = await brokerService.createListing(payload);
    // Hop to the listings page; ?created=<id> tells it to highlight + force-refresh.
    router.push(`/broker/listings?created=${encodeURIComponent(created.id)}`);
  }

  return (
    <PageContainer>
      <div className="mb-3">
        <Link href="/broker/listings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Listings
        </Link>
      </div>
      <PageHeader title="New Listing" description="Add a new property to the database. It becomes searchable to investors immediately after publish." />

      <ListingForm
        submitLabel="Publish Listing"
        draftLabel="Save as Draft"
        onSubmit={create}
        onCancel={() => router.push('/broker/listings')}
      />
    </PageContainer>
  );
}
