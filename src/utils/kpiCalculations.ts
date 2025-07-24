import { EstimateEntry, WeeklyMetrics } from '../types/kpi';

export const calculateWeeklyMetrics = (entries: EstimateEntry[]): WeeklyMetrics => {
  const validEntries = entries.filter(entry => 
    entry.severity !== null && 
    entry.timeHours !== null && 
    entry.estimateValue !== null
  );

  if (validEntries.length === 0) {
    return {
      avgDaysHeld: 0,
      revisionRate: 0,
      firstTimeApprovalRate: 0,
      dollarPerHour: 0,
      totalEstimates: 0,
      severityBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgTimePerSeverity: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgValuePerSeverity: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  // Calculate average days held (simplified - using current date as submission)
  const currentDate = new Date();
  const totalDaysHeld = validEntries.reduce((sum, entry) => {
    const entryDate = new Date(entry.date);
    const daysHeld = Math.ceil((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + Math.max(daysHeld, 0);
  }, 0);
  const avgDaysHeld = totalDaysHeld / validEntries.length;

  // Calculate revision rate
  const totalRevisions = validEntries.reduce((sum, entry) => sum + (entry.revisions || 0), 0);
  const revisionRate = totalRevisions / validEntries.length;

  // Calculate first-time approval rate
  const firstTimeApprovals = validEntries.filter(entry => (entry.revisions || 0) === 0).length;
  const firstTimeApprovalRate = (firstTimeApprovals / validEntries.length) * 100;

  // Calculate dollar per hour
  const totalValue = validEntries.reduce((sum, entry) => sum + (entry.estimateValue || 0), 0);
  const totalHours = validEntries.reduce((sum, entry) => 
    sum + (entry.timeHours || 0) + (entry.revisionTimeHours || 0), 0
  );
  
  console.log('KPI Debug:', {
    validEntries: validEntries.length,
    totalValue,
    totalHours,
    entries: validEntries.map(e => ({
      timeHours: e.timeHours,
      revisionTimeHours: e.revisionTimeHours,
      estimateValue: e.estimateValue,
      severity: e.severity
    }))
  });
  
  const dollarPerHour = totalHours > 0 ? totalValue / totalHours : 0;

  // Calculate severity breakdown
  const severityBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const severityTimes = { 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<number, number[]>;
  const severityValues = { 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<number, number[]>;

  validEntries.forEach(entry => {
    if (entry.severity) {
      severityBreakdown[entry.severity]++;
      if (entry.timeHours) {
        severityTimes[entry.severity].push(entry.timeHours);
      }
      if (entry.estimateValue) {
        severityValues[entry.severity].push(entry.estimateValue);
      }
    }
  });

  // Calculate averages per severity
  const avgTimePerSeverity = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const avgValuePerSeverity = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  [1, 2, 3, 4, 5].forEach(severity => {
    const times = severityTimes[severity];
    const values = severityValues[severity];
    
    avgTimePerSeverity[severity as keyof typeof avgTimePerSeverity] = 
      times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
    
    avgValuePerSeverity[severity as keyof typeof avgValuePerSeverity] = 
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  });

  return {
    avgDaysHeld,
    revisionRate,
    firstTimeApprovalRate,
    dollarPerHour,
    totalEstimates: validEntries.length,
    severityBreakdown,
    avgTimePerSeverity,
    avgValuePerSeverity
  };
};

export const calculateTeamMetrics = (allEstimatorData: Record<string, EstimateEntry[]>) => {
  const allEntries = Object.values(allEstimatorData).flat();
  return calculateWeeklyMetrics(allEntries);
};

export const generatePerformanceRecommendations = (
  estimatorName: string, 
  metrics: WeeklyMetrics
) => {
  const recommendations = [];
  
  if (metrics.revisionRate > 1.5) {
    recommendations.push({
      type: 'warning',
      message: `${estimatorName} has a high revision rate (${metrics.revisionRate.toFixed(1)}). Consider additional training or limiting to lower severity claims.`
    });
  }
  
  if (metrics.dollarPerHour < 10000) {
    recommendations.push({
      type: 'warning',
      message: `${estimatorName}'s productivity is below target ($${metrics.dollarPerHour.toLocaleString()}/hour). Review work assignment strategy.`
    });
  }
  
  if (metrics.firstTimeApprovalRate > 80) {
    recommendations.push({
      type: 'success',
      message: `${estimatorName} has excellent first-time approval rate (${metrics.firstTimeApprovalRate.toFixed(0)}%). Consider assigning more complex claims.`
    });
  }
  
  return recommendations;
};