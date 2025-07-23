import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataEntryTab from './kpi/DataEntryTab';
import EstimatorScorecard from './kpi/EstimatorScorecard';
import TeamDashboard from './kpi/TeamDashboard';
import AnalysisTab from './kpi/AnalysisTab';
import HistoricalData from './kpi/HistoricalData';
import Documentation from './kpi/Documentation';
import { EstimateEntry, KPIData } from '../types/kpi';

const EstimatorKPITracker: React.FC = () => {
  const [kpiData, setKPIData] = useState<KPIData>({
    estimators: {
      nell: [],
      brandon: []
    },
    historicalData: {},
    currentWeek: '2025-01-20'
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('kpi-tracker-data');
    if (savedData) {
      try {
        setKPIData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kpi-tracker-data', JSON.stringify(kpiData));
  }, [kpiData]);

  const updateEstimatorData = (estimator: string, data: EstimateEntry[]) => {
    setKPIData(prev => ({
      ...prev,
      estimators: {
        ...prev.estimators,
        [estimator]: data
      }
    }));
  };

  const getCurrentWeekDateRange = () => {
    const startDate = new Date(kpiData.currentWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
  };

  const weekRange = getCurrentWeekDateRange();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-semibold">
          Estimator KPI Tracking System - Coastal Claim Services
        </h1>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Week of {weekRange.start} - {weekRange.end}, 2025
            </CardTitle>
            <CardDescription>
              Performance tracking for the estimating department
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="nell-entry" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="nell-entry">Nell - Current Week</TabsTrigger>
            <TabsTrigger value="brandon-entry">Brandon - Current Week</TabsTrigger>
            <TabsTrigger value="historical">Historical Data</TabsTrigger>
            <TabsTrigger value="scorecards">Estimator Scorecards</TabsTrigger>
            <TabsTrigger value="team-dashboard">Team Dashboard</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="nell-entry">
            <DataEntryTab
              estimator="nell"
              estimatorName="Nell"
              data={kpiData.estimators.nell}
              onDataUpdate={(data) => updateEstimatorData('nell', data)}
              weekRange={`${weekRange.start} - ${weekRange.end}`}
            />
          </TabsContent>

          <TabsContent value="brandon-entry">
            <DataEntryTab
              estimator="brandon"
              estimatorName="Brandon"
              data={kpiData.estimators.brandon}
              onDataUpdate={(data) => updateEstimatorData('brandon', data)}
              weekRange={`${weekRange.start} - ${weekRange.end}`}
            />
          </TabsContent>

          <TabsContent value="historical">
            <HistoricalData kpiData={kpiData} />
          </TabsContent>

          <TabsContent value="scorecards">
            <EstimatorScorecard kpiData={kpiData} />
          </TabsContent>

          <TabsContent value="team-dashboard">
            <TeamDashboard kpiData={kpiData} />
          </TabsContent>

          <TabsContent value="analysis">
            <AnalysisTab kpiData={kpiData} />
          </TabsContent>

          <TabsContent value="documentation">
            <Documentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EstimatorKPITracker;