# Estimator KPI Tracking System — Build Context

> Handoff document for every future Claude Code session. Read this first.

## STATUS: REBUILD PENDING

This app was originally built with Lovable in July 2025. It uses localStorage and has zero Supabase integration. The plan is to **clone the finished Onboarder KPI system and adapt it for estimator workflows** — NOT to patch this codebase.

**Rule: BINGO is the code word. No building until Frank says BINGO. Dev talk is free, code is gated.**

---

## BUILD STRATEGY: Clone + Adapt

### What Carries Over from Onboarder KPI (~90%)

| Feature | Onboarder Version | Estimator Adaptation |
|---|---|---|
| Workboard (daily view) | Tracks leads through 24/48/72/96hr stages | Tracks estimates through severity-based stages |
| Stage Action Hit-List | Text/Email/Call checkboxes per stage | TBD — may be Review/Revision/Submit per stage |
| Step 0 Checklist | Pre-contact verification | Pre-estimate verification (file received, scope confirmed, etc.) |
| Client Detail Panel | 55vw slide-out with 5 collapsible sections | Same layout — "Estimate Detail Panel" |
| Activity Logs | Insured + Referral Source feeds | Estimator + Carrier feeds |
| Time Tracking (TimerContext) | Session timer, idle detection, time_logs table | Identical — tracks time per estimate |
| Scorecard | Real Supabase data, CSV export, trend charts | Same structure — different metrics |
| Auth System | Portal URL params, role-based visibility | Identical — estimators=user, managers=manager |
| Status Transitions | new → step_2 → step_3 → final_step → completed | TBD — likely: assigned → in_progress → submitted → revision → approved |
| Time-in-Stage Colors | Green <12hr, amber 12-24hr, red >24hr | Same logic, different thresholds |
| Due Today / Past Due Split | Based on hoursInCurrentStage | Same logic |
| Hold Notes | Dialog on past due items | Same |
| Role-Based Visibility | Users see own data, managers see all | Identical |
| Mock Users (dev mode) | Reyniel, Ardee, Lexi, Sydnie | Estimator names TBD |

### What's Different (~10%)

| Area | Onboarder | Estimator |
|---|---|---|
| **Primary metric** | Hours since first attempt (24/48/72/96hr SOP) | Days held + dollar/hour + revision rate |
| **Stage names** | Initial Contact, 24hr, 48hr, 72hr, 96hr | Assigned, In Progress, Submitted, Revision, Approved |
| **Entry form fields** | Policyholder, peril, referral source, contractor | File number, client name, peril, severity (1-5), estimate value |
| **Key calculations** | hoursSinceFirstAttempt, isOverdue | avgDaysHeld, dollarPerHour, firstTimeApprovalRate, revisionRate |
| **Contact targets** | Insured + Referral Source | Carrier + Client (or Carrier + PA) |
| **External tools** | ClaimWizard, DocuSeal, Outlook | Xactimate, Symbility, estimation platforms |
| **SOP timing** | Hour-based (24/48/72/96hr) | Day-based (severity targets: 1-5 days by complexity) |
| **Settlement tracking** | Not applicable | actualSettlement, settlementDate, isSettled |

---

## CURRENT CODEBASE STATE (Lovable Build — July 2025)

### Architecture (DO NOT PATCH — will be replaced)

- **Single mega-component**: `EstimatorKPITracker.tsx` (406 lines) manages everything
- **Data storage**: localStorage only — `kpi-tracker-data` key
- **Supabase**: Client configured (`esllnitrsljyvcduarrw.supabase.co`) but **zero tables, zero queries**
- **Auth**: None
- **Routing**: Single page (`/` → Index.tsx → EstimatorKPITracker)
- **Last commit**: July 24, 2025 (lovable-dev[bot])
- **Quality**: Typical Lovable output — clean UI, sloppy architecture, 60+ unused shadcn components

### Existing Components (reference only — will be rebuilt)

| Component | What It Does | Keep/Rebuild? |
|---|---|---|
| DataEntryTab.tsx | Estimate entry form with severity, peril, value | REBUILD from IntakeForm |
| EstimatorScorecard.tsx | Per-estimator metrics display | REBUILD from Scorecard.tsx |
| TeamDashboard.tsx | Aggregate team rankings | REBUILD from Team.tsx |
| AnalysisTab.tsx | Performance recommendations | REBUILD (onboarder version is still fake) |
| HistoricalData.tsx | Week-over-week trending | REBUILD from History page |
| LiquidityTab.tsx | Settlement value tracking | NEW — estimator-specific |
| PersonalStatsCard.tsx | Quick stats widget | Could keep as reference |
| ManageEstimatorDialog.tsx | Add/edit/remove estimators | REBUILD — Manage Onboarders equivalent |
| Documentation.tsx | Help/guide content | REBUILD |

### Existing Data Types (reference for schema design)

```typescript
// From src/types/kpi.ts — good foundation for Supabase schema
interface EstimateEntry {
  id: string;
  date: string;
  fileNumber: string;
  clientName: string;
  peril: string;              // Wind, Hail, Hurricane, Flood, Fire, Water, etc.
  severity: number;           // 1-5
  timeHours: number;
  revisionTimeHours: number;
  estimateValue: number;
  revisions: number;
  status: string;             // incomplete, sent, sent-to-carrier, unable-to-start, pending
  notes: string;
  actualSettlement: number;
  settlementDate: string;
  isSettled: boolean;
}

// Severity targets — time and value ranges per severity level
SEVERITY_TARGETS = {
  1: { minTime: 1, maxTime: 3, minValue: 1000, maxValue: 5000 },
  2: { minTime: 2, maxTime: 5, minValue: 5000, maxValue: 15000 },
  3: { minTime: 4, maxTime: 8, minValue: 15000, maxValue: 50000 },
  4: { minTime: 6, maxTime: 12, minValue: 50000, maxValue: 150000 },
  5: { minTime: 10, maxTime: 20, minValue: 150000, maxValue: 500000 }
}

PERIL_OPTIONS = ['Wind', 'Hail', 'Hurricane', 'Flood', 'Fire', 'Water', 'Lightning', 'Theft', 'Vandalism', 'Other']
```

### Existing Metrics (from kpiCalculations.ts)

- **Avg Days Held**: Days from entry to today (or settlement)
- **Revision Rate**: Total revisions / estimate count
- **First-Time Approval %**: Estimates with 0 revisions / total
- **Dollar Per Hour**: Total estimate value / (time hours + revision hours)
- **Team Overall Score**: Weighted — 40% dollar/hour, 30% revision rate, 20% approval rate, 10% efficiency

---

## UI / THEME

### Match Onboarder KPI Theme (CCS Portal dark navy)

```css
--background: 230 25% 15%;     /* #1e2030 */
--card: 232 24% 20%;           /* #262940 */
--border: 233 20% 28%;         /* #3a3d56 */
--muted: 233 23% 25%;          /* #2d3050 */
--radius: 0.75rem;             /* 12px */
/* Green primary, permanently dark mode via html { @apply dark } */
```

- Full-width layout: `max-w-[95vw]` on all data pages
- Tab colors: Overdue = red, all others = blue (`border-blue-500`)
- Time-in-stage left border: green <12hr, amber 12-24hr, red >24hr
- Collapsible sections with chevron rotation

---

## PROPOSED SUPABASE SCHEMA

### estimates table (equivalent of onboarder's `clients`)
```sql
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  file_number text NOT NULL,
  client_name text NOT NULL,
  peril text,
  severity integer CHECK (severity BETWEEN 1 AND 5),
  time_hours numeric,
  revision_time_hours numeric DEFAULT 0,
  estimate_value numeric,
  revisions integer DEFAULT 0,
  status text DEFAULT 'assigned',        -- assigned, in_progress, submitted, revision, approved, closed
  notes text,
  actual_settlement numeric,
  settlement_date timestamptz,
  is_settled boolean DEFAULT false,
  assigned_user text NOT NULL,           -- estimator name
  carrier text,
  policy_number text,
  claim_number text,
  loss_date timestamptz,
  loss_state text,
  completed_at timestamptz,
  step_0_confirmed boolean DEFAULT false
);
```

### Reuse from onboarder (same structure)
- `activity_logs` — same schema, different contact_target values (carrier/client vs insured/referral)
- `time_logs` — identical (session tracking per estimate)
- `stage_actions` — same schema (checkable actions per stage)
- `status_history` — same trigger-based approach

---

## RECOMMENDED BUILD APPROACH: /gsd (Get Stuff Done)

### Why GSD for this project

The onboarder KPI took 7 sessions because we built iteratively — discovering problems mid-build, backing up, re-doing work. GSD would front-load the planning and let us execute in organized phases with parallel agents.

### Proposed GSD Phases

**Phase 1: Foundation (clone + adapt)**
- Clone onboarder KPI repo into new estimator directory
- Rename all onboarder references to estimator
- Update status types, labels, transitions
- Update Supabase schema (estimates table instead of clients)
- Run migrations
- Verify basic app loads

**Phase 2: Entry Form + Workboard**
- Adapt IntakeForm for estimate fields (file number, severity, value, peril)
- Update workboard queries for estimate statuses
- Update ExcelGrid columns for estimator-specific data
- Wire date range picker

**Phase 3: Detail Panel + Activity System**
- Adapt ClientDetailPanel → EstimateDetailPanel
- Update activity log contact targets (carrier/client)
- Adapt StageActionHitList for estimator actions
- Update Step 0 checklist items

**Phase 4: Scorecard + Analytics**
- Adapt Scorecard metrics (dollar/hour, revision rate, approval rate)
- Wire CSV export
- Build settlement tracking (LiquidityTab equivalent)
- Team dashboard with real data

**Phase 5: Polish + Launch**
- Theme verification (match portal)
- Role-based access testing
- Mock data seeding
- CONTEXT.md finalization

### GSD Command to Start
```
/gsd:new-project
```
Then follow the prompts to set up the roadmap from this CONTEXT.md.

---

## OPEN QUESTIONS (answer before building)

| # | Question | Owner | Blocks |
|---|---|---|---|
| EQ1 | What are the estimator names? (equivalent of Reyniel, Ardee, Lexi, Sydnie) | Frank / Will | Phase 1 |
| EQ2 | What are the exact stage names and SOP timing? | Frank / Will | Phase 1 |
| EQ3 | What actions per stage? (equivalent of Text/Email/Call) | Frank / Will | Phase 3 |
| EQ4 | What Supabase project to use? Same as onboarder or separate? | Frank | Phase 1 |
| EQ5 | Settlement tracking — what fields beyond amount/date/settled? | Frank / Will | Phase 4 |
| EQ6 | Carrier communication tracking — what fields? | Frank / Will | Phase 3 |
| EQ7 | Severity targets — are the existing 1-5 levels and time ranges correct? | Frank / Will | Phase 2 |
| EQ8 | Integration with Xactimate or other estimation platforms? | Frank | Backlog |

---

## KEY FILES REFERENCE (from Onboarder KPI — what we'll clone)

| Onboarder File | Estimator Equivalent | Changes Needed |
|---|---|---|
| src/pages/OnboardingDaily.tsx | EstimatingDaily.tsx | Status names, queries, field names |
| src/components/ClientDetailPanel.tsx | EstimateDetailPanel.tsx | Section titles, fields |
| src/components/StageActionHitList.tsx | Same filename | Action types, labels |
| src/components/StepZeroChecklist.tsx | Same filename | Checklist items |
| src/components/ExcelGrid.tsx | Same filename | Column headers, data fields |
| src/components/ActivityLog.tsx | Same filename | Contact target labels |
| src/components/intake/IntakeForm.tsx | EstimateForm.tsx | All fields different |
| src/pages/admin/Scorecard.tsx | Same filename | Metrics, calculations |
| src/status.ts | Same filename | Status values, labels, transitions |
| src/types/onboarding.ts | src/types/estimating.ts | All type interfaces |
| src/contexts/TimerContext.tsx | Same filename | No changes needed |
| src/contexts/UserContext.tsx | Same filename | No changes needed |
| src/lib/auth.ts | Same filename | No changes needed |
| src/lib/mockUsers.ts | Same filename | Different names |

---

## GITHUB

- **Personal**: ftdcad/estimate-KPI-Tracker
- **Coastal org**: TBD — will need Coastal-Claims-Services/estimator-kpi-tracker when ready
- **Portal page name**: TBD (probably "Estimator KPI" or "Estimation Tracking")
- **Current state on GitHub**: All Lovable commits from July 2025. No PRs, no issues. Will be overwritten when we clone the onboarder system.

---

## RELATIONSHIP TO OTHER PROJECTS

- **Parent system**: Onboarder KPI Tracking System (ACTIVE, session 7 complete)
  - Local: `C:\Users\FrankDalton\myProjects\onboarder-kpi-tracking-system`
  - GitHub: `ftdcad/Onboarder-KPI-Tracking-System`
  - CONTEXT.md: Read that file for the source architecture
- **Blueprint docs**: `C:\Users\FrankDalton\myProjects\kpi system blueprint`
  - `ESTIMATOR_KPI_SPEC.md` — may have additional spec details
  - `UNIVERSAL_KPI_TEMPLATE.md` — shared patterns across KPI systems
- **Portal**: portal.coastalclaims.net (Taha manages — DO NOT MODIFY)
