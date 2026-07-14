# ESTRA GLIMMORA - Project Context

## Overview
ESTRA GLIMMORA is an AGI-powered global real estate intelligence platform covering the full property investment lifecycle — from AI-driven discovery to post-purchase asset management.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 with design tokens via `@theme inline` in globals.css
- **State**: React Context (auth, theme)
- **Data Layer**: Interface-based service pattern with mock/API toggle
- **Charts**: Recharts
- **Tables**: Custom DataTable component
- **Forms**: React Hook Form + Zod (available, not yet wired)
- **Icons**: Lucide React
- **Fonts**: Inter (body), Space Grotesk (display)

## Architecture

### Data Layer (Mock ↔ API Swap)
```
Component → Custom Hook → Service Interface → Mock Implementation (default)
                                             → API Implementation (env toggle)
```
- `NEXT_PUBLIC_USE_MOCK_DATA=true` → uses mock data (default)
- `NEXT_PUBLIC_USE_MOCK_DATA=false` + `NEXT_PUBLIC_API_BASE_URL` → uses real API
- Service factory: `src/services/index.ts`
- Service interfaces: `src/services/interfaces/`
- Mock implementations: `src/services/mock/`
- API implementations: `src/services/api/` (stubs ready)

### Centralized Styles
- All design tokens in `src/app/globals.css` via Tailwind v4 `@theme inline`
- CSS custom properties for light/dark: `--bg`, `--fg`, `--border`, `--card-bg`, etc.
- `cn()` utility at `src/lib/utils.ts` for class merging
- Component variants via `class-variance-authority` (cva)

## User Roles & Mock Credentials

| Role | Email | Password | Name |
|------|-------|----------|------|
| Investor | investor@glimmora.com | investor123 | Sarah Chen |
| Broker | broker@glimmora.com | broker123 | James Okafor |
| Developer | developer@glimmora.com | developer123 | Priya Sharma |
| Admin | admin@glimmora.com | admin123 | Alex Rivera |

## 18 Feature Modules

| # | Module | Primary Role | Key Routes |
|---|--------|-------------|------------|
| 1 | AGI Property Cognition | Investor | `/investor/properties` |
| 2 | Property Intelligence Graph | Investor | `/investor/properties/map`, `/investor/intelligence` |
| 3 | Investment & ROI Intelligence | Investor | `/investor/properties/[id]/analytics` |
| 4 | Digital Twin & Geospatial | Investor | `/investor/properties/[id]/digital-twin` |
| 5 | Negotiation Engine | Investor/Broker | `/investor/properties/[id]/negotiate` |
| 6 | Legal & Compliance | Investor | `/investor/properties/[id]/legal` |
| 7 | Transaction Engine | Investor/Broker | `/investor/transactions` |
| 8 | Lending Engine | Investor | `/investor/lending` |
| 9 | Fractional Ownership | Investor | `/investor/fractional` |
| 10 | Asset Management | Investor | `/investor/portfolio` |
| 11 | UHNI Concierge | Investor | `/investor/concierge` |
| 12 | Institutional Mode | Admin | `/admin/institutional` |
| 13 | Broker & Developer Platform | Broker/Developer | `/broker/*`, `/developer/*` |
| 14 | API Ecosystem | Admin | `/admin/api-management` |
| 15 | Data & Analytics | Admin | `/admin/platform-analytics` |
| 16 | AI/AGI Core | Admin | `/admin/ai-config` |
| 17 | Security & Governance | Admin | `/admin/security` |
| 18 | Platform Infrastructure | Admin | `/admin/system` |

## Folder Structure
```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Login, Register, Forgot Password
│   └── (platform)/              # Authenticated dashboard shell
│       ├── investor/ (27 pages)
│       ├── broker/ (16 pages)
│       ├── developer/ (18 pages)
│       ├── admin/ (25 pages)
│       └── shared/
├── components/
│   ├── ui/                      # Button, Input, Badge, Card, Dialog, etc.
│   ├── layout/                  # Sidebar, Topbar, Breadcrumbs, PageHeader
│   ├── data-display/            # StatCard, ChartCard, DataTable, EmptyState
│   ├── property/                # PropertyCard, PropertyGrid, AISearchBar
│   ├── finance/                 # ROICalculator, EMICalculator
│   ├── maps/                    # MapContainer, HeatmapOverlay
│   ├── ai/                      # AIChatPanel, AIInsightCard
│   ├── transaction/             # DealWorkflow, EscrowStatus
│   └── forms/                   # Search, Loan, Listing forms
├── features/                    # Per-module: components, hooks, types
│   ├── auth/
│   ├── property-cognition/      # Module 1
│   ├── property-intelligence/   # Module 2
│   ├── investment-roi/          # Module 3
│   ├── digital-twin/            # Module 4
│   ├── negotiation/             # Module 5
│   ├── legal-compliance/        # Module 6
│   ├── transaction-engine/      # Module 7
│   ├── lending/                 # Module 8
│   ├── fractional-ownership/    # Module 9
│   ├── asset-management/        # Module 10
│   ├── uhni-concierge/          # Module 11
│   ├── institutional/           # Module 12
│   ├── broker-developer/        # Module 13
│   ├── api-ecosystem/           # Module 14
│   ├── data-analytics/          # Module 15
│   ├── ai-core/                 # Module 16
│   ├── security-governance/     # Module 17
│   └── platform-infra/          # Module 18
├── services/                    # Service layer (mock/API swap)
│   ├── index.ts                 # Factory + exports
│   ├── interfaces/              # TypeScript contracts
│   ├── mock/                    # Mock implementations
│   └── api/                     # Real API implementations
├── mock-data/                   # Mock data files
├── types/                       # Global TypeScript types
├── contexts/                    # React Contexts (auth, theme)
├── lib/                         # Utils, constants, formatters, navigation
└── config/                      # Site config
```

## Key Files
- `src/app/globals.css` — All design tokens and theme variables
- `src/services/index.ts` — Service factory (mock/API toggle)
- `src/contexts/auth-context.tsx` — Auth state + mock login
- `src/contexts/theme-context.tsx` — Light/dark theme toggle
- `src/lib/navigation.ts` — Sidebar nav items per role
- `middleware.ts` — Route protection + role-based access
- `src/lib/formatters.ts` — Currency, date, number formatters
- `src/lib/constants.ts` — Mock credentials, role labels/colors

## Environment Variables
```
NEXT_PUBLIC_USE_MOCK_DATA=true       # Toggle mock data
NEXT_PUBLIC_API_BASE_URL=...         # Backend API URL (when mock=false)
```

## Development
```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run start  # Start production server
```

## Adding a New Backend API
1. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in `.env.local`
2. Set `NEXT_PUBLIC_API_BASE_URL` to your API URL
3. Create real service implementations in `src/services/api/`
4. Update `src/services/index.ts` to use API implementations
5. Components/hooks remain unchanged — they only use interfaces
