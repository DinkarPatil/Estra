export interface FinancedProperty {
  id: string;
  name: string;
  location: string;
  marketValue: number;
  loanOutstanding: number;
  originalLoan: number;
  interestRate: number;
  monthlyEMI: number;
  monthlyRental: number;
  lender: string;
  ltv: number;
  tenure: number;
  maturityDate: string;
  status: 'active' | 'review' | 'refinance-ready';
  aiRefinanceScore: number;
  potentialSaving: number;
}

export interface LoanApplication {
  id: string;
  lender: string;
  property: string;
  requestedAmount: number;
  offeredRate: number;
  status: 'approved' | 'in-review' | 'pending';
  stage: string;
  estimatedApproval: string;
  rm: string;
}

export interface AIRecommendation {
  id: string;
  type: 'refinance' | 'leverage' | 'optimize' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  confidence: number;
}
