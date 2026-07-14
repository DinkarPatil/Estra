export interface BrokerDashboardKPI {
  label: string;
  value: string | number;
  change?: number | null;
  direction?: string | null;
}

export interface BrokerDashboardResponse {
  kpis: BrokerDashboardKPI[];
  recent_activity: Array<{
    lead_id: string;
    name: string;
    status: string;
    created_at: string | null;
  }>;
}

export interface BrokerLead {
  id: string;
  broker_id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  source?: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerLeadListResponse {
  total: number;
  leads: BrokerLead[];
}

export interface BrokerLeadCreate {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  notes?: string;
}

export interface BrokerLeadUpdate {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  source?: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  notes?: string;
}

// ─── Listings ──────────────────────────────────────────────────────────────

export type ListingType = 'sale' | 'rent';
export type PropertyKind = 'apartment' | 'villa' | 'plot' | 'commercial';
export type ListingStatus = 'draft' | 'published' | 'sold';

export interface BrokerListingImage {
  id: string;
  url: string;
  display_order: number;
}

export interface BrokerListingImageInput {
  url: string;
  display_order?: number;
}

/** Compact card-shape for list/grid views (mirrors backend BrokerListingSummary). */
export interface BrokerListing {
  id: string;
  broker_id: string;
  title: string;
  listing_type: ListingType | string;
  property_type: PropertyKind | string;
  bedrooms: number;
  bathrooms?: number | null;
  area_sqft: number;
  price_inr: number;
  city: string;
  locality: string;
  status: ListingStatus | string;
  cover_image?: string | null;
  created_at: string;
}

/** Full single-listing payload (mirrors backend BrokerListingDetail). */
export interface BrokerListingDetail {
  id: string;
  broker_id: string;
  title: string;
  description?: string | null;
  listing_type: string;
  property_type: string;
  bedrooms: number;
  bathrooms?: number | null;
  area_sqft: number;
  price_inr: number;
  city: string;
  locality: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  map_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  images: BrokerListingImage[];
}

export interface BrokerListingListResponse {
  total: number;
  listings: BrokerListing[];
}

export interface BrokerListingCreate {
  title: string;
  description?: string;
  listing_type: ListingType | string;
  property_type: PropertyKind | string;
  bedrooms: number;
  bathrooms?: number;
  area_sqft: number;
  price_inr: number;
  city: string;
  locality: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  map_url?: string;
  status?: ListingStatus | string;
  images?: BrokerListingImageInput[];
}

export type BrokerListingUpdate = Partial<BrokerListingCreate>;

export interface BrokerListingFilters {
  city?: string;
  locality?: string;
  listing_type?: string;
  property_type?: string;
  bedrooms?: number;
  min_price?: number;
  max_price?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface IBrokerService {
  getDashboard(): Promise<BrokerDashboardResponse>;
  listLeads(status?: string): Promise<BrokerLeadListResponse>;
  getLead(id: string): Promise<BrokerLead>;
  createLead(data: BrokerLeadCreate): Promise<BrokerLead>;
  updateLead(id: string, data: BrokerLeadUpdate): Promise<BrokerLead>;

  listListings(filters?: BrokerListingFilters): Promise<BrokerListingListResponse>;
  getListing(id: string): Promise<BrokerListingDetail>;
  createListing(data: BrokerListingCreate): Promise<BrokerListingDetail>;
  updateListing(id: string, data: BrokerListingUpdate): Promise<BrokerListingDetail>;
  deleteListing(id: string): Promise<void>;
}
