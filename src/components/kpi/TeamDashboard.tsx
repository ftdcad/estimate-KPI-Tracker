import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KPIData } from '../../types/kpi';
import { calculateWeeklyMetrics, calculateTeamMetrics } from '../../utils/kpiCalculations';

interface TeamDashboardProps {
  kpiData: KPIData;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ kpiData }) => {
  const teamMetrics = calculateTeamMetrics(kpiData.estimators);
  
  const estimatorMetrics = Object.entries(kpiData.estimators).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    metrics: calculateWeeklyMetrics(data),
    rawName: name
  }));

  // Sort by overall performance score (weighted combination of metrics)
  const rankedEstimators = estimatorMetrics
    .map(est => ({
      ...est,
      overallScore: calculateOverallScore(est.metrics)
    }))
    .sort((a, b) => b.overallScore - a.overallScore);

  function calculateOverallScore(metrics: any): number {
    // Weighted scoring system
    const dollarHourScore = Math.min(metrics.dollarPerHour / 15000, 1) * 40; // 40% weight
    const revisionScore = Math.max(0, (2 - metrics.revisionRate) / 2) * 30; // 30% weight, lower is better
    const approvalScore = metrics.firstTimeApprovalRate / 100 * 20; // 20% weight
    const efficiencyScore = Math.max(0, (3 - metrics.avgDaysHeld) / 3) * 10; // 10% weight
    
    return Math.round(dollarHourScore + revisionScore + approvalScore + efficiencyScore);
  }

  const getPerformanceBadge = (value: number, target: number, isLowerBetter: boolean = false) => {
    const isGood = isLowerBetter ? value <= target : value >= target;
    const isWarning = isLowerBetter ? value <= target * 1.2 : value >= target * 0.8;
    
    if (isGood) return { variant: 'default' as const, class: 'bg-green-100 text-green-800 border-green-300' };
    if (isWarning) return { variant: 'secondary' as const, class: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { variant: 'destructive' as const, class: 'bg-red-100 text-red-800 border-red-300' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Overview</CardTitle>
          <CardDescription>
            Aggregate performance metrics for the estimating department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Team Avg Days Held</div>
              <div className="text-2xl font-bold text-primary">{teamMetrics.avgDaysHeld.toFixed(1)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Team Revision Rate</div>
              <div className="text-2xl font-bold text-primary">{teamMetrics.revisionRate.toFixed(1)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Team $/Hour</div>
              <div className="text-2xl font-bold text-primary">${teamMetrics.dollarPerHour.toLocaleString()}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Weekly Volume</div>
              <div className="text-2xl font-bold text-primary">{teamMetrics.totalEstimates}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimator Rankings</CardTitle>
          <CardDescription>
            Performance comparison across all estimators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-center">Rank</th>
                  <th className="border border-border p-3 text-left">Estimator</th>
                  <th className="border border-border p-3 text-center">$/Hour</th>
                  <th className="border border-border p-3 text-center">Revision Rate</th>
                  <th className="border border-border p-3 text-center">Avg Days Held</th>
                  <th className="border border-border p-3 text-center">Weekly Volume</th>
                  <th className="border border-border p-3 text-center">Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {rankedEstimators.map((estimator, index) => {
                  const dollarBadge = getPerformanceBadge(estimator.metrics.dollarPerHour, 12000);
                  const revisionBadge = getPerformanceBadge(estimator.metrics.revisionRate, 1.5, true);
                  const daysBadge = getPerformanceBadge(estimator.metrics.avgDaysHeld, 3, true);
                  const scoreBadge = getPerformanceBadge(estimator.overallScore, 80);

                  return (
                    <tr key={estimator.rawName} className="hover:bg-accent/50">
                      <td className="border border-border p-3 text-center font-bold text-lg">
                        {index + 1}
                      </td>
                      <td className="border border-border p-3 font-medium">
                        {estimator.name}
                      </td>
                      <td className="border border-border p-3 text-center">
                        <div className={`inline-block px-2 py-1 rounded text-sm ${dollarBadge.class}`}>
                          ${estimator.metrics.dollarPerHour.toLocaleString()}
                        </div>
                      </td>
                      <td className="border border-border p-3 text-center">
                        <div className={`inline-block px-2 py-1 rounded text-sm ${revisionBadge.class}`}>
                          {estimator.metrics.revisionRate.toFixed(1)}
                        </div>
                      </td>
                      <td className="border border-border p-3 text-center">
                        <div className={`inline-block px-2 py-1 rounded text-sm ${daysBadge.class}`}>
                          {estimator.metrics.avgDaysHeld.toFixed(1)}
                        </div>
                      </td>
                      <td className="border border-border p-3 text-center">
                        {estimator.metrics.totalEstimates}
                      </td>
                      <td className="border border-border p-3 text-center">
                        <div className={`inline-block px-2 py-1 rounded text-sm font-bold ${scoreBadge.class}`}>
                          {estimator.overallScore}
                        </div>
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
          <CardTitle>Severity Distribution This Week</CardTitle>
          <CardDescription>
            Breakdown of work assignments by severity level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-left">Estimator</th>
                  <th className="border border-border p-3 text-center">Severity 1</th>
                  <th className="border border-border p-3 text-center">Severity 2</th>
                  <th className="border border-border p-3 text-center">Severity 3</th>
                  <th className="border border-border p-3 text-center">Severity 4</th>
                  <th className="border border-border p-3 text-center">Severity 5</th>
                  <th className="border border-border p-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {estimatorMetrics.map(estimator => (
                  <tr key={estimator.rawName} className="hover:bg-accent/50">
                    <td className="border border-border p-3 font-medium">
                      {estimator.name}
                    </td>
                    {[1, 2, 3, 4, 5].map(severity => (
                      <td key={severity} className="border border-border p-3 text-center">
                        {estimator.metrics.severityBreakdown[severity as keyof typeof estimator.metrics.severityBreakdown]}
                      </td>
                    ))}
                    <td className="border border-border p-3 text-center font-bold">
                      {estimator.metrics.totalEstimates}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => alert('In the full implementation, this would open a dialog to add a new estimator with their own data entry tab.')}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Estimator
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamDashboard;