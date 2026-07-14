import {
  Home, Search, Building2, Briefcase, TrendingUp, FileText,
  CreditCard, Coins, Shield, BarChart3, Brain, Settings,
  Users, Activity, Server, Key, Lock, Eye, MapPin,
  Gavel, Calculator, Layers, Crown, Building, Target,
  Megaphone, PieChart, Zap, Globe, ClipboardCheck, type LucideIcon,
  Sparkles, SlidersHorizontal, Bell, UserCircle, Scale, Wallet, FolderOpen, Map,
  Bookmark, MessageSquare, Clock,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
  badge?: string;
  featured?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/* ─── Investor ─── */

export const investorNav: NavItem[] = [
  { title: 'Smart Search', href: '/investor', icon: Search },
  { title: 'Areas', href: '/investor/areas', icon: MapPin, badge: 'AI' },
  { title: 'Compare', href: '/investor/compare', icon: Scale },
];

export const investorSections: NavSection[] = [
  {
    label: 'Search',
    items: [
      { title: 'Smart Search', href: '/investor', icon: Search, featured: true, badge: 'AI' },
      { title: 'Areas', href: '/investor/areas', icon: MapPin, badge: 'AI' },
      { title: 'Properties', href: '/investor/properties', icon: Building2 },
      { title: 'Compare', href: '/investor/compare', icon: Scale },
      { title: 'AI Q&A', href: '/investor/ai-qa', icon: Brain, badge: 'AI' },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { title: 'Portfolio', href: '/investor/portfolio', icon: Briefcase },
      { title: 'Saved Deals', href: '/investor/ai-deals', icon: Bookmark },
      { title: 'Negotiations', href: '/investor/negotiations', icon: MessageSquare },
    ],
  },
];

/* ─── Broker ─── */

export const brokerNav: NavItem[] = [
  { title: 'Dashboard', href: '/broker', icon: Home },
  { title: 'Leads', href: '/broker/leads', icon: Target },
  { title: 'Listings', href: '/broker/listings', icon: Building2 },
  { title: 'Negotiations', href: '/broker/negotiations', icon: MessageSquare },
];

export const brokerSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', href: '/broker', icon: Home },
      { title: 'Leads', href: '/broker/leads', icon: Target },
      { title: 'Listings', href: '/broker/listings', icon: Building2 },
      { title: 'Negotiations', href: '/broker/negotiations', icon: MessageSquare },
    ],
  },
  {
    label: 'Business',
    items: [
      { title: 'Deals', href: '/broker/deals', icon: Gavel },
      { title: 'Analytics', href: '/broker/analytics', icon: BarChart3 },
      { title: 'Clients', href: '/broker/clients', icon: Users, badge: 'Soon' },
      { title: 'Commissions', href: '/broker/commissions', icon: Coins, badge: 'Soon' },
    ],
  },
];

/* ─── Developer ─── */

export const developerNav: NavItem[] = [
  { title: 'Dashboard', href: '/developer', icon: Home },
  { title: 'Inventory', href: '/developer/inventory', icon: Layers },
  { title: 'Projects', href: '/developer/projects', icon: Building },
  { title: 'Demand', href: '/developer/demand', icon: Target,
    children: [
      { title: 'Analysis', href: '/developer/demand', icon: BarChart3 },
      { title: 'Heatmap', href: '/developer/demand/heatmap', icon: MapPin },
    ]
  },
  { title: 'Pricing', href: '/developer/pricing', icon: TrendingUp },
  { title: 'Feasibility', href: '/developer/feasibility', icon: ClipboardCheck, badge: 'New' },
  { title: 'Marketing', href: '/developer/marketing', icon: Megaphone },
  { title: 'Analytics', href: '/developer/analytics', icon: PieChart,
    children: [
      { title: 'Overview', href: '/developer/analytics', icon: BarChart3 },
      { title: 'Sales', href: '/developer/analytics/sales', icon: TrendingUp },
      { title: 'Market', href: '/developer/analytics/market', icon: Globe },
    ]
  },
  { title: 'Settings', href: '/developer/settings', icon: Settings },
];

export const developerSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', href: '/developer', icon: Home },
    ],
  },
  {
    label: 'Projects',
    items: [
      { title: 'Inventory', href: '/developer/inventory', icon: Layers },
      { title: 'Projects', href: '/developer/projects', icon: Building },
      { title: 'Pricing', href: '/developer/pricing', icon: TrendingUp },
      { title: 'Feasibility', href: '/developer/feasibility', icon: ClipboardCheck, badge: 'New' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Demand', href: '/developer/demand', icon: Target,
        children: [
          { title: 'Analysis', href: '/developer/demand', icon: BarChart3 },
          { title: 'Heatmap', href: '/developer/demand/heatmap', icon: MapPin },
        ]
      },
      { title: 'Marketing', href: '/developer/marketing', icon: Megaphone },
      { title: 'Analytics', href: '/developer/analytics', icon: PieChart,
        children: [
          { title: 'Overview', href: '/developer/analytics', icon: BarChart3 },
          { title: 'Sales', href: '/developer/analytics/sales', icon: TrendingUp },
          { title: 'Market', href: '/developer/analytics/market', icon: Globe },
        ]
      },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Settings', href: '/developer/settings', icon: Settings },
    ],
  },
];

/* ─── Admin ─── */

export const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: Home },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Platform Analytics', href: '/admin/platform-analytics', icon: BarChart3 },
  { title: 'Security', href: '/admin/security', icon: Shield,
    children: [
      { title: 'Overview', href: '/admin/security', icon: Shield },
      { title: 'RBAC', href: '/admin/security/rbac', icon: Lock },
      { title: 'Audit Logs', href: '/admin/security/audit-logs', icon: Eye },
      { title: 'Encryption', href: '/admin/security/encryption', icon: Key },
    ]
  },
  { title: 'System Health', href: '/admin/system', icon: Activity },
  { title: 'API Management', href: '/admin/api-management', icon: Key },
  { title: 'AI Configuration', href: '/admin/ai-config', icon: Brain },
  { title: 'Institutional', href: '/admin/institutional', icon: Building },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export const adminSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', href: '/admin', icon: Home },
      { title: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Platform Analytics', href: '/admin/platform-analytics', icon: BarChart3 },
      { title: 'Security', href: '/admin/security', icon: Shield,
        children: [
          { title: 'Overview', href: '/admin/security', icon: Shield },
          { title: 'RBAC', href: '/admin/security/rbac', icon: Lock },
          { title: 'Audit Logs', href: '/admin/security/audit-logs', icon: Eye },
          { title: 'Encryption', href: '/admin/security/encryption', icon: Key },
        ]
      },
      { title: 'System Health', href: '/admin/system', icon: Activity },
    ],
  },
  {
    label: 'Config',
    items: [
      { title: 'API Management', href: '/admin/api-management', icon: Key },
      { title: 'AI Configuration', href: '/admin/ai-config', icon: Brain },
      { title: 'Institutional', href: '/admin/institutional', icon: Building },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

/* ─── Lookups ─── */

export const navigationByRole: Record<string, NavItem[]> = {
  investor: investorNav,
  broker: brokerNav,
  developer: developerNav,
  admin: adminNav,
};

/* ─── Coming Soon (placeholder for non-MVP roles) ─── */

export const comingSoonSections: NavSection[] = [
  {
    label: 'Coming Soon',
    items: [
      { title: 'This profile is under development', href: '#', icon: Clock },
    ],
  },
];

export const sectionsByRole: Record<string, NavSection[]> = {
  investor: investorSections,
  broker: brokerSections,
  developer: comingSoonSections,
  admin: comingSoonSections,
};

export const roleRedirects: Record<string, string> = {
  investor: '/investor',
  broker: '/broker',
  developer: '/developer',
  admin: '/admin',
};
