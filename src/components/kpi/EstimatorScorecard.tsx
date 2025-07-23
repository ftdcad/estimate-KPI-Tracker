import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KPIData, WeeklyMetrics, SEVERITY_TARGETS } from '../../types/kpi';
import { calculateWeeklyMetrics } from '../../utils/kpiCalculations';

interface EstimatorScorecardProps {
  kpiData: KPIData;
}

const EstimatorScorecard: React.FC<EstimatorScorecardProps> = ({ kpiData }) => {
  const getEstimatorKey = (estimatorName: string) => {
    return estimatorName.toLowerCase().replace(/\s+/g, '');
  };

  const firstEstimatorKey = kpiData.estimatorList.length > 0 ? getEstimatorKey(kpiData.estimatorList[0]) : 'nell';
  const [selectedEstimator, setSelectedEstimator] = useState(firstEstimatorKey);

  const metrics = calculateWeeklyMetrics(kpiData.estimators[selectedEstimator] || []);
  const estimatorName = kpiData.estimatorList.find(name => getEstimatorKey(name) === selectedEstimator) || 
                       selectedEstimator.charAt(0).toUpperCase() + selectedEstimator.slice(1);

  const getPerformanceStatus = (actual: number, target: number, isLowerBetter: boolean = false) => {
    const ratio = isLowerBetter ? target / actual : actual / target;
    if (ratio >= 1) return 'success';
    if (ratio >= 0.8) return 'warning';
    return 'destructive';
  };

  const getValueStatus = (value: number, severity: number) => {
    const target = SEVERITY_TARGETS[severity];
    if (value >= target.valueMin && value <= target.valueMax) return 'success';
    if (value < target.valueMin) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Individual Estimator Performance</CardTitle>
          <CardDescription>
            Select an estimator to view their detailed performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEstimator} onValueChange={setSelectedEstimator}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kpiData.estimatorList.map((estimatorName) => (
                <SelectItem key={getEstimatorKey(estimatorName)} value={getEstimatorKey(estimatorName)}>
                  {estimatorName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{estimatorName} - Weekly Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Days Held</div>
              <div className="text-2xl font-bold text-primary">{metrics.avgDaysHeld.toFixed(1)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Revision Count</div>
              <div className="text-2xl font-bold text-primary">{metrics.revisionRate.toFixed(1)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">First-Time Approval</div>
              <div className="text-2xl font-bold text-primary">{metrics.firstTimeApprovalRate.toFixed(0)}%</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Dollar Value/Hour</div>
              <div className="text-2xl font-bold text-primary">${metrics.dollarPerHour.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Performance by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-center">Severity</th>
                  <th className="border border-border p-3 text-center">Estimates</th>
                  <th className="border border-border p-3 text-center">Avg Time</th>
                  <th className="border border-border p-3 text-center">Target</th>
                  <th className="border border-border p-3 text-center">Performance</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((severity) => {
                  const count = metrics.severityBreakdown[severity as keyof typeof metrics.severityBreakdown];
                  const avgTime = metrics.avgTimePerSeverity[severity as keyof typeof metrics.avgTimePerSeverity];
                  const target = SEVERITY_TARGETS[severity];
                  
                  let timeDisplay = '';
                  if (avgTime > 0) {
                    timeDisplay = avgTime < 1 ? `${Math.round(avgTime * 60)} mins` : `${avgTime.toFixed(1)} hours`;
                  }
                  
                  return (
                    <tr key={severity} className="hover:bg-accent/50">
                      <td className="border border-border p-3 text-center font-bold">{severity}</td>
                      <td className="border border-border p-3 text-center">{count}</td>
                      <td className="border border-border p-3 text-center">{timeDisplay || '-'}</td>
                      <td className="border border-border p-3 text-center">{target.time}</td>
                      <td className="border border-border p-3 text-center">
                        {count > 0 ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            ✓ Met
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Claim Value by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-center">Severity</th>
                  <th className="border border-border p-3 text-center">Average Value</th>
                  <th className="border border-border p-3 text-center">Target Range</th>
                  <th className="border border-border p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((severity) => {
                  const avgValue = metrics.avgValuePerSeverity[severity as keyof typeof metrics.avgValuePerSeverity];
                  const target = SEVERITY_TARGETS[severity];
                  const status = avgValue > 0 ? getValueStatus(avgValue, severity) : null;
                  
                  const targetRange = severity === 5 
                    ? `$${target.valueMin.toLocaleString()}+`
                    : `$${target.valueMin.toLocaleString()} - $${target.valueMax.toLocaleString()}`;
                  
                  return (
                    <tr key={severity} className="hover:bg-accent/50">
                      <td className="border border-border p-3 text-center font-bold">{severity}</td>
                      <td className="border border-border p-3 text-center">
                        {avgValue > 0 ? `$${avgValue.toLocaleString()}` : '-'}
                      </td>
                      <td className="border border-border p-3 text-center">{targetRange}</td>
                      <td className="border border-border p-3 text-center">
                        {status && (
                          <Badge 
                            variant={status === 'success' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
                          >
                            {status === 'success' ? 'Optimal' : status === 'warning' ? 'Below Range' : 'Above Range'}
                          </Badge>
                        )}
                        {!status && <span className="text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimatorScorecard;