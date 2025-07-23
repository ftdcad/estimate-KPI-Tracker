import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, Clock, Zap } from 'lucide-react';

const Documentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KPI Tracker System Documentation - v1.2
          </CardTitle>
          <CardDescription>
            Comprehensive documentation for the Coastal Claim Services estimating department KPI tracking system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <strong>System Overview:</strong> Weekly KPI tracking system for Coastal Claim Services estimating department. 
              Tracks performance metrics including time efficiency, revision rates, and financial productivity.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Features (Working)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-left w-48">Feature</th>
                  <th className="border border-border p-3 text-left">Description</th>
                  <th className="border border-border p-3 text-left w-40">Location</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Individual Data Entry</td>
                  <td className="border border-border p-3">Separate weekly entry tabs for each estimator with clean, intuitive interface</td>
                  <td className="border border-border p-3">Nell/Brandon Tabs</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Severity Tracking</td>
                  <td className="border border-border p-3">5-level severity system with time targets (S1: 30min, S2: 1hr, S3: 3hr, S4: 6hr, S5: 12hr)</td>
                  <td className="border border-border p-3">All Tabs</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Individual Scorecards</td>
                  <td className="border border-border p-3">Per-estimator metrics: avg days held, revision count, $/hour, time performance by severity</td>
                  <td className="border border-border p-3">Estimator Scorecards</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Team Dashboard</td>
                  <td className="border border-border p-3">Rankings, comparative performance, severity distribution analysis</td>
                  <td className="border border-border p-3">Team Dashboard</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Performance Analysis</td>
                  <td className="border border-border p-3">Red flag alerts, recommendations, optimal work assignment matrix</td>
                  <td className="border border-border p-3">Analysis Tab</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Historical Viewer</td>
                  <td className="border border-border p-3">View previous weeks' data by estimator and date range</td>
                  <td className="border border-border p-3">Historical Data Tab</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Status Tracking</td>
                  <td className="border border-border p-3">Incomplete, Sent to PA, Unable to start, Pending status options</td>
                  <td className="border border-border p-3">Data Entry Tabs</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Local Data Storage</td>
                  <td className="border border-border p-3">Automatic saving and loading of all data using browser localStorage</td>
                  <td className="border border-border p-3">System-wide</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Planned Features (Future Enhancements)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-left w-48">Feature</th>
                  <th className="border border-border p-3 text-left">Description</th>
                  <th className="border border-border p-3 text-center w-24">Priority</th>
                  <th className="border border-border p-3 text-center w-24">Complexity</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Executive Dashboard</td>
                  <td className="border border-border p-3">Salary data, cost per estimate, ROI metrics, true profit margins</td>
                  <td className="border border-border p-3 text-center">
                    <Badge className="bg-green-100 text-green-800 border-green-300">High</Badge>
                  </td>
                  <td className="border border-border p-3 text-center">Medium</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Auto Week Rollover</td>
                  <td className="border border-border p-3">Automatically archive current week and start new week on Mondays</td>
                  <td className="border border-border p-3 text-center">
                    <Badge className="bg-green-100 text-green-800 border-green-300">High</Badge>
                  </td>
                  <td className="border border-border p-3 text-center">Low</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Historical Trending</td>
                  <td className="border border-border p-3">Week-over-week and month-over-month performance graphs</td>
                  <td className="border border-border p-3 text-center">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium</Badge>
                  </td>
                  <td className="border border-border p-3 text-center">Medium</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Auto-Assignment</td>
                  <td className="border border-border p-3">Suggest optimal estimator based on severity and current performance</td>
                  <td className="border border-border p-3 text-center">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium</Badge>
                  </td>
                  <td className="border border-border p-3 text-center">High</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Xactimate Integration</td>
                  <td className="border border-border p-3">Import estimate data directly from Xactimate exports</td>
                  <td className="border border-border p-3 text-center">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium</Badge>
                  </td>
                  <td className="border border-border p-3 text-center">High</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Email Notifications</td>
                  <td className="border border-border p-3">Alert managers when KPIs fall below thresholds</td>
                  <td className="border border-border p-3 text-center">Low</td>
                  <td className="border border-border p-3 text-center">Medium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics Tracked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-left w-48">Metric</th>
                  <th className="border border-border p-3 text-left">Formula</th>
                  <th className="border border-border p-3 text-center w-32">Target</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Days Held</td>
                  <td className="border border-border p-3">Date Submitted - Date Assigned</td>
                  <td className="border border-border p-3 text-center">&lt; 3 days avg</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Revision Rate</td>
                  <td className="border border-border p-3">Total Revisions ÷ Total Estimates</td>
                  <td className="border border-border p-3 text-center">&lt; 1.5 avg</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Dollar/Hour</td>
                  <td className="border border-border p-3">Total Estimate Value ÷ Total Hours Worked</td>
                  <td className="border border-border p-3 text-center">&gt; $12,000</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">Rework Ratio</td>
                  <td className="border border-border p-3">Revision Hours ÷ Initial Hours</td>
                  <td className="border border-border p-3 text-center">&lt; 20%</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 font-medium">First-Time Approval</td>
                  <td className="border border-border p-3">(Estimates with 0 Revisions ÷ Total Estimates) × 100</td>
                  <td className="border border-border p-3 text-center">&gt; 70%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-center w-24">Version</th>
                  <th className="border border-border p-3 text-center w-32">Date</th>
                  <th className="border border-border p-3 text-left">Changes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 text-center font-bold">v1.0</td>
                  <td className="border border-border p-3 text-center">Jan 2025</td>
                  <td className="border border-border p-3">Initial release with core KPI tracking, scorecards, and analysis</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 text-center font-bold">v1.1</td>
                  <td className="border border-border p-3 text-center">Jan 2025</td>
                  <td className="border border-border p-3">Added weekly data management, documentation tab, improved UI</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="border border-border p-3 text-center font-bold">v1.2</td>
                  <td className="border border-border p-3 text-center">Jan 2025</td>
                  <td className="border border-border p-3">React implementation with real-time calculations, local storage, responsive design</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Technology Stack</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">React 18</Badge>
                  <span>Frontend framework with hooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">TypeScript</Badge>
                  <span>Type safety and better development experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <span>Utility-first styling with design system</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">shadcn/ui</Badge>
                  <span>Accessible component library</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Data Management</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Local Storage</Badge>
                  <span>Browser-based data persistence</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">React State</Badge>
                  <span>Real-time UI updates and calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">JSON</Badge>
                  <span>Structured data format for easy export</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <strong>For Support:</strong> Contact Will Pratt, Claim Director<br />
              <strong>Department:</strong> Estimating - Coastal Claim Services<br />
              <strong>Purpose:</strong> Track and optimize estimator performance to improve efficiency and claim outcomes<br />
              <strong>System Capacity:</strong> Handles 40-70 estimates per estimator per week efficiently
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documentation;