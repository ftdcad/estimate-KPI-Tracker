# Estimator KPI Tracking System — Product Design Requirements (PDR)

> **Version**: 2.0 — The Split Clock
> **Author**: Frank Dalton (Coastal Claims Services) + Claude (Architect)
> **Date**: February 18, 2026
> **Purpose**: Complete technical specification for Claude Code implementation
> **Rule**: BINGO is the code word. No building until Frank says BINGO.

---

## 1. THE THESIS: SPLIT THE CLOCK

### The Problem
The current KPI system tells you what an estimator produced. It doesn't tell you why a file sat for 42 days.

If you look at an estimator's average days held and it says 31 days, you don't know if that's because they're slow or because they were waiting on a scoper for gutter dimensions for 27 of those days. Your KPIs are lying to you. A fast estimator who gets stuck waiting on other people looks identical to a slow estimator on paper.

### The Solution: Two Clocks
Every estimate runs two independent timers:

**Active Time** — the estimator is actually working. Writing the estimate in Xactimate, reviewing photos, calculating values. This is their responsibility.

**Blocked Time** — the estimator can't proceed. They're waiting on a scoper, a PA, a carrier, a contractor, a client. This is someone else's responsibility.

When an estimator hits a wall, they click one button: **"I'm Blocked."** They pick who they're waiting on, type one line explaining why, and the clock splits. Active time stops. Blocked time starts.

When the answer comes in, they click **"Unblocked."** Active time resumes.

A file can bounce between active and blocked multiple times. Every bounce is logged with who, why, and how long.

### What This Gives You

**Fair KPIs with two numbers:**
- **Raw $/hour** = total estimate value / total hours on file (company perspective — how fast are files moving?)
- **Adjusted $/hour** = total estimate value / active hours only (estimator perspective — how productive are they when they're actually working?)

The gap between those two numbers is the cost of blockers.

**Monday morning ammunition:**
> "We have 47 active files. 12 are blocked. Average active age is 3 days but average total age is 11 days — 8 days per file wasted waiting. Top blocker: Allstate's adjuster on water losses — 6 files, averaging 11 days stuck. Nell is producing $47K/hr adjusted but $18K raw because she's blocked constantly. Brandon has zero blocked files but his adjusted rate is $12K — that's training, not process."

**Downstream Power BI dimensions:**
Every blocker has a type, a description, a duration, and parties involved. Slice by carrier, contractor, peril, severity, state, adjuster, rep — all captured organically through one button click, not 30 mandatory form fields.

### Design Principles
1. **One button changes everything** — The blocker button is the feature. Don't bury it, don't overcomplicate it. Three clicks max: Blocked → who → why.
2. **Manual entry now, CRM-linked later** — All data entered by hand today. Schema designed so CRM auto-populates in ~12 months.
3. **Estimator-centric** — Estimators are the primary users and the primary people measured. They own follow-up and escalation.
4. **Dimensional tagging is optional but available** — Carrier, contractor, adjuster, rep fields exist and auto-complete. Not required on day one. Data builds over time.
5. **Don't slow down the daily workflow** — Entry form stays fast. Complexity lives in the data model and analytics, not in the estimator's face.
6. **Guest house architecture** — This app owns its own database, its own deploy, its own iteration cycle. Zero dependency on portal backend deploys.

---

## 2. SYSTEM ARCHITECTURE

### Guest House Model (Same as Onboarder)

This app is a standalone React + Supabase application that embeds as a page inside the Coastal Claims employee portal. It does NOT live inside the portal's MongoDB/Express backend. It does NOT require DEV TEAM to deploy changes.

```
┌─────────────────────────────────────────────────────────┐
│  Employee Portal (DEV TEAM's domain — DO NOT MODIFY)       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ /kpi-estimator page                               │  │
│  │ Loads the Estimator KPI app via iframe/embed       │  │
│  │ Passes auth via URL params (user, role, token)     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         │ URL params: ?user=nell&role=estimator&name=Nell+Dalton
         ▼
┌─────────────────────────────────────────────────────────┐
│  Estimator KPI App (your domain — iterate freely)       │
│  React + TypeScript + Vite + Tailwind + shadcn          │
│  ┌──────────┐  ┌──────────────────────────────────────┐ │
│  │ Auth via  │  │ Supabase (esllnitrsljyvcduarrw)     │ │
│  │ URL params│  │ ┌──────────┐ ┌──────────────────┐   │ │
│  │ (from     │  │ │estimates │ │estimate_events   │   │ │
│  │  portal)  │  │ ├──────────┤ ├──────────────────┤   │ │
│  └──────────┘  │ │blockers  │ │estimator_profiles│   │ │
│                │ ├──────────┤ ├──────────────────┤   │ │
│                │ │time_logs │ │reference_data    │   │ │
│                │ └──────────┘ └──────────────────┘   │ │
│                └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         │ Optional Phase 3: POST /api/notifications
         ▼
┌─────────────────────────────────────────────────────────┐
│  Portal Notification API (single HTTP call if needed)   │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts + React Query
- **Database**: Supabase (Postgres) — project `esllnitrsljyvcduarrw` (already configured, zero tables)
- **Auth**: URL params from portal (same pattern as onboarder: `src/lib/auth.ts`)
- **Hosting**: Separate from portal (own Netlify/Vercel deploy, or served as portal sub-app)
- **Real-time**: Supabase Realtime subscriptions (for live dashboard updates)

### What Already Exists in This Codebase (Keep)
| File | What It Does | Status |
|---|---|---|
| `src/types/kpi.ts` | EstimateEntry type, PerilType, severity targets | KEEP + extend |
| `src/utils/kpiCalculations.ts` | calculateWeeklyMetrics, team metrics, recommendations | KEEP + extend with split clock |
| `src/components/kpi/DataEntryTab.tsx` | Inline estimate entry table | KEEP + wire to Supabase + add blocker button |
| `src/components/kpi/EstimatorScorecard.tsx` | Per-estimator KPI cards | KEEP + add adjusted $/hr |
| `src/components/kpi/TeamDashboard.tsx` | Team rankings | KEEP + add blocker summary |
| `src/components/kpi/AnalysisTab.tsx` | Performance recommendations | KEEP + blocker pattern analysis |
| `src/components/kpi/HistoricalData.tsx` | Week-over-week (currently fake data) | REWRITE with real Supabase queries |
| `src/components/kpi/LiquidityTab.tsx` | Settlement accuracy | KEEP + wire to Supabase |
| `src/components/kpi/PersonalStatsCard.tsx` | Quick stats widget | KEEP + add split clock stats |
| `src/components/kpi/ManageEstimatorDialog.tsx` | Add/edit/remove estimators | KEEP + wire to Supabase |
| `src/components/kpi/Documentation.tsx` | Built-in help | UPDATE when done |
| `src/components/EstimatorKPITracker.tsx` | 406-line mega-component | BREAK UP into provider + page |
| `src/integrations/supabase/client.ts` | Supabase client (configured, zero tables) | KEEP |

### Patterns to Copy from Onboarder
| Pattern | Onboarder File | Adapt For |
|---|---|---|
| Auth system | `src/lib/auth.ts` | Portal URL params → CurrentUser, role-based visibility |
| User context | `src/contexts/UserContext.tsx` | Provider + dev role switcher |
| Timer context | `src/contexts/TimerContext.tsx` | Active time tracking, idle detection |
| Status machine | `src/status.ts` | Estimate lifecycle statuses + transitions |
| Supabase queries | `src/pages/OnboardingDaily.tsx` | Fetch + transform + display pattern |
| Detail panel | `src/components/ClientDetailPanel.tsx` | Estimate detail with event timeline |
| Activity logs | `src/components/ActivityLog.tsx` | Blocker log + communication log |
| Theme | `src/index.css` | Dark navy CSS vars |

---

## 3. SUPABASE SCHEMA

### 3.1 `estimates` — The Core Record

Every estimate is a row with full dimensional tagging and split-clock fields.

```sql
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- IDENTITY
  file_number text NOT NULL,
  claim_number text DEFAULT '',
  policy_number text DEFAULT '',

  -- PEOPLE
  estimator_id text NOT NULL,          -- From URL params (portal user identifier)
  estimator_name text NOT NULL,        -- Display name

  -- CLIENT
  client_name text NOT NULL,
  property_type text DEFAULT NULL,     -- residential, commercial, multi-family, other
  loss_state text DEFAULT '',

  -- LOSS DETAILS (Dimensional)
  peril text DEFAULT NULL,             -- Wind, Hail, Hurricane, Flood, Fire, Water, Lightning, etc.
  severity integer CHECK (severity BETWEEN 1 AND 5) DEFAULT NULL,
  loss_date date DEFAULT NULL,

  -- CARRIER / ADJUSTER (Dimensional)
  carrier text DEFAULT '',
  carrier_adjuster text DEFAULT '',
  carrier_adjuster_email text DEFAULT '',
  carrier_adjuster_phone text DEFAULT '',

  -- CONTRACTOR (Dimensional)
  contractor_company text DEFAULT '',
  contractor_rep text DEFAULT '',
  contractor_rep_email text DEFAULT '',
  contractor_rep_phone text DEFAULT '',

  -- PUBLIC ADJUSTER (Dimensional)
  public_adjuster text DEFAULT '',

  -- ESTIMATE VALUES
  estimate_value numeric DEFAULT NULL,
  rcv numeric DEFAULT NULL,            -- Replacement Cost Value
  acv numeric DEFAULT NULL,            -- Actual Cash Value
  depreciation numeric DEFAULT NULL,
  deductible numeric DEFAULT NULL,
  net_claim numeric DEFAULT NULL,
  overhead_and_profit numeric DEFAULT NULL,

  -- === THE SPLIT CLOCK ===
  active_time_minutes integer DEFAULT 0,     -- Total active work time (estimator's clock)
  blocked_time_minutes integer DEFAULT 0,    -- Total time waiting on others (blocker clock)
  total_time_minutes integer DEFAULT 0,      -- active + blocked (computed, or tracked separately)
  revision_time_minutes integer DEFAULT 0,
  revisions integer DEFAULT 0,

  -- STATUS & LIFECYCLE
  status text DEFAULT 'assigned'
    CHECK (status IN (
      'assigned',           -- File received, not yet started
      'in-progress',        -- Estimator actively working
      'blocked',            -- Waiting on someone/something
      'review',             -- Estimate written, internal review
      'sent-to-carrier',    -- Submitted to carrier
      'revision-requested', -- Carrier wants changes
      'revised',            -- Revision done, ready to resubmit
      'settled',            -- Settlement received
      'closed',             -- File complete
      'unable-to-start'     -- Cannot proceed
    )),

  -- CURRENT BLOCKER (populated when status = 'blocked')
  current_blocker_type text DEFAULT NULL
    CHECK (current_blocker_type IN (
      'scoper', 'public-adjuster', 'carrier', 'contractor',
      'client', 'internal', 'documentation', 'other'
    )),
  current_blocker_name text DEFAULT '',
  current_blocker_reason text DEFAULT '',
  current_blocked_at timestamptz DEFAULT NULL,

  -- SETTLEMENT
  actual_settlement numeric DEFAULT NULL,
  settlement_date date DEFAULT NULL,
  is_settled boolean DEFAULT false,
  settlement_variance numeric DEFAULT NULL,  -- actual - estimate (computed on settlement entry)

  -- LIFECYCLE DATES
  date_received timestamptz DEFAULT now(),
  date_started timestamptz DEFAULT NULL,
  date_completed timestamptz DEFAULT NULL,
  date_sent_to_carrier timestamptz DEFAULT NULL,
  date_closed timestamptz DEFAULT NULL,

  -- SLA
  sla_target_hours numeric DEFAULT NULL,   -- Auto-set from severity targets
  sla_breached boolean DEFAULT false,
  sla_breached_at timestamptz DEFAULT NULL,

  -- NOTES
  notes text DEFAULT '',

  -- FUTURE CRM LINK
  crm_claim_id text DEFAULT NULL
);

-- Indexes for common queries
CREATE INDEX idx_estimates_estimator ON estimates(estimator_id, date_received DESC);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_carrier ON estimates(carrier);
CREATE INDEX idx_estimates_peril_severity ON estimates(peril, severity);
CREATE INDEX idx_estimates_contractor ON estimates(contractor_company, contractor_rep);
CREATE INDEX idx_estimates_blocked ON estimates(status, current_blocked_at)
  WHERE status = 'blocked';
CREATE INDEX idx_estimates_date_range ON estimates(date_received, date_closed);
CREATE INDEX idx_estimates_loss_state ON estimates(loss_state);
CREATE INDEX idx_estimates_file_number ON estimates(file_number);
```

### 3.2 `estimate_events` — The Audit Trail

Every state change, every blocker set/cleared, every communication. This is the split-clock's memory. This is what Power BI will consume.

```sql
CREATE TABLE estimate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  estimator_id text NOT NULL,
  file_number text NOT NULL,            -- Denormalized for fast queries

  event_type text NOT NULL
    CHECK (event_type IN (
      'status-change',        -- Status transition
      'blocker-set',          -- Estimator marked file as blocked
      'blocker-cleared',      -- Blocker resolved
      'communication',        -- Phone/email/text logged
      'time-logged',          -- Active work session recorded
      'revision-requested',   -- Carrier requested revision
      'revision-completed',   -- Estimator completed revision
      'sla-warning',          -- SLA approaching breach (system)
      'sla-breach',           -- SLA breached (system)
      'note-added',           -- Note added
      'value-updated',        -- Estimate value changed
      'escalated',            -- Estimator escalated to management
      'settlement-received'   -- Settlement data entered
    )),

  -- Status change details
  from_status text DEFAULT NULL,
  to_status text DEFAULT NULL,

  -- Blocker details
  blocker_type text DEFAULT NULL,
  blocker_name text DEFAULT NULL,
  blocker_reason text DEFAULT NULL,
  blocker_duration_minutes integer DEFAULT NULL, -- Set when blocker is cleared

  -- Communication details
  communication_type text DEFAULT NULL
    CHECK (communication_type IN ('phone', 'email', 'text', 'portal-message', 'in-person')),
  communication_with text DEFAULT '',
  communication_direction text DEFAULT NULL
    CHECK (communication_direction IN ('outbound', 'inbound')),

  -- Time tracking
  duration_minutes integer DEFAULT NULL,

  -- General
  description text DEFAULT '',
  triggered_by text DEFAULT 'user'
    CHECK (triggered_by IN ('user', 'system', 'manager')),

  metadata jsonb DEFAULT '{}'
);

CREATE INDEX idx_events_estimate ON estimate_events(estimate_id, created_at DESC);
CREATE INDEX idx_events_type ON estimate_events(event_type, created_at DESC);
CREATE INDEX idx_events_estimator ON estimate_events(estimator_id, event_type, created_at DESC);
CREATE INDEX idx_events_file ON estimate_events(file_number, created_at DESC);
```

### 3.3 `blockers` — Active Blocker Tracking

A dedicated table for the current state of all active blockers. Makes the "12 files are blocked right now" query instant.

```sql
CREATE TABLE blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  estimator_id text NOT NULL,
  file_number text NOT NULL,

  blocker_type text NOT NULL
    CHECK (blocker_type IN (
      'scoper', 'public-adjuster', 'carrier', 'contractor',
      'client', 'internal', 'documentation', 'other'
    )),
  blocker_name text DEFAULT '',
  blocker_reason text NOT NULL,

  blocked_at timestamptz DEFAULT now(),
  resolved_at timestamptz DEFAULT NULL,
  duration_minutes integer DEFAULT NULL,     -- Computed on resolve

  is_active boolean DEFAULT true,

  -- Who/what resolved it
  resolution_note text DEFAULT ''
);

CREATE INDEX idx_blockers_active ON blockers(is_active, blocked_at DESC)
  WHERE is_active = true;
CREATE INDEX idx_blockers_estimate ON blockers(estimate_id, created_at DESC);
CREATE INDEX idx_blockers_type ON blockers(blocker_type, is_active);
CREATE INDEX idx_blockers_estimator ON blockers(estimator_id, is_active);
```

### 3.4 `time_logs` — Active Work Sessions

Tracks when the estimator was actively working on a file. Same pattern as onboarder's TimerContext.

```sql
CREATE TABLE time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  estimator_id text NOT NULL,

  started_at timestamptz NOT NULL,
  ended_at timestamptz DEFAULT NULL,
  duration_minutes integer DEFAULT NULL,    -- Computed on end
  is_active boolean DEFAULT true,           -- True = timer running now

  -- What were they doing
  activity_type text DEFAULT 'estimating'
    CHECK (activity_type IN ('estimating', 'reviewing', 'revising', 'research', 'other')),
  notes text DEFAULT ''
);

CREATE INDEX idx_time_logs_estimate ON time_logs(estimate_id, started_at DESC);
CREATE INDEX idx_time_logs_active ON time_logs(is_active)
  WHERE is_active = true;
CREATE INDEX idx_time_logs_estimator ON time_logs(estimator_id, started_at DESC);
```

### 3.5 `estimator_profiles` — Per-Estimator Config

Links portal user identity to estimator-specific settings.

```sql
CREATE TABLE estimator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  user_id text UNIQUE NOT NULL,        -- Portal user identifier (from URL params)
  display_name text NOT NULL,
  is_active boolean DEFAULT true,

  -- Personal targets (override defaults)
  target_dollars_per_hour numeric DEFAULT NULL,
  target_estimates_per_week integer DEFAULT NULL,
  target_max_revision_rate numeric DEFAULT NULL,
  target_max_cycle_days numeric DEFAULT NULL,

  -- Cached running stats (updated on estimate close — avoids recalculating)
  stats_total_estimates integer DEFAULT 0,
  stats_total_value numeric DEFAULT 0,
  stats_total_active_minutes integer DEFAULT 0,
  stats_avg_cycle_days numeric DEFAULT 0,
  stats_revision_rate numeric DEFAULT 0,
  stats_first_time_approval_rate numeric DEFAULT 0,
  stats_dollars_per_hour numeric DEFAULT 0,
  stats_adjusted_dollars_per_hour numeric DEFAULT 0,  -- THE SPLIT CLOCK METRIC
  stats_sla_compliance_rate numeric DEFAULT 0,
  stats_last_updated timestamptz DEFAULT NULL
);
```

### 3.6 Reference Data Tables — Verified/Unverified Pattern

**The Problem**: If estimators free-type carrier names, you get "Allstate", "All State", "Allstate Insurance Company" — three entries for the same carrier. Every dimensional query breaks.

**The Solution**: Dropdown shows only verified entries. If the carrier/contractor isn't in the list, the estimator types a freetext value that saves immediately as **unverified**. The estimate is never blocked. An admin reviews unverified entries and either merges them into an existing verified entry or approves them as new.

**How it works for the estimator:**
1. Start typing in the carrier field → dropdown shows verified matches
2. If a match exists → select it, done
3. If no match → finish typing, hit enter → value saves with `is_verified = false`
4. The estimate saves immediately with the freetext value — zero friction

**How it works for the admin (manager/superadmin):**
1. Admin view shows a queue: "5 unverified carriers this week"
2. For each unverified entry: **Approve** (becomes permanent dropdown option) or **Merge** (map to existing verified entry, update all linked estimates)
3. Merged entries update `estimates` rows that referenced the old name → canonical name

```sql
-- Carriers
CREATE TABLE carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,       -- Only verified entries show in dropdown
  verified_by text DEFAULT NULL,           -- Who approved it (admin user ID)
  verified_at timestamptz DEFAULT NULL,
  merged_into uuid DEFAULT NULL REFERENCES carriers(id),  -- If merged, points to canonical entry
  created_at timestamptz DEFAULT now()
);

-- Contractor Companies
CREATE TABLE contractor_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verified_by text DEFAULT NULL,
  verified_at timestamptz DEFAULT NULL,
  merged_into uuid DEFAULT NULL REFERENCES contractor_companies(id),
  created_at timestamptz DEFAULT now()
);

-- Contractor Reps (belong to a company)
CREATE TABLE contractor_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES contractor_companies(id),
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verified_by text DEFAULT NULL,
  verified_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Carrier Adjusters (belong to a carrier)
CREATE TABLE carrier_adjusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES carriers(id),
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verified_by text DEFAULT NULL,
  verified_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(carrier_id, name)
);

-- Indexes for dropdown queries (verified only)
CREATE INDEX idx_carriers_verified ON carriers(is_verified, name) WHERE is_verified = true AND is_active = true;
CREATE INDEX idx_contractors_verified ON contractor_companies(is_verified, name) WHERE is_verified = true AND is_active = true;
CREATE INDEX idx_carriers_unverified ON carriers(is_verified, created_at DESC) WHERE is_verified = false;
CREATE INDEX idx_contractors_unverified ON contractor_companies(is_verified, created_at DESC) WHERE is_verified = false;
```

**Merge logic**: When an admin merges "All State" into "Allstate":
1. Update all `estimates` where `carrier = 'All State'` → `carrier = 'Allstate'`
2. Set `carriers.merged_into` on the old entry → points to canonical carrier ID
3. Set `carriers.is_active = false` on the old entry
4. The old name is preserved for audit trail but never shows in dropdowns again

### 3.7 `sla_rules` — Configurable SLA Targets

```sql
CREATE TABLE sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,

  -- Match criteria (more specific = higher priority)
  severity integer DEFAULT NULL,
  carrier text DEFAULT NULL,
  peril text DEFAULT NULL,
  loss_state text DEFAULT NULL,

  -- Targets
  target_hours numeric NOT NULL,
  warning_hours numeric NOT NULL,
  blocker_timeout_hours numeric DEFAULT 24,

  priority integer DEFAULT 0,          -- Higher = checked first
  created_at timestamptz DEFAULT now()
);
```

**Default SLA Rules (Seed Data):**

| Severity | Target | Warning | Blocker Timeout |
|----------|--------|---------|-----------------|
| 1 | 0.5 hrs | 0.33 hrs | 4 hrs |
| 2 | 1 hr | 0.75 hrs | 8 hrs |
| 3 | 3 hrs | 2 hrs | 12 hrs |
| 4 | 6 hrs | 4.5 hrs | 24 hrs |
| 5 | 12 hrs | 9 hrs | 24 hrs |

### 3.8 Row-Level Security (RLS)

```sql
-- Estimators see their own estimates
-- Managers and superadmins see all
-- Role comes from auth context (set via URL params on app load)

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- Policy: estimators see own, managers see all
CREATE POLICY estimates_select ON estimates FOR SELECT USING (
  estimator_id = current_setting('app.user_id', true)
  OR current_setting('app.user_role', true) IN ('manager', 'superadmin')
);

-- Estimators can insert/update their own
CREATE POLICY estimates_insert ON estimates FOR INSERT WITH CHECK (
  estimator_id = current_setting('app.user_id', true)
);

CREATE POLICY estimates_update ON estimates FOR UPDATE USING (
  estimator_id = current_setting('app.user_id', true)
  OR current_setting('app.user_role', true) IN ('manager', 'superadmin')
);

-- Same pattern for estimate_events, blockers, time_logs
```

---

## 4. FILE LIFECYCLE & STATE MACHINE

### 4.1 Status Flow (Cyclical — Not Linear)

Estimates bounce. This is not the onboarder's linear pipeline.

```
assigned ──────► in-progress ◄──────────────────────┐
    │                │ ▲                              │
    │                ▼ │                              │
    │             blocked ── (resolved) ──► in-progress
    │                                         │
    ▼                                         ▼
unable-to-start                            review
                                              │
                                              ▼
                                       sent-to-carrier
                                         │        │
                                         ▼        ▼
                                   settled    revision-requested
                                     │              │
                                     ▼              ▼
                                   closed        revised ──► sent-to-carrier
```

**Key difference from onboarder**: An estimate can cycle `in-progress → blocked → in-progress` multiple times. It can cycle `sent-to-carrier → revision-requested → revised → sent-to-carrier` multiple times. Each cycle is logged.

### 4.2 Allowed Transitions

```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'assigned':            ['in-progress', 'unable-to-start'],
  'in-progress':         ['blocked', 'review', 'sent-to-carrier'],
  'blocked':             ['in-progress'],
  'review':              ['in-progress', 'sent-to-carrier'],  // Back to in-progress if issues found
  'sent-to-carrier':     ['revision-requested', 'settled'],
  'revision-requested':  ['in-progress'],                     // Goes back to active work
  'revised':             ['sent-to-carrier'],
  'settled':             ['closed'],
  'closed':              [],                                   // Terminal
  'unable-to-start':     ['assigned']                          // Can be re-opened
};
```

### 4.3 What Gets Timestamped on the Estimate

| Field | Set When |
|-------|----------|
| `date_received` | Estimate created (`assigned`) |
| `date_started` | First transition to `in-progress` |
| `date_completed` | First transition to `review` or `sent-to-carrier` |
| `date_sent_to_carrier` | Transition to `sent-to-carrier` (updated each time if re-sent) |
| `date_closed` | Transition to `closed` |

### 4.4 The Blocker Protocol

When estimator clicks "I'm Blocked":

1. **Status changes** to `blocked`
2. **Modal requires**: blocker type (dropdown), blocker name (text/autocomplete), reason (text)
3. **On save**:
   - `estimates.status` → `blocked`
   - `estimates.current_blocker_type/name/reason` → populated
   - `estimates.current_blocked_at` → now()
   - New row in `blockers` table with `is_active = true`
   - New row in `estimate_events` with `event_type = 'blocker-set'`
4. **Active timer pauses** (if running in TimerContext)

When estimator clicks "Unblocked":

1. **Status changes** to `in-progress`
2. **On save**:
   - `blockers` row: `resolved_at` → now(), `duration_minutes` → computed, `is_active` → false
   - `estimates.blocked_time_minutes` += duration
   - `estimates.current_blocker_*` → cleared
   - `estimates.status` → `in-progress`
   - New row in `estimate_events` with `event_type = 'blocker-cleared'` and `blocker_duration_minutes`
3. **Active timer resumes**

---

## 5. KPI CALCULATIONS (The Split Clock Math)

### 5.1 The Two Dollar-Per-Hour Numbers

```typescript
// RAW $/hr — Company perspective: how fast are files moving?
const rawDollarsPerHour = totalEstimateValue / (totalTimeMinutes / 60);

// ADJUSTED $/hr — Estimator perspective: how productive when actually working?
const adjustedDollarsPerHour = totalEstimateValue / (activeTimeMinutes / 60);

// THE GAP — Cost of blockers
const blockerCostRatio = 1 - (activeTimeMinutes / totalTimeMinutes);
// If blockerCostRatio = 0.60, that means 60% of file time is wasted waiting
```

### 5.2 Core Metrics (Preserved + Extended)

**Existing (keep — from kpiCalculations.ts):**

| Metric | Formula | Kept From |
|--------|---------|-----------|
| Avg Days Held | `avg(now - date_received)` for open, `avg(date_closed - date_received)` for closed | Existing |
| Revision Rate | `count(revisions > 0) / total * 100` | Existing |
| First-Time Approval % | `count(revisions = 0) / total_sent * 100` | Existing |
| Dollar Per Hour (raw) | `sum(estimate_value) / sum(total_time_minutes / 60)` | Existing (renamed to "raw") |
| Severity Breakdown | Count per severity level | Existing |
| Avg Time Per Severity | `avg(active_time_minutes)` grouped by severity | Existing |
| Avg Value Per Severity | `avg(estimate_value)` grouped by severity | Existing |

**New (split clock additions):**

| Metric | Formula | What It Reveals |
|--------|---------|-----------------|
| **Adjusted $/hr** | `sum(estimate_value) / sum(active_time_minutes / 60)` | True estimator productivity |
| **Active Efficiency** | `active_time_minutes / total_time_minutes * 100` | % of time actually working |
| **Blocker Frequency** | `count(estimates that entered blocked) / total * 100` | How often work is interrupted |
| **Avg Blocker Duration** | `avg(blocker_duration_minutes)` | How long blockers persist |
| **Blocker Cost (hours)** | `sum(blocked_time_minutes) / 60` per period | Raw hours lost to waiting |
| **Top Blocker Type** | Mode of `blocker_type` | Who causes most delays |
| **SLA Compliance** | `count(completed within target) / total * 100` | Meeting time targets |
| **Settlement Accuracy** | `avg(abs(actual_settlement - estimate_value) / estimate_value * 100)` | How close to reality |
| **Carrier Difficulty Index** | See formula below | Which carriers cost the most time |

### 5.3 Weighted Overall Score (Updated for Split Clock)

```typescript
const overallScore =
  (adjustedDollarsPerHour / target * 30) +     // 30% — adjusted productivity
  ((100 - revisionRate) / 100 * 25) +           // 25% — quality
  (slaComplianceRate / 100 * 20) +              // 20% — speed
  (activeEfficiency / 100 * 15) +               // 15% — efficiency (low blocker ratio)
  (settlementAccuracy / 100 * 10);              // 10% — accuracy
```

### 5.4 Carrier Difficulty Index

```typescript
const carrierDifficultyIndex =
  (carrierAvgCycleDays / globalAvgCycleDays * 0.4) +
  (carrierRevisionRate / globalRevisionRate * 0.3) +
  (carrierAvgBlockerMinutes / globalAvgBlockerMinutes * 0.3);
// Score > 1.0 = harder than average
```

### 5.5 Dimensional Drill-Down

Every core metric can be grouped/filtered by:
- **Carrier**: "Allstate estimates average 34 days vs Citizens at 21 days"
- **Peril**: "Water losses take 2.3x longer than wind"
- **Severity**: "Severity 4 has a 38% revision rate"
- **Carrier Adjuster**: "Adjuster Jane Smith averages 12 days to respond"
- **Contractor Company**: "ABC Roofing files have 67% blocker rate"
- **Contractor Rep**: "Mike at ABC averages 8 days in blocked status"
- **Loss State**: "Florida estimates average $42K, Kentucky $18K"
- **Blocker Type**: "62% of blockers are waiting on scopers"
- **Time Period**: Week, month, quarter, year, custom range

### 5.6 Severity Targets (Preserved)

| Severity | Target Time | Value Range |
|----------|-------------|-------------|
| 1 | < 30 min | $2,000 – $5,000 |
| 2 | < 1 hour | $5,000 – $15,000 |
| 3 | < 3 hours | $15,000 – $50,000 |
| 4 | < 6 hours | $50,000 – $150,000 |
| 5 | < 12 hours | $150,000+ |

### 5.7 Red Flag Thresholds (Dual Clock Check)

The split clock changes how you read red flags. A file that's 1 hour active but 25 days total isn't a slow estimator — it's a blocker problem. Every severity level gets two thresholds: one for active time (estimator speed) and one for total time (process speed). If active time is fine but total time is blown, the system flags blockers, not the estimator.

| Severity | Active Time Flag | Total Time Flag | Red Flag If |
|----------|-----------------|-----------------|-------------|
| 1 | > 45 min active | > 3 days total | Active > 45min = slow estimator. Total > 3d with active < 45min = blocker problem. |
| 2 | > 1.5 hrs active | > 5 days total | Active > 1.5hr = slow estimator. Total > 5d with active < 1.5hr = blocker problem. |
| 3 | > 4.5 hrs active | > 10 days total | Active > 4.5hr = slow estimator. Total > 10d with active < 4.5hr = blocker problem. |
| 4 | > 9 hrs active | > 15 days total | Active > 9hr = slow estimator. Total > 15d with active < 9hr = blocker problem. |
| 5 | > 18 hrs active | > 25 days total | Active > 18hr = slow estimator. Total > 25d with active < 18hr = blocker problem. |

The `useEstimateAlerts` hook uses these thresholds to generate two different kinds of flags: **"Estimator Slow"** (active time exceeded) vs **"Process Slow"** (total time exceeded with acceptable active time). This is the split clock's diagnostic power — it tells you *where* the problem is, not just *that* there is one.

---

## 6. NOTIFICATIONS (Phased)

### Phase 1: In-App Only (No Portal Dependency)

All notifications live inside the KPI app itself. No external API calls required.

| Trigger | Visual | Where |
|---------|--------|-------|
| File age > severity target | Red highlight on row, badge count | Data entry table, dashboard |
| Active blocker > 24 hours | Amber warning on row, "aging" badge | Data entry table, blocker list |
| Active blocker > 48 hours | Red alert on row | Data entry table, blocker list |
| File in `assigned` > 48hrs with no activity | "Stale" indicator | Data entry table |
| SLA breached | Red SLA badge on row | Data entry table, scorecard |

Implementation: A React hook (`useEstimateAlerts`) runs on data load, compares timestamps against SLA rules, and decorates the UI. Zero backend cron needed for Phase 1 — all computed client-side.

### Phase 3: Portal Notifications (Optional)

When ready, the KPI app can POST to the portal's notification API:

```typescript
// Single HTTP call to portal API
await fetch(`${PORTAL_API_URL}/api/notifications`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${portalToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'SLA Breach: File FL-202503050',
    message: 'Severity 3 estimate exceeded 3hr target (now at 4.2hr)',
    type: 'warning',
    recipients: [estimatorPortalUserId],
    actionUrl: '/kpi-estimator?file=FL-202503050',
    actionLabel: 'View File'
  })
});
```

The portal's existing Notification model supports `actionUrl` deep links, `recipients` targeting, and `readBy` tracking. No portal code changes needed — just an API call.

---

## 7. FRONTEND COMPONENTS

### 7.1 Existing Components — What Changes

| Component | What Changes |
|---|---|
| `EstimatorKPITracker.tsx` | Break into page shell + React Query provider. Remove localStorage. |
| `DataEntryTab.tsx` | Wire to Supabase. Add status column. Add **"Blocked / Unblocked" button** per row. Add carrier/contractor fields (optional, auto-complete). Color-code rows by status/age. |
| `EstimatorScorecard.tsx` | Add **Adjusted $/hr** alongside raw. Add active efficiency %. Add blocker stats. |
| `TeamDashboard.tsx` | Add team blocker summary (total blocked files, top blocker type, total hours lost). |
| `AnalysisTab.tsx` | Add blocker pattern analysis. "Your top blocker is [carrier] on [peril] — 62% of your blocked time." |
| `HistoricalData.tsx` | Replace fake data with real date-range Supabase queries. |
| `LiquidityTab.tsx` | Wire to Supabase. Add carrier-level settlement patterns. |
| `PersonalStatsCard.tsx` | Show split clock: "Adjusted $47K/hr | Raw $18K/hr | 60% blocked" |
| `ManageEstimatorDialog.tsx` | Manage `estimator_profiles` table via Supabase. |

### 7.2 New Components

| Component | Purpose | Phase |
|---|---|---|
| **`BlockerDialog.tsx`** | Modal: pick blocker type, name, reason. Three clicks max. | **Phase 1** |
| **`UnblockDialog.tsx`** | Modal: confirm unblock, optional resolution note. | **Phase 1** |
| `EstimateDetailPanel.tsx` | Slide-out panel: full estimate detail + event timeline + blocker history | Phase 2 |
| `CommunicationLogDialog.tsx` | Modal: log phone/email/text about an estimate | Phase 2 |
| `BlockerReport.tsx` | Dashboard tab: all active blockers, aging, by type, by carrier | Phase 2 |
| `DimensionalAnalysis.tsx` | Dashboard tab: filter/group by any dimension | Phase 2 |
| `CarrierScorecard.tsx` | Carrier-level metrics: cycle time, revision rate, difficulty index | Phase 2 |
| `SLADashboard.tsx` | SLA compliance across all estimators | Phase 2 |
| `ActiveTimerWidget.tsx` | Floating timer for current file (from onboarder's TimerContext) | Phase 2 |
| `PowerBIExport.tsx` | Export button: download flat CSV/JSON for Power BI | Phase 3 |
| **`ReferenceDataAdmin.tsx`** | Admin view: review unverified carriers/contractors, approve or merge. Manager/superadmin only. | **Phase 1** |

### 7.3 The Blocker Button (Phase 1 — Most Important UI Element)

On the DataEntryTab, every row with status `in-progress` shows a button:

```
[ I'm Blocked ]  ← Orange button, visible, impossible to miss
```

Click → `BlockerDialog` opens:

```
┌─────────────────────────────────────┐
│  What's blocking this file?         │
│                                     │
│  Who:  [ Waiting on Scoper     ▼ ]  │  ← 6 options + Other
│                                     │
│  Name: [ Carlos Machin         ▼ ]  │  ← Auto-complete from reference data
│                                     │
│  Why:  [ Need gutter dimensions  ]  │  ← Free text, one line
│                                     │
│         [ Cancel ]   [ Blocked ]    │
└─────────────────────────────────────┘
```

When status = `blocked`, the button changes to:

```
[ Unblocked ✓ ]  ← Green button
```

Click → `UnblockDialog`:

```
┌─────────────────────────────────────┐
│  Resolve blocker                    │
│                                     │
│  Blocked 3 days waiting on Scoper   │
│  "Need gutter dimensions"           │
│                                     │
│  Note: [ Got dimensions from Carlos]│  ← Optional
│                                     │
│         [ Cancel ]  [ Unblocked ]   │
└─────────────────────────────────────┘
```

Row in the data table changes color:
- `in-progress` → no highlight
- `blocked` → amber/orange left border + "BLOCKED 3d" badge
- `blocked` > 48hrs → red left border + "BLOCKED 5d" badge
- `sla_breached` → red background tint

---

## 8. UI / THEME

### Dark Navy (Match Portal)

```css
:root {
  --background: 230 25% 15%;     /* #1e2030 */
  --card: 232 24% 20%;           /* #262940 */
  --border: 233 20% 28%;         /* #3a3d56 */
  --muted: 233 23% 25%;          /* #2d3050 */
  --radius: 0.75rem;
}
/* Permanently dark: html { @apply dark } */
```

- Full-width layout: `max-w-[95vw]`
- Blocker rows: amber left border (< 48hr), red left border (> 48hr)
- SLA breached rows: subtle red background tint
- Active timer: green pulse when running, gray when paused
- Status badges: color-coded per status

---

## 9. POWER BI EXPORT (Phase 3)

### Flat Estimate Export

One row per estimate, all dimensions denormalized:

```
file_number | estimator_name | client_name | carrier | carrier_adjuster |
contractor_company | contractor_rep | public_adjuster |
peril | severity | loss_state | property_type |
estimate_value | actual_settlement | settlement_variance |
active_time_minutes | blocked_time_minutes | total_time_minutes |
revision_time_minutes | revisions |
status | sla_target_hours | sla_breached |
date_received | date_started | date_completed | date_sent | date_closed |
cycle_time_days | active_hours | raw_dollars_per_hour | adjusted_dollars_per_hour |
blocker_count | primary_blocker_type | total_blocker_minutes
```

### Flat Event Export

One row per event, for building Power BI timelines:

```
file_number | estimator_name | event_type | event_date |
from_status | to_status |
blocker_type | blocker_name | blocker_duration_minutes |
communication_type | communication_with | duration_minutes | description
```

Delivered as: CSV download button in the app (Phase 3). Optionally, a Supabase view that Power BI can connect to directly via the Postgres connector.

---

## 10. BUILD PHASES

### Phase 1: Foundation + Split Clock (First Build Session)
**Goal**: Estimators enter real data with the blocker button working. Keep it laser-focused.

1. Create all Supabase tables (estimates, estimate_events, blockers, time_logs, estimator_profiles, reference tables, sla_rules)
2. Seed default SLA rules (severity-based)
3. Copy auth pattern from onboarder (URL params → CurrentUser)
4. Copy status machine pattern from onboarder (allowed transitions)
5. Wire `DataEntryTab` to Supabase (replace localStorage)
6. Build `BlockerDialog` and `UnblockDialog`
7. Add status column and blocker button to DataEntryTab
8. Break up `EstimatorKPITracker.tsx` mega-component
9. Create `estimator_profiles` for existing estimators
10. Dark navy theme
11. **Migrate existing data**: Script to convert old entries to new `estimates` rows

**Phase 1 Scope Boundary — Schema-Ready, UI in Phase 2:**
The following fields exist in the schema (Section 3.1) but do NOT get UI in Phase 1. The DataEntryTab uses `estimate_value` as a single number. Don't build input fields, columns, or dialogs for these until Phase 2:
- `rcv`, `acv`, `depreciation`, `deductible`, `net_claim`, `overhead_and_profit` — value breakdown fields
- `review` status — internal review step (keep in state machine, don't build a review workflow yet)
- `communication_type`, `communication_with`, `communication_direction` on estimate_events — communication logging UI
- `ActiveTimerWidget` — live timer (Phase 2 after we see how manual time entry works)

Phase 1 DataEntryTab columns: file number, client name, carrier (optional, auto-complete), peril, severity, estimate value (single number), time hours, status, blocker button. That's it.

**Verify**: Estimator can enter estimate → work on it → click Blocked → enter reason → click Unblocked → see time split. Event trail captured. Adjusted $/hr shows alongside raw $/hr on scorecard.

### Phase 2: Analytics + Split Clock Dashboard (After 2 Weeks of Real Data)
**Goal**: The Monday morning ammunition.

1. Update `EstimatorScorecard` with adjusted $/hr and blocker stats
2. Update `TeamDashboard` with team blocker summary
3. Build `BlockerReport` tab (active blockers, aging, by type, by carrier)
4. Build `DimensionalAnalysis` tab (filter/group by any dimension)
5. Build `CarrierScorecard` (difficulty index)
6. Build `EstimateDetailPanel` with event timeline
7. Build `CommunicationLogDialog`
8. Wire `ActiveTimerWidget` (from onboarder's TimerContext)
9. Replace `HistoricalData` with real date-range queries
10. Update `LiquidityTab` for new settlement structure
11. SLA visual indicators (color-coding on table rows)

**Verify**: Manager can answer "why is this file slow?" in 30 seconds.

### Phase 3: Notifications + Power BI + Polish (After 30 Days)
**Goal**: System runs itself, feeds executive reporting.

1. In-app notification system (`useEstimateAlerts` hook)
2. Optional portal notification API integration
3. Power BI export (CSV + JSON + optional Supabase view)
4. Historical trend analysis with real data
5. Supplement tracking (if needed based on usage patterns)
6. Clean unused shadcn components
7. Update Documentation.tsx
8. Performance testing

**Verify**: SLA alerts firing, exports generating, trends visible.

---

## 11. DATA MIGRATION

### From Old KPIData (MongoDB) to New Estimates (Supabase)

The portal's `KPIData` MongoDB document has a Map of estimator names → arrays of `IEstimateEntry`. Export via the existing `/api/kpi/current` endpoint, then transform:

```typescript
// For each old entry:
// file_number       ← fileNumber
// client_name       ← clientName
// peril             ← peril
// severity          ← severity
// active_time_minutes ← timeHours * 60  (convert hours to minutes)
// revision_time_minutes ← revisionTimeHours * 60
// estimate_value    ← estimateValue
// revisions         ← revisions
// status            ← map old status to new status
// notes             ← notes
// actual_settlement ← actualSettlement
// settlement_date   ← settlementDate
// is_settled        ← isSettled
// date_received     ← date
// estimator_id      ← estimator key
// estimator_name    ← from estimatorList

// Old statuses → New statuses:
// 'incomplete'       → 'in-progress'
// 'sent'             → 'sent-to-carrier'
// 'sent-to-carrier'  → 'sent-to-carrier'
// 'unable-to-start'  → 'unable-to-start'
// 'pending'          → 'assigned'
// null               → 'assigned'
```

Historical data in `kpiData.historicalData` gets the same treatment with original dates preserved.

---

## 12. OPEN QUESTIONS

| # | Question | Blocks | Default If Unanswered |
|---|---|---|---|
| EQ1 | Current estimator names + how they map to portal user IDs? | Phase 1 | **ANSWERED** — see Estimator Roster below. |

### Estimator Roster (EQ1 — Confirmed)

| Name | Role | Department | Location |
|------|------|------------|----------|
| Eileen "Nell" Dalton | Lead Estimator | Estimating | Florida |
| Brandon Leighton | Estimator | Estimating | Florida |

**Auth mapping**: Portal URL params pass the user's portal ID as `estimator_id` and display name as `name`. The `estimator_profiles` table seeds with these two estimators on first deploy. Exact portal IDs come from the portal's user system at deploy time.
| EQ2 | Same Supabase project as onboarder, or separate? | Phase 1 | Separate. `esllnitrsljyvcduarrw` is this app's dedicated project (already configured, zero tables, never shared with onboarder). |
| EQ3 | Start with known carriers/contractors or empty reference tables? | Phase 1 | **ANSWERED**: Empty tables with verified/unverified pattern. Estimators type freetext if no match → saves as unverified → admin reviews queue to approve or merge. See Section 3.6. |
| EQ4 | Active timer auto-start on file open, or manual start? | Phase 2 | Manual with optional timer widget |
| EQ5 | Should `estimated_value` be the single number or do we need RCV/ACV/depreciation/deductible breakdown on day one? | Phase 1 | Single number. Breakdown fields exist but are optional. |
| EQ6 | How does the portal embed this app? iframe, or built into portal bundle? | Phase 1 | **ANSWERED**: Iframe. Separate deploy (own Netlify/Vercel), portal loads it via iframe on the /kpi-estimator page, passes auth via URL params (`?user=<portalId>&role=estimator&name=Nell+Dalton`). Same proven pattern as onboarder. Zero portal bundle changes needed. |

---

## 13. SUCCESS METRICS

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Average cycle time drops | -30% | 90 days |
| 100% of blocked files have named blocker + reason | 100% | 30 days |
| SLA compliance rate | > 80% | 90 days |
| Revision rate decreases | -15% | 90 days |
| Data completeness (carrier, peril, severity filled) | > 95% | 60 days |
| Manager can answer "why is this file slow?" | < 30 seconds | Phase 2 launch |
| Adjusted $/hr visible for every estimator | 100% | Phase 1 launch |

---

## 14. RELATIONSHIP TO OTHER SYSTEMS

| System | Relationship | Integration |
|---|---|---|
| Employee Portal | Host — embeds KPI app as a page | URL params for auth, optional notification API |
| CCS CRM | Future data source (~12 months) | `crm_claim_id` field ready for linking |
| Legal KPI | Sister system — same portal, different metrics | No direct integration |
| Onboarder KPI | Architecture reference | Auth, timer, status machine patterns |
| Power BI | Downstream consumer | CSV/JSON export, optional Supabase direct connect |

---

## 15. NON-NEGOTIABLES

These are guardrails. If a builder ever has to make a tradeoff, these rules win.

1. **The blocker button ships in Phase 1.** It's not a Phase 2 feature. It's not a "nice to have." It's the entire point. If Phase 1 doesn't have the blocker button working end-to-end (click → modal → blocker saved → clock split → unblock → clock merged), the build failed.

2. **Three clicks max to block.** Blocked → who → why. If an estimator has to fill out a form, scroll through options, or click through multiple screens, they won't use it. One button, one dropdown, one text field, done.

3. **Adjusted $/hr displayed alongside raw $/hr everywhere.** Not hidden in a detail panel. Not on a separate tab. Every place that shows dollar-per-hour shows both numbers side by side. The gap between them is the whole story.

4. **Party fields are always optional, never blocking.** Carrier, adjuster, contractor, rep — all of them. An estimator should be able to enter an estimate with just: file number, client name, severity, value. Dimensional tagging builds over time through auto-complete, not mandatory fields.

5. **Guest house architecture. No portal modifications.** This app owns its own Supabase database, its own deploy pipeline, its own iteration cycle. Zero changes to the portal backend. Zero dependency on DEV TEAM. The only portal touchpoint is reading URL params on load and an optional Phase 3 notification POST.

6. **Sell it as "proves it wasn't your fault."** The blocker button isn't surveillance. It's the estimator's tool to show that their file sat for 27 days because of a scoper, not because they were slow. If the UX ever feels like a time-tracking punishment, something went wrong.

---

*This document is the single source of truth for building the Estimator KPI V2 system. The split clock is the thesis. The blocker button is the feature. Everything else serves those two ideas. Read this before every Claude Code session.*
