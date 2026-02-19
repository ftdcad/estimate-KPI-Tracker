-- =============================================================
-- Estimator KPI Tracking System — Phase 1 Tables
-- Run this in the Supabase SQL Editor for project esllnitrsljyvcduarrw
-- Date: 2026-02-19
-- =============================================================

-- 1. ESTIMATES — The Core Record
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- IDENTITY
  file_number text NOT NULL,
  claim_number text DEFAULT '',
  policy_number text DEFAULT '',

  -- PEOPLE
  estimator_id text NOT NULL,
  estimator_name text NOT NULL,

  -- CLIENT
  client_name text NOT NULL,
  property_type text DEFAULT NULL,
  loss_state text DEFAULT '',

  -- LOSS DETAILS
  peril text DEFAULT NULL,
  severity integer CHECK (severity BETWEEN 1 AND 5) DEFAULT NULL,
  loss_date date DEFAULT NULL,

  -- CARRIER / ADJUSTER
  carrier text DEFAULT '',
  carrier_adjuster text DEFAULT '',
  carrier_adjuster_email text DEFAULT '',
  carrier_adjuster_phone text DEFAULT '',

  -- CONTRACTOR
  contractor_company text DEFAULT '',
  contractor_rep text DEFAULT '',
  contractor_rep_email text DEFAULT '',
  contractor_rep_phone text DEFAULT '',

  -- PUBLIC ADJUSTER
  public_adjuster text DEFAULT '',

  -- ESTIMATE VALUES
  estimate_value numeric DEFAULT NULL,
  rcv numeric DEFAULT NULL,
  acv numeric DEFAULT NULL,
  depreciation numeric DEFAULT NULL,
  deductible numeric DEFAULT NULL,
  net_claim numeric DEFAULT NULL,
  overhead_and_profit numeric DEFAULT NULL,

  -- THE SPLIT CLOCK
  active_time_minutes integer DEFAULT 0,
  blocked_time_minutes integer DEFAULT 0,
  total_time_minutes integer DEFAULT 0,
  revision_time_minutes integer DEFAULT 0,
  revisions integer DEFAULT 0,

  -- STATUS & LIFECYCLE
  status text DEFAULT 'assigned'
    CHECK (status IN (
      'assigned',
      'in-progress',
      'blocked',
      'review',
      'sent-to-carrier',
      'revision-requested',
      'revised',
      'settled',
      'closed',
      'unable-to-start'
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
  settlement_variance numeric DEFAULT NULL,

  -- LIFECYCLE DATES
  date_received timestamptz DEFAULT now(),
  date_started timestamptz DEFAULT NULL,
  date_completed timestamptz DEFAULT NULL,
  date_sent_to_carrier timestamptz DEFAULT NULL,
  date_closed timestamptz DEFAULT NULL,

  -- SLA
  sla_target_hours numeric DEFAULT NULL,
  sla_breached boolean DEFAULT false,
  sla_breached_at timestamptz DEFAULT NULL,

  -- NOTES
  notes text DEFAULT '',

  -- FUTURE CRM LINK
  crm_claim_id text DEFAULT NULL
);

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


-- 2. ESTIMATE_EVENTS — The Audit Trail
CREATE TABLE estimate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  estimator_id text NOT NULL,
  file_number text NOT NULL,

  event_type text NOT NULL
    CHECK (event_type IN (
      'status-change',
      'blocker-set',
      'blocker-cleared',
      'communication',
      'time-logged',
      'revision-requested',
      'revision-completed',
      'sla-warning',
      'sla-breach',
      'note-added',
      'value-updated',
      'escalated',
      'settlement-received'
    )),

  from_status text DEFAULT NULL,
  to_status text DEFAULT NULL,

  blocker_type text DEFAULT NULL,
  blocker_name text DEFAULT NULL,
  blocker_reason text DEFAULT NULL,
  blocker_duration_minutes integer DEFAULT NULL,

  communication_type text DEFAULT NULL
    CHECK (communication_type IN ('phone', 'email', 'text', 'portal-message', 'in-person')),
  communication_with text DEFAULT '',
  communication_direction text DEFAULT NULL
    CHECK (communication_direction IN ('outbound', 'inbound')),

  duration_minutes integer DEFAULT NULL,

  description text DEFAULT '',
  triggered_by text DEFAULT 'user'
    CHECK (triggered_by IN ('user', 'system', 'manager')),

  metadata jsonb DEFAULT '{}'
);

CREATE INDEX idx_events_estimate ON estimate_events(estimate_id, created_at DESC);
CREATE INDEX idx_events_type ON estimate_events(event_type, created_at DESC);
CREATE INDEX idx_events_estimator ON estimate_events(estimator_id, event_type, created_at DESC);
CREATE INDEX idx_events_file ON estimate_events(file_number, created_at DESC);


-- 3. BLOCKERS — Active Blocker Tracking
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
  duration_minutes integer DEFAULT NULL,

  is_active boolean DEFAULT true,

  resolution_note text DEFAULT ''
);

CREATE INDEX idx_blockers_active ON blockers(is_active, blocked_at DESC)
  WHERE is_active = true;
CREATE INDEX idx_blockers_estimate ON blockers(estimate_id, created_at DESC);
CREATE INDEX idx_blockers_type ON blockers(blocker_type, is_active);
CREATE INDEX idx_blockers_estimator ON blockers(estimator_id, is_active);


-- 4. TIME_LOGS — Active Work Sessions
CREATE TABLE time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  estimator_id text NOT NULL,

  started_at timestamptz NOT NULL,
  ended_at timestamptz DEFAULT NULL,
  duration_minutes integer DEFAULT NULL,
  is_active boolean DEFAULT true,

  activity_type text DEFAULT 'estimating'
    CHECK (activity_type IN ('estimating', 'reviewing', 'revising', 'research', 'other')),
  notes text DEFAULT ''
);

CREATE INDEX idx_time_logs_estimate ON time_logs(estimate_id, started_at DESC);
CREATE INDEX idx_time_logs_active ON time_logs(is_active)
  WHERE is_active = true;
CREATE INDEX idx_time_logs_estimator ON time_logs(estimator_id, started_at DESC);


-- 5. ESTIMATOR_PROFILES — Per-Estimator Config
CREATE TABLE estimator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  user_id text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,

  target_dollars_per_hour numeric DEFAULT NULL,
  target_estimates_per_week integer DEFAULT NULL,
  target_max_revision_rate numeric DEFAULT NULL,
  target_max_cycle_days numeric DEFAULT NULL,

  stats_total_estimates integer DEFAULT 0,
  stats_total_value numeric DEFAULT 0,
  stats_total_active_minutes integer DEFAULT 0,
  stats_avg_cycle_days numeric DEFAULT 0,
  stats_revision_rate numeric DEFAULT 0,
  stats_first_time_approval_rate numeric DEFAULT 0,
  stats_dollars_per_hour numeric DEFAULT 0,
  stats_adjusted_dollars_per_hour numeric DEFAULT 0,
  stats_sla_compliance_rate numeric DEFAULT 0,
  stats_last_updated timestamptz DEFAULT NULL
);


-- 6. CARRIERS — Verified/Unverified Pattern
CREATE TABLE carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verified_by text DEFAULT NULL,
  verified_at timestamptz DEFAULT NULL,
  merged_into uuid DEFAULT NULL REFERENCES carriers(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_carriers_verified ON carriers(is_verified, name)
  WHERE is_verified = true AND is_active = true;
CREATE INDEX idx_carriers_unverified ON carriers(is_verified, created_at DESC)
  WHERE is_verified = false;


-- 7. CONTRACTOR_COMPANIES
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

CREATE INDEX idx_contractors_verified ON contractor_companies(is_verified, name)
  WHERE is_verified = true AND is_active = true;
CREATE INDEX idx_contractors_unverified ON contractor_companies(is_verified, created_at DESC)
  WHERE is_verified = false;


-- 8. CONTRACTOR_REPS
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


-- 9. CARRIER_ADJUSTERS
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


-- 10. SLA_RULES — Configurable SLA Targets
CREATE TABLE sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,

  severity integer DEFAULT NULL,
  carrier text DEFAULT NULL,
  peril text DEFAULT NULL,
  loss_state text DEFAULT NULL,

  target_hours numeric NOT NULL,
  warning_hours numeric NOT NULL,
  blocker_timeout_hours numeric DEFAULT 24,

  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


-- =============================================================
-- SEED DATA
-- =============================================================

-- Default SLA rules by severity
INSERT INTO sla_rules (name, severity, target_hours, warning_hours, blocker_timeout_hours, priority) VALUES
  ('Severity 1 Default', 1, 0.5, 0.33, 4, 0),
  ('Severity 2 Default', 2, 1, 0.75, 8, 0),
  ('Severity 3 Default', 3, 3, 2, 12, 0),
  ('Severity 4 Default', 4, 6, 4.5, 24, 0),
  ('Severity 5 Default', 5, 12, 9, 24, 0);

-- Seed estimator profiles (Nell + Brandon)
INSERT INTO estimator_profiles (user_id, display_name, is_active) VALUES
  ('nell', 'Nell Dalton', true),
  ('brandon', 'Brandon Leighton', true);


-- =============================================================
-- ROW-LEVEL SECURITY (using anon key — policies open for now)
-- Phase 1: RLS enabled but permissive. Tighten in Phase 2.
-- =============================================================

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_adjusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;

-- Permissive policies for Phase 1 (anon key can read/write all)
-- Tighten with role-based policies in Phase 2
CREATE POLICY "Allow all for anon" ON estimates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON estimate_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON blockers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON time_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON estimator_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON carriers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contractor_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contractor_reps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON carrier_adjusters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sla_rules FOR ALL USING (true) WITH CHECK (true);
