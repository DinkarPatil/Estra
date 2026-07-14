/**
 * Lead — a connection between an investor's intent and a broker's pipeline.
 *
 * Created from the investor side (Invest Now / Contact Broker), consumed
 * from the broker side (pipeline stages + actions).
 */

import type { MoneyAmount } from './common';

export type LeadStage = 'new' | 'contacted' | 'negotiation' | 'closed';
export type IntentLevel = 'high' | 'medium' | 'low';
export type LeadSource =
  | 'invest-now'         // investor clicked "Invest Now" on property detail
  | 'contact-broker'     // investor clicked "Contact Broker"
  | 'book-visit'         // investor booked a property visit
  | 'smart-search'       // from a search result action
  | 'legacy-mock';       // seeded from brokerLeads for demo continuity

export type LeadEventType =
  | 'created'
  | 'stage-change'
  | 'call'
  | 'proposal'
  | 'visit-scheduled'
  | 'note'
  | 'marked-as-deal';

export interface LeadEvent {
  id: string;
  at: string;        // ISO timestamp
  type: LeadEventType;
  byRole?: 'investor' | 'broker' | 'system';
  message?: string;
}

export interface Lead {
  id: string;
  /** Linked property */
  propertyId: string;
  propertyName: string;
  propertyLocation: string;
  propertyPrice?: MoneyAmount;

  /** Investor identity */
  investorId: string;
  investorName: string;
  investorEmail?: string;
  investorPhone?: string;
  investorBudget?: MoneyAmount;

  /** Decision signals */
  intentLevel: IntentLevel;
  aiScore: number;        // 0–100, broker-facing quality signal

  /** Pipeline state */
  stage: LeadStage;
  source: LeadSource;

  createdAt: string;      // ISO
  updatedAt: string;      // ISO

  notes?: string;
  history: LeadEvent[];
}

/** Input payload for creating a new lead (context populates the rest). */
export type CreateLeadInput = {
  propertyId: string;
  propertyName: string;
  propertyLocation: string;
  propertyPrice?: MoneyAmount;
  investorId: string;
  investorName: string;
  investorEmail?: string;
  investorPhone?: string;
  investorBudget?: MoneyAmount;
  intentLevel: IntentLevel;
  aiScore?: number;
  source: LeadSource;
};

/** Ordered stages for pipeline rendering / stage-advance logic. */
export const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'negotiation', 'closed'];

export const STAGE_LABELS: Record<LeadStage, string> = {
  new:         'New',
  contacted:   'Contacted',
  negotiation: 'Negotiation',
  closed:      'Closed',
};

export const INTENT_LABELS: Record<IntentLevel, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
};
