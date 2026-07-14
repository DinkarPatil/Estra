import type {
  IBrokerService,
  BrokerDashboardResponse,
  BrokerLead,
  BrokerLeadListResponse,
  BrokerLeadCreate,
  BrokerLeadUpdate,
  BrokerListingListResponse,
  BrokerListingDetail,
  BrokerListingCreate,
  BrokerListingUpdate,
  BrokerListingFilters,
} from '../interfaces/broker.interface';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'glimmora-access-token';

export class ApiBrokerService implements IBrokerService {
  private async authHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = { ...(init?.headers as Record<string, string> | undefined), ...(await this.authHeaders()) };
    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    if (!res.ok) {
      let detail = `${init?.method || 'GET'} ${path} ${res.status}`;
      try {
        const body = await res.json();
        if (body?.detail) detail = `${detail} — ${typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)}`;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async getDashboard(): Promise<BrokerDashboardResponse> {
    return this.req('/broker/dashboard');
  }

  async listLeads(status?: string): Promise<BrokerLeadListResponse> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.req(`/broker/leads${qs}`);
  }

  async getLead(id: string): Promise<BrokerLead> {
    return this.req(`/broker/leads/${encodeURIComponent(id)}`);
  }

  async createLead(data: BrokerLeadCreate): Promise<BrokerLead> {
    return this.req('/broker/leads', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateLead(id: string, data: BrokerLeadUpdate): Promise<BrokerLead> {
    return this.req(`/broker/leads/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Listings ────────────────────────────────────────────────────────

  async listListings(filters?: BrokerListingFilters): Promise<BrokerListingListResponse> {
    const qs = new URLSearchParams();
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v === undefined || v === null || v === '') continue;
        qs.set(k, String(v));
      }
    }
    const query = qs.toString();
    return this.req(`/broker/listings${query ? `?${query}` : ''}`);
  }

  async getListing(id: string): Promise<BrokerListingDetail> {
    return this.req(`/broker/listings/${encodeURIComponent(id)}`);
  }

  async createListing(data: BrokerListingCreate): Promise<BrokerListingDetail> {
    return this.req('/broker/listings', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateListing(id: string, data: BrokerListingUpdate): Promise<BrokerListingDetail> {
    return this.req(`/broker/listings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string): Promise<void> {
    await this.req<void>(`/broker/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}
