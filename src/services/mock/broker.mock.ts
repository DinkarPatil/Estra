import type {
  IBrokerService,
  BrokerDashboardResponse,
  BrokerLead,
  BrokerLeadListResponse,
  BrokerLeadCreate,
  BrokerLeadUpdate,
  BrokerListing,
  BrokerListingDetail,
  BrokerListingListResponse,
  BrokerListingCreate,
  BrokerListingUpdate,
  BrokerListingFilters,
} from '../interfaces/broker.interface';

const MOCK_LEADS: BrokerLead[] = [
  { id: 'lead-1', broker_id: 'brk-001', name: 'Raj Patel', email: 'raj@example.com', phone: '+91-9876543210', status: 'new', source: 'website', budget_min: 8000000, budget_max: 15000000, property_type: '2 BHK', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'lead-2', broker_id: 'brk-001', name: 'Emma Watson', email: 'emma@example.com', phone: '+91-9876543211', status: 'contacted', source: 'referral', budget_min: 20000000, budget_max: 50000000, property_type: 'villa', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'lead-3', broker_id: 'brk-001', name: 'Ahmed Al-Rashid', email: 'ahmed@example.com', phone: '+91-9876543212', status: 'qualified', source: 'website', property_type: '3 BHK', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
];

const MOCK_LISTINGS: BrokerListingDetail[] = [
  {
    id: 'mock-lst-1', broker_id: 'brk-001',
    title: '3 BHK Apartment in Bandra West',
    description: 'Spacious 3BHK with sea view',
    listing_type: 'sale', property_type: 'apartment',
    bedrooms: 3, bathrooms: 3, area_sqft: 1450, price_inr: 35000000,
    city: 'Mumbai', locality: 'Bandra West', address: 'Bandra West, Mumbai',
    latitude: 19.06, longitude: 72.83, map_url: null,
    status: 'published',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [],
  },
];

function summarize(d: BrokerListingDetail): BrokerListing {
  return {
    id: d.id, broker_id: d.broker_id, title: d.title,
    listing_type: d.listing_type, property_type: d.property_type,
    bedrooms: d.bedrooms, bathrooms: d.bathrooms ?? null,
    area_sqft: d.area_sqft, price_inr: d.price_inr,
    city: d.city, locality: d.locality, status: d.status,
    cover_image: d.images[0]?.url ?? null,
    created_at: d.created_at,
  };
}

export class MockBrokerService implements IBrokerService {
  async getDashboard(): Promise<BrokerDashboardResponse> {
    const statusCounts: Record<string, number> = {};
    for (const l of MOCK_LEADS) {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    }
    return {
      kpis: [
        { label: 'Total Leads', value: MOCK_LEADS.length },
        { label: 'Active Leads', value: MOCK_LEADS.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).length },
        { label: 'Total Listings', value: MOCK_LISTINGS.length },
        ...Object.entries(statusCounts).map(([status, count]) => ({
          label: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          value: count,
        })),
      ],
      recent_activity: MOCK_LEADS.slice(0, 5).map(l => ({
        lead_id: l.id,
        name: l.name,
        status: l.status,
        created_at: l.created_at,
      })),
    };
  }

  async listLeads(status?: string): Promise<BrokerLeadListResponse> {
    const leads = status ? MOCK_LEADS.filter(l => l.status === status) : MOCK_LEADS;
    return { total: leads.length, leads };
  }

  async getLead(id: string): Promise<BrokerLead> {
    const lead = MOCK_LEADS.find(l => l.id === id);
    if (!lead) throw new Error('Lead not found');
    return lead;
  }

  async createLead(data: BrokerLeadCreate): Promise<BrokerLead> {
    const lead: BrokerLead = {
      id: `lead-${Date.now()}`,
      broker_id: 'brk-001',
      ...data,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_LEADS.unshift(lead);
    return lead;
  }

  async updateLead(id: string, data: BrokerLeadUpdate): Promise<BrokerLead> {
    const idx = MOCK_LEADS.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lead not found');
    MOCK_LEADS[idx] = { ...MOCK_LEADS[idx], ...data, updated_at: new Date().toISOString() };
    return MOCK_LEADS[idx];
  }

  async listListings(filters?: BrokerListingFilters): Promise<BrokerListingListResponse> {
    let rows = [...MOCK_LISTINGS];
    if (filters?.city) rows = rows.filter(r => r.city.toLowerCase() === filters.city!.toLowerCase());
    if (filters?.bedrooms != null) rows = rows.filter(r => r.bedrooms === filters.bedrooms);
    return { total: rows.length, listings: rows.map(summarize) };
  }

  async getListing(id: string): Promise<BrokerListingDetail> {
    const found = MOCK_LISTINGS.find(l => l.id === id);
    if (!found) throw new Error('Listing not found');
    return found;
  }

  async createListing(data: BrokerListingCreate): Promise<BrokerListingDetail> {
    const detail: BrokerListingDetail = {
      id: `mock-lst-${Date.now()}`,
      broker_id: 'brk-001',
      title: data.title,
      description: data.description ?? null,
      listing_type: data.listing_type,
      property_type: data.property_type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms ?? null,
      area_sqft: data.area_sqft,
      price_inr: data.price_inr,
      city: data.city,
      locality: data.locality,
      address: data.address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      map_url: data.map_url ?? null,
      status: data.status ?? 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: (data.images ?? []).map((img, i) => ({
        id: `mock-img-${Date.now()}-${i}`,
        url: img.url,
        display_order: img.display_order ?? i,
      })),
    };
    MOCK_LISTINGS.unshift(detail);
    return detail;
  }

  async updateListing(id: string, data: BrokerListingUpdate): Promise<BrokerListingDetail> {
    const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Listing not found');
    const merged: BrokerListingDetail = {
      ...MOCK_LISTINGS[idx],
      ...data,
      images: data.images
        ? data.images.map((img, i) => ({ id: `mock-img-${Date.now()}-${i}`, url: img.url, display_order: img.display_order ?? i }))
        : MOCK_LISTINGS[idx].images,
      updated_at: new Date().toISOString(),
    } as BrokerListingDetail;
    MOCK_LISTINGS[idx] = merged;
    return merged;
  }

  async deleteListing(id: string): Promise<void> {
    const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Listing not found');
    MOCK_LISTINGS.splice(idx, 1);
  }
}
