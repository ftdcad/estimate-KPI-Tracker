# Estimator KPI Tracking System — Build Context

> Handoff document for every future Claude Code session. Read this FIRST, then read PDR_ESTIMATOR_KPI_V2.md.

## STATUS: READY TO BUILD

PDR complete. Architecture finalized. Waiting for BINGO.

**Rule: BINGO is the code word. No building until Frank says BINGO. Dev talk is free, code is gated.**

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

## DECISIONS MADE (Feb 18, 2026 architect session)

| Decision | Answer |
|---|---|
| Database | **Supabase** — NOT MongoDB. Guest house model, same as onboarder. |
| Supabase project | **Separate from onboarder.** URL: `esllnitrsljyvcduarrw.supabase.co` (dedicated to this app, currently empty) |
| Portal modifications | **NONE.** DEV TEAM manages the portal. Zero backend changes. Auth via URL params only. |
| Core feature | **Split clock / blocker button.** Ships in Phase 1, not Phase 2. |
| Entry mode | **Manual.** CRM integration ~12 months out. Estimators type in file details by hand. |
| Who it measures | **Estimators only.** Not scopers, PAs, or contractors. Designed to extend later. |
| Notifications | **Estimators only.** They own follow-up and escalation. |
| Party fields | **Optional free text with auto-suggest.** Never block entry. Data builds over time. |
| Theme | **Dark navy** matching portal. CSS vars from onboarder index.css. |
| Severity targets | **Close to existing.** Sev 1–5, <30min to <12hr. Red flag thresholds use dual clock check. |
| Estimate value | **Single number in Phase 1.** RCV/ACV/depreciation fields exist in schema but no UI until Phase 2. |

---

## CURRENT CODEBASE STATE (Lovable Build — July 2025)

### Architecture
- **Single mega-component**: `EstimatorKPITracker.tsx` (406 lines) manages ALL state, tabs, CRUD
- **Data storage**: localStorage only — key `kpi-tracker-data`
- **Supabase**: Client configured (`esllnitrsljyvcduarrw.supabase.co`) but **zero tables, zero queries**
- **Auth**: None
- **Routing**: Single page (`/` → Index.tsx → EstimatorKPITracker)
- **Current estimators in data**: Nell, Brandon (placeholders)
- **Last Lovable commit**: July 24, 2025

### Components (see PDR Section 2 for full status table)

| Component | Lines | Status |
|---|---|---|
| EstimatorKPITracker.tsx | 406 | BREAK UP into provider + page |
| DataEntryTab.tsx | 556 | KEEP + wire to Supabase + add blocker button |
| EstimatorScorecard.tsx | 212 | KEEP + add adjusted $/hr |
| TeamDashboard.tsx | 207 | KEEP + add blocker summary |
| AnalysisTab.tsx | 285 | KEEP + wire to real data |
| HistoricalData.tsx | 271 | REWRITE with real queries |
| LiquidityTab.tsx | 340 | KEEP + wire to Supabase |
| PersonalStatsCard.tsx | 139 | KEEP + add split clock stats |
| ManageEstimatorDialog.tsx | 509 | KEEP + wire to Supabase |
| Documentation.tsx | 315 | UPDATE when done |

### Existing Calculations (kpiCalculations.ts) — correct math, keep these
- **Avg Days Held**: Days from entry to today (or settlement)
- **Revision Rate**: Total revisions / estimate count
- **First-Time Approval %**: Estimates with 0 revisions / total
- **Dollar Per Hour**: Total estimate value / (time hours + revision hours)
- **Team Overall Score**: Weighted — 40% dollar/hour, 30% revision rate, 20% approval rate, 10% efficiency

### Known Issues
| Issue | Severity | Fix |
|---|---|---|
| localStorage only — no persistence | HIGH | Migrate to Supabase (PDR Section 3) |
| One mega-component manages everything | HIGH | Break up (PDR Phase 1 Step 8) |
| No auth system | HIGH | Copy from onboarder (PDR Phase 1 Step 3) |
| No blocker tracking | HIGH | Build blocker system (PDR Phase 1 Steps 6-7) |
| Historical data is fake | MEDIUM | Replace with real queries (PDR Phase 2) |
| Hardcoded password "1950" for clear-data | HIGH | Remove |
| 60+ unused shadcn components | LOW | Clean in Phase 3 |
| Light theme (doesn't match portal) | LOW | Dark navy swap (PDR Phase 1 Step 10) |

---

## PHASE 1 BUILD ORDER (from PDR Section 10)

1. Create all Supabase tables
2. Seed default SLA rules
3. Copy auth pattern from onboarder
4. Copy status machine pattern from onboarder
5. Wire DataEntryTab to Supabase
6. Build BlockerDialog and UnblockDialog
7. Add status column and blocker button to DataEntryTab
8. Break up EstimatorKPITracker.tsx mega-component
9. Create estimator_profiles for existing estimators
10. Dark navy theme
11. Migrate existing data

**Phase 1 DataEntryTab columns**: file number, client name, carrier (optional), peril, severity, estimate value (single number), time hours, status, blocker button. That's it.

**Verify**: Estimator can enter estimate → work on it → click Blocked → enter reason → click Unblocked → see time split. Adjusted $/hr shows alongside raw $/hr on scorecard.

---

## OPEN QUESTIONS (remaining)

| # | Question | Blocks | Default If Unanswered |
|---|---|---|---|
| EQ1 | Estimator names + portal user ID mapping? | Phase 1 | **ANSWERED**: Nell Dalton (Lead Estimator) and Brandon Leighton (Estimator). Full roster in PDR Section 12. |
| EQ3 | Start with known carriers/contractors or empty reference tables? | Phase 1 | **ANSWERED**: Empty + verified/unverified pattern. Estimators type freetext if no dropdown match → admin reviews/merges. See PDR Section 3.6. |
| EQ6 | How does the portal embed this app? | Phase 1 | **ANSWERED**: Iframe. Separate deploy, portal loads via iframe, auth via URL params. Same as onboarder. |

**Already answered:**
- EQ2 (Supabase): Separate project — `esllnitrsljyvcduarrw` dedicated to this app
- EQ4 (Timer): Manual entry with optional timer widget in Phase 2
- EQ5 (Estimate value): Single number. RCV/ACV breakdown exists in schema, UI in Phase 2
- EQ7 (Severity targets): Confirmed close to existing

---

## REFERENCE

### Onboarder KPI (architecture patterns to copy)
| Pattern | Onboarder File |
|---|---|
| Auth system | `onboarder-kpi-tracking-system/src/lib/auth.ts` |
| User context | `onboarder-kpi-tracking-system/src/contexts/UserContext.tsx` |
| Timer context | `onboarder-kpi-tracking-system/src/contexts/TimerContext.tsx` |
| Status machine | `onboarder-kpi-tracking-system/src/status.ts` |
| Types | `onboarder-kpi-tracking-system/src/types/onboarding.ts` |
| Theme | `onboarder-kpi-tracking-system/src/index.css` |

### GitHub
- **Personal**: ftdcad/estimate-KPI-Tracker
- **Coastal org**: TBD — will create Coastal-Claims-Services/estimator-kpi-tracker when ready
- **Portal page name**: TBD

### Related Projects
- **Onboarder KPI**: `C:\Users\FrankDalton\myProjects\onboarder-kpi-tracking-system` (architecture reference)
- **Blueprint docs**: `C:\Users\FrankDalton\myProjects\kpi system blueprint`
- **Portal**: portal.coastalclaims.net (DEV TEAM manages — DO NOT MODIFY)
