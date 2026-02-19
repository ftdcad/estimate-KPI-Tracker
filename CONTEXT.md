# Estimator KPI Tracking System — Build Context

> Handoff document for every future Claude Code session. Read this FIRST, then read PDR_ESTIMATOR_KPI_V2.md.

## STATUS: PHASE 1 BUILT — TESTING IN PROGRESS

Phase 1 code is committed and pushed. Supabase tables are live. Referral source fields added (Feb 19).

**Rule: BINGO is the code word. No building until Frank says BINGO. Dev talk is free, code is gated.**

---

## IMMEDIATE FIX NEEDED (next session)

**DataEntryTab table column width bug**: After adding Ref. Source and Ref. Source Rep columns, the table has 14 columns and they're too cramped. The `min-w-[1400px]` fix was attempted but didn't resolve it. The first few columns (File #, Client, etc.) get cut off when data is entered. Needs a proper fix — likely increase min-width further or rethink which columns show by default vs. which are hidden/collapsible.

**Supabase migration not yet run**: `supabase/migrations/20260219_add_referral_source.sql` adds `referral_source` and `referral_source_rep` columns to the `estimates` table. Must be run in the Supabase SQL Editor for project `esllnitrsljyvcduarrw` before these fields will save.

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

## WHAT WAS BUILT (Phase 1 — Feb 19, 2026)

### Supabase Tables (LIVE in project esllnitrsljyvcduarrw)
- `estimates` — core record with split clock fields, blocker fields, lifecycle dates
- `estimate_events` — audit trail (status changes, blockers, communications)
- `blockers` — active blocker tracking with duration calculation
- `time_logs` — work session tracking
- `estimator_profiles` — per-estimator config + aggregated stats
- `carriers` — verified/unverified reference data
- `contractor_companies` + `contractor_reps` — contractor reference data
- `carrier_adjusters` — carrier adjuster reference data
- `sla_rules` — configurable SLA targets by severity (seeded with defaults)
- Seed data: Nell Dalton + Brandon Leighton profiles, 5 SLA rules

### Code Built
- **Auth system**: Copied from onboarder — `src/lib/auth.ts`, `src/contexts/UserContext.tsx`, `src/types/user.ts`, `src/lib/mockUsers.ts`
- **Status machine**: `src/lib/status.ts` — cyclical transitions (assigned → in-progress → blocked → back to in-progress, etc.)
- **EstimatorContext**: `src/contexts/EstimatorContext.tsx` — React Query provider for all data operations
- **Supabase queries**: `src/lib/supabase-queries.ts` — CRUD, blocker protocol (3-step atomic), status changes with lifecycle dates
- **DataEntryTab**: Wired to Supabase with inline editing, auto-save on blur, carrier auto-suggest
- **BlockerDialog + UnblockDialog**: 3-click blocker flow (Blocked → who → why)
- **Dark navy theme**: CSS vars in index.css matching portal
- **Mega-component broken up**: EstimatorKPITracker.tsx decomposed into provider + page
- **Estimator profiles seeded**: Nell Dalton + Brandon Leighton

### Fields Added (Feb 19 session)
- `referral_source` (text) — who referred the claim
- `referral_source_rep` (text) — the specific rep at the referral source
- Added to: TypeScript types, DataEntryTab columns, handleAddRow template
- **Migration SQL written but NOT YET RUN in Supabase** — see `supabase/migrations/20260219_add_referral_source.sql`

### DataEntryTab Columns (current order)
Checkbox | File # | Client | Ref. Source | Ref. Source Rep | Carrier | Peril | Sev | Hours | Est. Value | Rev | Status | Blocker | Notes

---

## PHASE 1 BUILD ORDER (from PDR Section 10) — PROGRESS

1. ~~Create all Supabase tables~~ DONE
2. ~~Seed default SLA rules~~ DONE
3. ~~Copy auth pattern from onboarder~~ DONE
4. ~~Copy status machine pattern from onboarder~~ DONE
5. ~~Wire DataEntryTab to Supabase~~ DONE
6. ~~Build BlockerDialog and UnblockDialog~~ DONE
7. ~~Add status column and blocker button to DataEntryTab~~ DONE
8. ~~Break up EstimatorKPITracker.tsx mega-component~~ DONE
9. ~~Create estimator_profiles for existing estimators~~ DONE
10. ~~Dark navy theme~~ DONE
11. Migrate existing data — SKIPPED (no real data to migrate yet)

**Verify (NOT YET DONE)**: Estimator can enter estimate → work on it → click Blocked → enter reason → click Unblocked → see time split. Adjusted $/hr shows alongside raw $/hr on scorecard.

---

## NEXT SESSION TASK QUEUE

1. **FIX DataEntryTab column widths** — 14 columns too cramped. min-w-[1400px] didn't help. Try larger min-width or hide some columns behind a detail panel.
2. **Run referral source migration** in Supabase SQL Editor
3. **End-to-end test**: enter estimate → block → unblock → check split clock on scorecard
4. Phase 2 planning (analytics dashboards) after e2e verification passes

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
