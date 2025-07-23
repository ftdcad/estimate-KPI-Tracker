import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { KPIData, EstimateEntry } from '../../types/kpi';

interface HistoricalDataProps {
  kpiData: KPIData;
}

const HistoricalData: React.FC<HistoricalDataProps> = ({ kpiData }) => {
  const getEstimatorKey = (estimatorName: string) => {
    return estimatorName.toLowerCase().replace(/\s+/g, '');
  };

  const firstEstimatorKey = kpiData.estimatorList.length > 0 ? getEstimatorKey(kpiData.estimatorList[0]) : 'nell';
  const [selectedEstimator, setSelectedEstimator] = useState(firstEstimatorKey);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [loadedData, setLoadedData] = useState<EstimateEntry[] | null>(null);

  const availableWeeks = [
    { value: '2025-01-13', label: 'January 13-19, 2025' },
    { value: '2025-01-06', label: 'January 6-12, 2025' },
    { value: '2024-12-30', label: 'December 30-31, 2024' },
    { value: '2024-12-23', label: 'December 23-29, 2024' },
    { value: '2024-12-16', label: 'December 16-22, 2024' },
    { value: '2024-12-09', label: 'December 9-15, 2024' }
  ];

  const loadHistoricalData = () => {
    if (!selectedWeek) return;

    // In a real implementation, this would load from the historical data
    // For demo purposes, we'll create sample data
    const sampleData: EstimateEntry[] = [
      {
        id: 'hist_1',
        date: selectedWeek,
        fileNumber: 'FL-2024100123',
        clientName: 'Sample Client Corp',
        peril: 'Wind',
        severity: 2,
        timeHours: 1.5,
        revisionTimeHours: 0.5,
        estimateValue: 12000,
        revisions: 1,
        status: 'sent',
        notes: 'Completed on time',
        actualSettlement: null,
        settlementDate: null,
        isSettled: false
      },
      {
        id: 'hist_2',
        date: selectedWeek,
        fileNumber: 'FL-2024100124',
        clientName: 'Another Client LLC',
        peril: 'Hail',
        severity: 3,
        timeHours: 2.8,
        revisionTimeHours: 0,
        estimateValue: 35000,
        revisions: 0,
        status: 'sent',
        notes: 'First time approval',
        actualSettlement: null,
        settlementDate: null,
        isSettled: false
      },
      {
        id: 'hist_3',
        date: selectedWeek,
        fileNumber: 'FL-2024100125',
        clientName: 'Third Client Inc',
        peril: 'Hurricane',
        severity: 1,
        timeHours: 0.5,
        revisionTimeHours: 0,
        estimateValue: 4500,
        revisions: 0,
        status: 'sent',
        notes: 'Quick turnaround',
        actualSettlement: null,
        settlementDate: null,
        isSettled: false
      }
    ];

    setLoadedData(sampleData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 border-green-300">SENT</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">PENDING</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800 border-red-300">INCOMPLETE</Badge>;
      default:
        return <Badge variant="outline">{status?.toUpperCase() || 'UNKNOWN'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historical Data Viewer</CardTitle>
          <CardDescription>
            View historical weekly data by selecting an estimator and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              View historical weekly data by selecting an estimator and date range below. 
              This data is read-only and used for trend analysis and performance review.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Estimator:</label>
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
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Week:</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a week" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map(week => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={loadHistoricalData}
              disabled={!selectedWeek}
            >
              Load Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadedData ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Historical Data - {kpiData.estimatorList.find(name => getEstimatorKey(name) === selectedEstimator) || selectedEstimator.charAt(0).toUpperCase() + selectedEstimator.slice(1)} - 
              Week of {availableWeeks.find(w => w.value === selectedWeek)?.label}
            </CardTitle>
            <CardDescription>
              Showing {loadedData.length} entries for the selected week. This data is read-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="border border-border p-3 text-left">Date</th>
                    <th className="border border-border p-3 text-left">File Number</th>
                    <th className="border border-border p-3 text-left">Client Name</th>
                    <th className="border border-border p-3 text-center">Severity</th>
                    <th className="border border-border p-3 text-center">Time (hrs)</th>
                    <th className="border border-border p-3 text-center">Rev Time</th>
                    <th className="border border-border p-3 text-center">Est. Value</th>
                    <th className="border border-border p-3 text-center">Revisions</th>
                    <th className="border border-border p-3 text-center">Status</th>
                    <th className="border border-border p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loadedData.map((entry) => (
                    <tr key={entry.id} className="hover:bg-accent/50">
                      <td className="border border-border p-3">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="border border-border p-3">{entry.fileNumber}</td>
                      <td className="border border-border p-3">{entry.clientName}</td>
                      <td className="border border-border p-3 text-center font-bold">
                        {entry.severity}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {entry.timeHours?.toFixed(1) || '-'}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {entry.revisionTimeHours?.toFixed(1) || '-'}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {entry.estimateValue ? `$${entry.estimateValue.toLocaleString()}` : '-'}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {entry.revisions ?? '-'}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {entry.status ? getStatusBadge(entry.status) : '-'}
                      </td>
                      <td className="border border-border p-3">{entry.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Week Summary:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Estimates:</span>
                  <span className="ml-2 font-medium">{loadedData.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="ml-2 font-medium">
                    {loadedData.reduce((sum, entry) => 
                      sum + (entry.timeHours || 0) + (entry.revisionTimeHours || 0), 0
                    ).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="ml-2 font-medium">
                    ${loadedData.reduce((sum, entry) => sum + (entry.estimateValue || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Revisions:</span>
                  <span className="ml-2 font-medium">
                    {(loadedData.reduce((sum, entry) => sum + (entry.revisions || 0), 0) / loadedData.length).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Select a week to view historical data</p>
              <p className="text-sm mt-2">Choose an estimator and week from the dropdowns above</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoricalData;