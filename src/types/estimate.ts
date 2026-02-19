import type { EstimateStatus, BlockerType } from '@/lib/status';

/** Row from `estimates` table — snake_case matches Supabase */
export interface Estimate {
  id: string;
  created_at: string;
  updated_at: string;
  file_number: string;
  claim_number: string;
  policy_number: string;
  estimator_id: string;
  estimator_name: string;
  client_name: string;
  property_type: string | null;
  loss_state: string;
  peril: string | null;
  severity: number | null;
  loss_date: string | null;
  carrier: string;
  carrier_adjuster: string;
  carrier_adjuster_email: string;
  carrier_adjuster_phone: string;
  contractor_company: string;
  contractor_rep: string;
  contractor_rep_email: string;
  contractor_rep_phone: string;
  public_adjuster: string;
  referral_source: string;
  referral_source_rep: string;
  estimate_value: number | null;
  rcv: number | null;
  acv: number | null;
  depreciation: number | null;
  deductible: number | null;
  net_claim: number | null;
  overhead_and_profit: number | null;
  active_time_minutes: number;
  blocked_time_minutes: number;
  total_time_minutes: number;
  revision_time_minutes: number;
  revisions: number;
  status: EstimateStatus;
  current_blocker_type: BlockerType | null;
  current_blocker_name: string;
  current_blocker_reason: string;
  current_blocked_at: string | null;
  actual_settlement: number | null;
  settlement_date: string | null;
  is_settled: boolean;
  settlement_variance: number | null;
  date_received: string;
  date_started: string | null;
  date_completed: string | null;
  date_sent_to_carrier: string | null;
  date_closed: string | null;
  sla_target_hours: number | null;
  sla_breached: boolean;
  sla_breached_at: string | null;
  notes: string;
  crm_claim_id: string | null;
}

/** Row from `estimate_events` table */
export interface EstimateEvent {
  id: string;
  created_at: string;
  estimate_id: string;
  estimator_id: string;
  file_number: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  blocker_type: string | null;
  blocker_name: string | null;
  blocker_reason: string | null;
  blocker_duration_minutes: number | null;
  communication_type: string | null;
  communication_with: string;
  communication_direction: string | null;
  duration_minutes: number | null;
  description: string;
  triggered_by: string;
  metadata: Record<string, unknown>;
}

/** Row from `blockers` table */
export interface Blocker {
  id: string;
  created_at: string;
  estimate_id: string;
  estimator_id: string;
  file_number: string;
  blocker_type: BlockerType;
  blocker_name: string;
  blocker_reason: string;
  blocked_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  resolution_note: string;
}

/** Row from `estimator_profiles` table */
export interface EstimatorProfile {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  display_name: string;
  is_active: boolean;
  target_dollars_per_hour: number | null;
  target_estimates_per_week: number | null;
  target_max_revision_rate: number | null;
  target_max_cycle_days: number | null;
  stats_total_estimates: number;
  stats_total_value: number;
  stats_total_active_minutes: number;
  stats_avg_cycle_days: number;
  stats_revision_rate: number;
  stats_first_time_approval_rate: number;
  stats_dollars_per_hour: number;
  stats_adjusted_dollars_per_hour: number;
  stats_sla_compliance_rate: number;
  stats_last_updated: string | null;
}

/** Minimal insert shape for creating a new estimate */
export type EstimateInsert = Omit<Estimate,
  'id' | 'created_at' | 'updated_at' | 'active_time_minutes' | 'blocked_time_minutes' |
  'total_time_minutes' | 'revision_time_minutes' | 'current_blocker_type' |
  'current_blocker_name' | 'current_blocker_reason' | 'current_blocked_at' |
  'settlement_variance' | 'sla_breached' | 'sla_breached_at' | 'date_closed' |
  'date_completed' | 'date_sent_to_carrier' | 'date_started' | 'crm_claim_id'
> & {
  // These have DB defaults but we might want to override
  active_time_minutes?: number;
  blocked_time_minutes?: number;
  total_time_minutes?: number;
  revision_time_minutes?: number;
};
