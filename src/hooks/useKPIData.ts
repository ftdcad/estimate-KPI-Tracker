import { useMemo } from 'react';
import type { KPIData, EstimateEntry } from '@/types/kpi';
import type { Estimate } from '@/types/estimate';
import { useEstimatorContext } from '@/contexts/EstimatorContext';

/**
 * Compatibility hook: transforms Supabase estimates into the old KPIData format
 * so existing child components (Scorecard, TeamDashboard, Analysis, etc.) keep working
 * without any changes. These components will get rewritten in Phase 2.
 */

function estimateToEntry(est: Estimate): EstimateEntry {
  // Map new status to old status for compatibility
  const statusMap: Record<string, EstimateEntry['status']> = {
    'assigned': 'pending',
    'in-progress': 'incomplete',
    'blocked': 'incomplete',
    'review': 'incomplete',
    'sent-to-carrier': 'sent-to-carrier',
    'revision-requested': 'incomplete',
    'revised': 'sent-to-carrier',
    'settled': 'sent-to-carrier',
    'closed': 'sent-to-carrier',
    'unable-to-start': 'unable-to-start',
  };

  return {
    id: est.id,
    date: est.date_received?.split('T')[0] || '',
    fileNumber: est.file_number,
    clientName: est.client_name,
    peril: (est.peril as EstimateEntry['peril']) || null,
    severity: (est.severity as 1 | 2 | 3 | 4 | 5) || null,
    timeHours: est.active_time_minutes > 0 ? est.active_time_minutes / 60 : (est.total_time_minutes > 0 ? est.total_time_minutes / 60 : null),
    revisionTimeHours: est.revision_time_minutes > 0 ? est.revision_time_minutes / 60 : null,
    estimateValue: est.estimate_value,
    revisions: est.revisions || null,
    status: statusMap[est.status] || null,
    notes: est.notes || '',
    actualSettlement: est.actual_settlement,
    settlementDate: est.settlement_date,
    isSettled: est.is_settled,
  };
}

export function useKPIData(): KPIData {
  const { estimates, profiles } = useEstimatorContext();

  return useMemo(() => {
    const estimatorList = profiles.map((p) => p.display_name);

    // Group estimates by estimator key (lowercase, no spaces)
    const estimators: Record<string, EstimateEntry[]> = {};
    for (const p of profiles) {
      const key = p.user_id;
      estimators[key] = estimates
        .filter((e) => e.estimator_id === p.user_id)
        .map(estimateToEntry);
    }

    return {
      estimators,
      estimatorList,
      historicalData: {},
      currentWeek: new Date().toISOString().split('T')[0],
    };
  }, [estimates, profiles]);
}
