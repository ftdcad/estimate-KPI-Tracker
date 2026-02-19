# Estimator KPI Tracking System — Build Context

> Handoff document for every future Claude Code session. Read this FIRST, then read PDR_ESTIMATOR_KPI_V2.md.

## STATUS: PHASE 1 LIVE — SESSION 2 COMPLETE (Feb 19, 2026)

Phase 1 code is committed and pushed. Supabase tables are live with mock data. Referral source migration RUN. Layout fixed. Bragboard and date filter added. KPI data pipeline wired to real Supabase data.

**Rule: BINGO is the code word. No building until Frank says BINGO. Dev talk is free, code is gated.**

---

## SESSION 2 BUILDS (Feb 19, 2026)

### Layout Fix
- Table now uses `table-fixed` — columns respect declared pixel widths
- Narrow columns (Sev 60px, Hours 70px, Rev 60px, etc.) stay tight
- Text columns (Client, Ref. Source, Ref. Source Rep, Notes) share remaining space
- Removed `min-w-[1400px]` — no more horizontal scrollbar
- Container stays at `max-w-[95vw]` — full width, matching portal/onboarder

### Date Range Filter
- Button row in DataEntryTab header: Today | Past Week | Past Month | Past Quarter | All Time | Custom
- Custom shows From/To date inputs
- Defaults to Past Week
- File count shows "X of Y files" (filtered vs total)
- Filters on `date_received`

### PersonalStatsCard (Bragboard)
- Rendered above data entry table on each estimator's tab
- Dropdown to switch metrics: $/Hour, $/Minute, Total Weekly Value, First-Time Approval Rate, Avg Severity, Estimates Completed
- Uses real Supabase data via compatibility hook

### KPI Data Pipeline Fix
- Fixed key mismatch in `useKPIData.ts` — was using `user_id` ('brandon') as key but legacy components expected `display_name` lowercased ('brandonleighton')
- Scorecards, Team Dashboard, Analysis tabs now show real data from Supabase

### Supabase Changes
- Referral source migration RUN: `referral_source` and `referral_source_rep` columns added
- Mock data loaded: 14 estimates (7 Nell, 7 Brandon) with mix of statuses
- 2 blocked estimates: Nell's (3 days — RED), Brandon's (12 hours — AMBER)
- 8 carriers seeded (State Farm, Allstate, USAA, Travelers, Citizens, Liberty Mutual, Progressive, Hartford)

### Git
- Remote URL updated to `https://github.com/ftdcad/estimate-KPI-Tracker.git` (was pointing to old estimate-ace-score)
- All changes committed and pushed to main

---

## NEXT SESSION — ESTIMATE DETAIL PANEL (Priority Build)

### What Frank Wants
An **EstimateDetailPanel** (slide-out Sheet, same pattern as onboarder's ClientDetailPanel) that opens when you:
1. **Click a client name** in the table row
2. **Click "Add Row"** (opens blank panel instead of adding empty table row)

### Panel Sections (based on onboarder pattern)
1. **Header** — File #, Status badge, Severity, Date Received
2. **Client Info** — Client name with **autocomplete** (type "Mart" → finds "Martinez Residence" from prior estimates), property type, loss state, loss date
3. **Referral Source** — Source name, Rep name
4. **Carrier & Adjuster** — Carrier (autocomplete from carriers table), adjuster name/email/phone
5. **Contractor** — Company, rep, email/phone
6. **Estimate Values** — Est. Value, RCV, ACV, Depreciation, Deductible, Net Claim, O&P
7. **Time & Blocker** — Active hours, blocked hours, revisions, blocker button
8. **Notes**

### Client Autocomplete / Parent-Child Linking
- When typing a client name, query existing estimates for matches
- If match found, pre-fill carrier, referral source, loss address from most recent estimate
- New estimate becomes another "child" under the same client
- Manager can see "Martinez Residence — 3 estimates across 2 months"
- This is the parent (client) / child (estimate) / grandchild (events/blockers) hierarchy

### Onboarder Pattern Reference
- `onboarder-kpi-tracking-system/src/components/ClientDetailPanel.tsx` — Sheet, 55vw, collapsible sections
- `onboarder-kpi-tracking-system/src/components/ExcelGrid.tsx` line 130 — click handler on client name
- `onboarder-kpi-tracking-system/src/components/CollapsibleSection.tsx` — section wrapper
- `onboarder-kpi-tracking-system/src/components/intake/IntakeForm.tsx` — editable form fields

### Additional Task Queue
- SLA alerting system (sla_rules table exists but nothing reads it)
- Time-in-stage color indicator
- Scorecard CSV export

---

## THE BUILD SPEC

**Read `PDR_ESTIMATOR_KPI_V2.md` in this same directory.** That's the 1,059-line master document covering:
- Split clock thesis (active time vs blocked time)
- Supabase schema (9 tables with indexes and RLS)
- Status machine (cyclical, not linear)
- Blocker system (the core feature — 3 clicks max)
- KPI formulas (raw $/hr vs adjusted $/hr)
- Red flag thresholds (dual clock check)
- UI components (existing + new)
- Build phases (3 phases, Phase 1 is laser-focused)
- Data migration (old localStorage/MongoDB → new Supabase)
- Non-negotiables (6 rules the builder can't break)

**The PDR is the single source of truth for building.** This CONTEXT.md provides supplementary context only.

---

## DECISIONS MADE (Feb 18-19, 2026)

| Decision | Answer |
|---|---|
| Database | **Supabase** — NOT MongoDB. Guest house model, same as onboarder. |
| Supabase project | **Separate from onboarder.** URL: `esllnitrsljyvcduarrw.supabase.co` |
| Portal modifications | **NONE.** DEV TEAM manages the portal. Zero backend changes. Auth via URL params only. |
| Core feature | **Split clock / blocker button.** Ships in Phase 1, not Phase 2. |
| Entry mode | **Manual.** CRM integration ~12 months out. Estimators type in file details by hand. |
| Who it measures | **Estimators only.** Not scopers, PAs, or contractors. Designed to extend later. |
| Theme | **Dark navy** matching portal. CSS vars from onboarder index.css. |
| Layout | **95vw full-width** with table-fixed column distribution. |
| Date filter default | **Past Week.** Options: Today, Week, Month, Quarter, All Time, Custom. |
| Detail panel | **Sheet slide-out** (onboarder pattern). Opens on client name click OR Add Row. |

---

## WHAT'S BUILT (cumulative)

### Supabase Tables (LIVE)
- `estimates` — 14 mock rows, split clock fields, blocker fields, referral source fields
- `estimate_events` — audit trail
- `blockers` — 2 active (Nell 3-day, Brandon 12-hour)
- `time_logs` — work session tracking
- `estimator_profiles` — Nell + Brandon seeded
- `carriers` — 8 verified carriers seeded
- `contractor_companies` + `contractor_reps` — empty, ready
- `carrier_adjusters` — empty, ready
- `sla_rules` — 5 severity-based defaults seeded

### Code Built
- **Auth system**: `src/lib/auth.ts`, `src/contexts/UserContext.tsx`, `src/types/user.ts`, `src/lib/mockUsers.ts`
- **Status machine**: `src/lib/status.ts` — cyclical transitions
- **EstimatorContext**: `src/contexts/EstimatorContext.tsx` — React Query provider
- **Supabase queries**: `src/lib/supabase-queries.ts` — CRUD, blocker protocol, status changes
- **DataEntryTab**: table-fixed layout, date range filter, inline editing, carrier auto-suggest
- **PersonalStatsCard**: Bragboard above each estimator's table ($/hr, approval rate, etc.)
- **BlockerDialog + UnblockDialog**: 3-click blocker flow
- **useKPIData compatibility hook**: Converts Supabase data → legacy format for Scorecards/TeamDashboard/Analysis
- **Dark navy theme**: CSS vars in index.css

### Legacy Components (working with real data now)
- **EstimatorScorecard**: Per-estimator performance cards, severity breakdown
- **TeamDashboard**: Leaderboard with weighted scoring (40% $/hr, 30% revision, 20% approval, 10% efficiency)
- **PersonalStatsCard**: Dropdown metric card (6 metrics)
- **AnalysisTab**: Red flags when $/hr < $10,000
- **kpiCalculations.ts**: Core math engine (dollarPerHour, revisionRate, etc.)

### What's FAKE / Not Yet Wired
- **SLA alerting**: `sla_rules` table seeded but frontend doesn't read/enforce them
- **Timer**: TimerContext not yet implemented (onboarder has it, estimator doesn't)
- **AnalysisTab**: Uses legacy format but recommendations are generic
- **LiquidityTab**: Settlement tracking — needs real settlement data

---

## PARENT/CHILD ROLE VISIBILITY

| Role | Sees | Test URL |
|---|---|---|
| superadmin (Frank) | All estimator tabs + shared tabs | `localhost:8080` (default) |
| manager (Sarah) | All estimator tabs + shared tabs | `?userId=sarah&role=manager&userName=Sarah%20Manager` |
| user (Nell) | Only her tab + shared tabs | `?userId=nell&role=user&userName=Nell%20Dalton` |
| user (Brandon) | Only his tab + shared tabs | `?userId=brandon&role=user&userName=Brandon%20Leighton` |

---

## REFERENCE

### GitHub
- **Personal**: ftdcad/estimate-KPI-Tracker (remote URL updated)
- **Coastal org**: TBD — will create Coastal-Claims-Services/estimator-kpi-tracker when ready

### Related Projects
- **Onboarder KPI**: `C:\Users\FrankDalton\myProjects\onboarder-kpi-tracking-system`
- **Blueprint docs**: `C:\Users\FrankDalton\myProjects\kpi system blueprint`
- **Portal**: portal.coastalclaims.net (DEV TEAM manages — DO NOT MODIFY)
