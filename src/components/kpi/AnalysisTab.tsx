import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { KPIData } from '../../types/kpi';
import { calculateWeeklyMetrics, generatePerformanceRecommendations } from '../../utils/kpiCalculations';

interface AnalysisTabProps {
  kpiData: KPIData;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ kpiData }) => {
  const estimatorAnalysis = Object.entries(kpiData.estimators).map(([name, data]) => {
    const metrics = calculateWeeklyMetrics(data);
    const recommendations = generatePerformanceRecommendations(name, metrics);
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      rawName: name,
      metrics,
      recommendations
    };
  });

  const redFlags = [];
  
  // Check for red flags
  estimatorAnalysis.forEach(est => {
    if (est.metrics.revisionRate > 1.5) {
      redFlags.push({
        type: 'High Revision Rate',
        estimator: est.name,
        metric: 'Avg Revisions',
        current: est.metrics.revisionRate.toFixed(1),
        target: '< 1.5'
      });
    }
    
    if (est.metrics.dollarPerHour < 10000) {
      redFlags.push({
        type: 'Below $/Hour Target',
        estimator: est.name,
        metric: 'Dollar/Hour',
        current: `$${est.metrics.dollarPerHour.toLocaleString()}`,
        target: '> $10,000'
      });
    }
    
    if (est.metrics.avgDaysHeld > 3) {
      redFlags.push({
        type: 'Slow Turnaround',
        estimator: est.name,
        metric: 'Avg Days Held',
        current: est.metrics.avgDaysHeld.toFixed(1),
        target: '< 3 days'
      });
    }
  });

  // Work assignment recommendations based on actual performance
  const sortedByAccuracy = estimatorAnalysis.sort((a, b) => a.metrics.revisionRate - b.metrics.revisionRate);
  const sortedBySpeed = estimatorAnalysis.sort((a, b) => b.metrics.dollarPerHour - a.metrics.dollarPerHour);
  const topPerformer = estimatorAnalysis.find(e => e.metrics.revisionRate < 1.2 && e.metrics.dollarPerHour > 10000);
  const averagePerformers = estimatorAnalysis.filter(e => e.metrics.revisionRate >= 1.2 && e.metrics.revisionRate <= 1.5);
  const strugglingPerformers = estimatorAnalysis.filter(e => e.metrics.revisionRate > 1.5);

  const assignmentMatrix = [
    {
      severity: 1,
      primary: estimatorAnalysis.length > 0 ? 'Any Available Estimator' : 'No estimators available',
      secondary: '-',
      avoid: '-',
      reason: 'Low complexity, suitable for all skill levels and training'
    },
    {
      severity: 2,
      primary: averagePerformers.length > 0 ? averagePerformers[0].name : (estimatorAnalysis.length > 0 ? 'Any Available Estimator' : 'No estimators available'),
      secondary: estimatorAnalysis.length > 1 ? 'Other estimators' : '-',
      avoid: strugglingPerformers.length > 2 ? strugglingPerformers.slice(-1)[0].name : '-',
      reason: 'Medium complexity, good for most estimators'
    },
    {
      severity: 3,
      primary: sortedByAccuracy.length > 0 ? sortedByAccuracy[0].name : 'Best available estimator',
      secondary: sortedByAccuracy.length > 1 ? sortedByAccuracy[1].name : '-',
      avoid: strugglingPerformers.length > 0 ? strugglingPerformers.map(e => e.name).join(', ') : '-',
      reason: 'High complexity, requires accuracy and experience'
    },
    {
      severity: 4,
      primary: topPerformer?.name || (sortedByAccuracy.length > 0 ? sortedByAccuracy[0].name : 'Most experienced estimator'),
      secondary: sortedByAccuracy.length > 1 && sortedByAccuracy[1].metrics.revisionRate < 1.3 ? sortedByAccuracy[1].name : '-',
      avoid: strugglingPerformers.length > 0 ? strugglingPerformers.map(e => e.name).join(', ') : '-',
      reason: 'Very high complexity, only assign to proven performers'
    },
    {
      severity: 5,
      primary: topPerformer?.name || (sortedBySpeed.length > 0 && sortedBySpeed[0].metrics.revisionRate < 1.3 ? sortedBySpeed[0].name : 'Most experienced estimator'),
      secondary: '-',
      avoid: strugglingPerformers.length > 0 ? strugglingPerformers.map(e => e.name).join(', ') : (estimatorAnalysis.filter(e => e.metrics.revisionRate > 1.3).map(e => e.name).join(', ') || '-'),
      reason: 'Highest complexity, requires expert-level accuracy and efficiency'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Performance Insights
          </CardTitle>
          <CardDescription>
            Analysis and recommendations based on current performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <strong>Team Performance Overview</strong><br />
              {estimatorAnalysis.length === 0 
                ? "No estimator data available for analysis. Please add some estimate entries to see recommendations."
                : `Analyzing ${estimatorAnalysis.length} estimator${estimatorAnalysis.length > 1 ? 's' : ''} with ${estimatorAnalysis.reduce((sum, est) => sum + est.metrics.totalEstimates, 0)} total estimates this week.`
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-left">Estimator</th>
                  <th className="border border-border p-3 text-left">Strength</th>
                  <th className="border border-border p-3 text-left">Area for Improvement</th>
                  <th className="border border-border p-3 text-left">Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {estimatorAnalysis.map(est => {
                  let strength = 'Consistent performance';
                  let improvement = 'Continue current approach';
                  let action = 'Maintain current assignments';
                  
                  if (est.metrics.dollarPerHour > 12000 && est.metrics.revisionRate < 1.2) {
                    strength = 'Excellent speed and accuracy across all severity levels';
                    improvement = 'None - top performer';
                    action = 'Assign more Severity 4-5 claims';
                  } else if (est.metrics.revisionRate > 1.5) {
                    strength = est.metrics.severityBreakdown[1] + est.metrics.severityBreakdown[2] > 0 ? 'Good with Severity 1-2 claims' : 'Learning phase';
                    improvement = 'High revision rate, needs quality focus';
                    action = 'Limit to Severity 1-2 claims, provide additional training';
                  } else if (est.metrics.dollarPerHour < 10000) {
                    strength = 'Good accuracy';
                    improvement = 'Productivity below target';
                    action = 'Speed training and work assignment optimization';
                  }
                  
                  return (
                    <tr key={est.rawName} className="hover:bg-accent/50">
                      <td className="border border-border p-3 font-medium">{est.name}</td>
                      <td className="border border-border p-3">{strength}</td>
                      <td className="border border-border p-3">{improvement}</td>
                      <td className="border border-border p-3">
                        <Badge 
                          variant={action.includes('top performer') || action.includes('Assign more') ? 'default' : 'secondary'}
                          className={
                            action.includes('top performer') || action.includes('Assign more') 
                              ? 'bg-green-100 text-green-800 border-green-300' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }
                        >
                          {action}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {redFlags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Red Flag Alerts
            </CardTitle>
            <CardDescription>
              Performance metrics that require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-destructive text-destructive-foreground">
                    <th className="border border-border p-3 text-left">Alert Type</th>
                    <th className="border border-border p-3 text-left">Estimator</th>
                    <th className="border border-border p-3 text-left">Metric</th>
                    <th className="border border-border p-3 text-center">Current</th>
                    <th className="border border-border p-3 text-center">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {redFlags.map((flag, index) => (
                    <tr key={index} className="bg-red-50 hover:bg-red-100">
                      <td className="border border-border p-3">
                        <Badge variant="destructive">⚠️ {flag.type}</Badge>
                      </td>
                      <td className="border border-border p-3 font-medium">{flag.estimator}</td>
                      <td className="border border-border p-3">{flag.metric}</td>
                      <td className="border border-border p-3 text-center font-bold">{flag.current}</td>
                      <td className="border border-border p-3 text-center">{flag.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Optimal Work Assignment Matrix
          </CardTitle>
          <CardDescription>
            Recommended work assignments based on current performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-center">Severity Level</th>
                  <th className="border border-border p-3 text-left">Primary Assignee</th>
                  <th className="border border-border p-3 text-left">Secondary Assignee</th>
                  <th className="border border-border p-3 text-left">Avoid Assigning To</th>
                  <th className="border border-border p-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {assignmentMatrix.map(assignment => (
                  <tr key={assignment.severity} className="hover:bg-accent/50">
                    <td className="border border-border p-3 text-center font-bold text-lg">
                      {assignment.severity}
                    </td>
                    <td className="border border-border p-3 font-medium">{assignment.primary}</td>
                    <td className="border border-border p-3">{assignment.secondary}</td>
                    <td className="border border-border p-3">
                      {assignment.avoid !== '-' ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                          {assignment.avoid}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border border-border p-3 text-sm text-muted-foreground">
                      {assignment.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisTab;