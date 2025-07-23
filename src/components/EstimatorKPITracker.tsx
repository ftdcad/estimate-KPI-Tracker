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
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6 shadow-medium">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">
            Estimator KPI Tracking System
          </h1>
          <p className="text-white/90 text-lg mt-2">
            Coastal Claim Services
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Card className="mb-6 bg-gradient-card shadow-medium border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-primary">
              Week of {weekRange.start} - {weekRange.end}, 2025
            </CardTitle>
            <CardDescription className="text-base">
              Performance tracking for the estimating department
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="nell-entry" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-white/70 backdrop-blur-sm shadow-soft border border-white/20 rounded-xl p-1">
            <TabsTrigger value="nell-entry" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Nell - Current Week</TabsTrigger>
            <TabsTrigger value="brandon-entry" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Brandon - Current Week</TabsTrigger>
            <TabsTrigger value="historical" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Historical Data</TabsTrigger>
            <TabsTrigger value="scorecards" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Estimator Scorecards</TabsTrigger>
            <TabsTrigger value="team-dashboard" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Team Dashboard</TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Analysis</TabsTrigger>
            <TabsTrigger value="documentation" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Documentation</TabsTrigger>
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