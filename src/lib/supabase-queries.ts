import { supabase } from '@/integrations/supabase/client';
import type { Estimate, EstimateEvent, Blocker, EstimatorProfile } from '@/types/estimate';
import type { EstimateStatus, BlockerType } from '@/lib/status';

// ── ESTIMATES ──────────────────────────────────────────────────

export async function fetchEstimates(estimatorId?: string): Promise<Estimate[]> {
  let query = supabase
    .from('estimates')
    .select('*')
    .order('date_received', { ascending: false });

  if (estimatorId) {
    query = query.eq('estimator_id', estimatorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Estimate[];
}

export async function insertEstimate(estimate: Partial<Estimate>): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .insert(estimate)
    .select()
    .single();
  if (error) throw error;
  return data as Estimate;
}

export async function updateEstimate(id: string, updates: Partial<Estimate>): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Estimate;
}

export async function deleteEstimate(id: string): Promise<void> {
  const { error } = await supabase.from('estimates').delete().eq('id', id);
  if (error) throw error;
}

// ── BLOCKER PROTOCOL ───────────────────────────────────────────

export async function setBlocker(params: {
  estimateId: string;
  estimatorId: string;
  fileNumber: string;
  blockerType: BlockerType;
  blockerName: string;
  blockerReason: string;
}): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update estimate status to blocked
  await supabase
    .from('estimates')
    .update({
      status: 'blocked' as EstimateStatus,
      current_blocker_type: params.blockerType,
      current_blocker_name: params.blockerName,
      current_blocker_reason: params.blockerReason,
      current_blocked_at: now,
      updated_at: now,
    })
    .eq('id', params.estimateId);

  // 2. Create blocker row
  await supabase.from('blockers').insert({
    estimate_id: params.estimateId,
    estimator_id: params.estimatorId,
    file_number: params.fileNumber,
    blocker_type: params.blockerType,
    blocker_name: params.blockerName,
    blocker_reason: params.blockerReason,
    blocked_at: now,
    is_active: true,
  });

  // 3. Log event
  await supabase.from('estimate_events').insert({
    estimate_id: params.estimateId,
    estimator_id: params.estimatorId,
    file_number: params.fileNumber,
    event_type: 'blocker-set',
    to_status: 'blocked',
    blocker_type: params.blockerType,
    blocker_name: params.blockerName,
    blocker_reason: params.blockerReason,
    triggered_by: 'user',
  });
}

export async function clearBlocker(params: {
  estimateId: string;
  estimatorId: string;
  fileNumber: string;
  resolutionNote?: string;
}): Promise<void> {
  const now = new Date().toISOString();

  // 1. Find active blocker to compute duration
  const { data: activeBlocker } = await supabase
    .from('blockers')
    .select('*')
    .eq('estimate_id', params.estimateId)
    .eq('is_active', true)
    .single();

  const durationMinutes = activeBlocker
    ? Math.round((Date.now() - new Date(activeBlocker.blocked_at).getTime()) / 60000)
    : 0;

  // 2. Resolve the blocker
  if (activeBlocker) {
    await supabase
      .from('blockers')
      .update({
        resolved_at: now,
        duration_minutes: durationMinutes,
        is_active: false,
        resolution_note: params.resolutionNote || '',
      })
      .eq('id', activeBlocker.id);
  }

  // 3. Update estimate — add blocked time, clear blocker fields, set back to in-progress
  const { data: estimate } = await supabase
    .from('estimates')
    .select('blocked_time_minutes')
    .eq('id', params.estimateId)
    .single();

  const currentBlocked = estimate?.blocked_time_minutes ?? 0;

  await supabase
    .from('estimates')
    .update({
      status: 'in-progress' as EstimateStatus,
      blocked_time_minutes: currentBlocked + durationMinutes,
      total_time_minutes: (estimate as any)?.total_time_minutes ?? 0 + durationMinutes,
      current_blocker_type: null,
      current_blocker_name: '',
      current_blocker_reason: '',
      current_blocked_at: null,
      updated_at: now,
    })
    .eq('id', params.estimateId);

  // 4. Log event
  await supabase.from('estimate_events').insert({
    estimate_id: params.estimateId,
    estimator_id: params.estimatorId,
    file_number: params.fileNumber,
    event_type: 'blocker-cleared',
    from_status: 'blocked',
    to_status: 'in-progress',
    blocker_type: activeBlocker?.blocker_type || null,
    blocker_name: activeBlocker?.blocker_name || null,
    blocker_duration_minutes: durationMinutes,
    description: params.resolutionNote || '',
    triggered_by: 'user',
  });
}

// ── STATUS CHANGES ─────────────────────────────────────────────

export async function changeStatus(params: {
  estimateId: string;
  estimatorId: string;
  fileNumber: string;
  fromStatus: EstimateStatus;
  toStatus: EstimateStatus;
}): Promise<void> {
  const now = new Date().toISOString();

  // Build update object with lifecycle date timestamps
  const updates: Partial<Estimate> = {
    status: params.toStatus,
    updated_at: now,
  };

  // Set lifecycle timestamps on first occurrence
  if (params.toStatus === 'in-progress') {
    // Only set date_started on first transition to in-progress
    const { data: est } = await supabase
      .from('estimates')
      .select('date_started')
      .eq('id', params.estimateId)
      .single();
    if (!est?.date_started) {
      updates.date_started = now;
    }
  } else if (params.toStatus === 'sent-to-carrier') {
    updates.date_sent_to_carrier = now;
    // Set date_completed on first send
    const { data: est } = await supabase
      .from('estimates')
      .select('date_completed')
      .eq('id', params.estimateId)
      .single();
    if (!est?.date_completed) {
      updates.date_completed = now;
    }
  } else if (params.toStatus === 'review') {
    const { data: est } = await supabase
      .from('estimates')
      .select('date_completed')
      .eq('id', params.estimateId)
      .single();
    if (!est?.date_completed) {
      updates.date_completed = now;
    }
  } else if (params.toStatus === 'closed') {
    updates.date_closed = now;
  }

  await supabase.from('estimates').update(updates).eq('id', params.estimateId);

  // Log event
  await supabase.from('estimate_events').insert({
    estimate_id: params.estimateId,
    estimator_id: params.estimatorId,
    file_number: params.fileNumber,
    event_type: 'status-change',
    from_status: params.fromStatus,
    to_status: params.toStatus,
    triggered_by: 'user',
  });
}

// ── ESTIMATOR PROFILES ─────────────────────────────────────────

export async function fetchEstimatorProfiles(): Promise<EstimatorProfile[]> {
  const { data, error } = await supabase
    .from('estimator_profiles')
    .select('*')
    .eq('is_active', true)
    .order('display_name');
  if (error) throw error;
  return (data ?? []) as EstimatorProfile[];
}

export async function addEstimatorProfile(userId: string, displayName: string): Promise<EstimatorProfile> {
  const { data, error } = await supabase
    .from('estimator_profiles')
    .insert({ user_id: userId, display_name: displayName })
    .select()
    .single();
  if (error) throw error;
  return data as EstimatorProfile;
}

export async function updateEstimatorProfile(id: string, updates: Partial<EstimatorProfile>): Promise<void> {
  const { error } = await supabase
    .from('estimator_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── CARRIERS (verified/unverified) ─────────────────────────────

export async function fetchVerifiedCarriers(): Promise<string[]> {
  const { data, error } = await supabase
    .from('carriers')
    .select('name')
    .eq('is_verified', true)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((c: any) => c.name);
}

export async function ensureCarrier(name: string): Promise<void> {
  // Upsert — if carrier exists, do nothing. If not, create as unverified.
  const { error } = await supabase
    .from('carriers')
    .upsert({ name, is_verified: false }, { onConflict: 'name', ignoreDuplicates: true });
  if (error && !error.message.includes('duplicate')) throw error;
}

// ── CLIENT NAME SEARCH (autocomplete) ───────────────────────────

export interface ClientSuggestion {
  client_name: string;
  property_type: string | null;
  loss_state: string;
  loss_date: string | null;
  carrier: string;
  referral_source: string;
  referral_source_rep: string;
  contractor_company: string;
  contractor_rep: string;
  contractor_rep_email: string;
  contractor_rep_phone: string;
  file_number: string;
  date_received: string;
}

export async function searchClientNames(search: string): Promise<ClientSuggestion[]> {
  const { data, error } = await supabase
    .from('estimates')
    .select('client_name, property_type, loss_state, loss_date, carrier, referral_source, referral_source_rep, contractor_company, contractor_rep, contractor_rep_email, contractor_rep_phone, file_number, date_received')
    .ilike('client_name', `%${search}%`)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;

  // Deduplicate by client_name — keep the most recent
  const seen = new Set<string>();
  const unique: ClientSuggestion[] = [];
  for (const row of data ?? []) {
    const key = (row.client_name as string).toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row as ClientSuggestion);
    }
  }
  return unique;
}

// ── ACTIVE BLOCKERS (for dashboard counts) ─────────────────────

export async function fetchActiveBlockers(): Promise<Blocker[]> {
  const { data, error } = await supabase
    .from('blockers')
    .select('*')
    .eq('is_active', true)
    .order('blocked_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Blocker[];
}
