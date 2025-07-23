export interface EstimateEntry {
  id: string;
  date: string;
  fileNumber: string;
  clientName: string;
  severity: 1 | 2 | 3 | 4 | 5 | null;
  timeHours: number | null;
  revisionTimeHours: number | null;
  estimateValue: number | null;
  revisions: number | null;
  status: 'incomplete' | 'sent' | 'sent-to-carrier' | 'unable-to-start' | 'pending' | null;
  notes: string;
  // Settlement/Liquidity fields
  actualSettlement: number | null;
  settlementDate: string | null;
  isSettled: boolean;
}

export interface EstimatorData {
  [estimator: string]: EstimateEntry[];
}

export interface WeeklyMetrics {
  avgDaysHeld: number;
  revisionRate: number;
  firstTimeApprovalRate: number;
  dollarPerHour: number;
  totalEstimates: number;
  severityBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  avgTimePerSeverity: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  avgValuePerSeverity: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface KPIData {
  estimators: EstimatorData;
  estimatorList: string[]; // List of estimator names for dynamic tabs
  historicalData: {
    [week: string]: EstimatorData;
  };
  currentWeek: string;
}

export interface SeverityTarget {
  time: string;
  valueMin: number;
  valueMax: number;
}

export const SEVERITY_TARGETS: Record<number, SeverityTarget> = {
  1: { time: '< 30 mins', valueMin: 2000, valueMax: 5000 },
  2: { time: '< 1 hour', valueMin: 5000, valueMax: 15000 },
  3: { time: '< 3 hours', valueMin: 15000, valueMax: 50000 },
  4: { time: '< 6 hours', valueMin: 50000, valueMax: 150000 },
  5: { time: '< 12 hours', valueMin: 150000, valueMax: Infinity }
};