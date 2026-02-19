import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EstimatorProvider, useEstimatorContext } from '@/contexts/EstimatorContext';
import { useCurrentUser } from '@/contexts/UserContext';
import { canViewAllUsers } from '@/lib/auth';
import { useKPIData } from '@/hooks/useKPIData';
import DataEntryTab from './kpi/DataEntryTab';
import EstimatorScorecard from './kpi/EstimatorScorecard';
import TeamDashboard from './kpi/TeamDashboard';
import AnalysisTab from './kpi/AnalysisTab';
import HistoricalData from './kpi/HistoricalData';
import Documentation from './kpi/Documentation';
import LiquidityTab from './kpi/LiquidityTab';
import { Loader2 } from 'lucide-react';

function EstimatorPageContent() {
  const { estimates, profiles, isLoading, error } = useEstimatorContext();
  const user = useCurrentUser();
  const showAll = canViewAllUsers(user.role);
  const kpiData = useKPIData();

  // Build tab list from estimator profiles
  const estimatorTabs = showAll
    ? profiles
    : profiles.filter((p) => p.user_id === user.userId);

  const [activeTab, setActiveTab] = useState('');

  // Default to first estimator tab
  useEffect(() => {
    if (estimatorTabs.length > 0 && !activeTab) {
      setActiveTab(`${estimatorTabs[0].user_id}-entry`);
    }
  }, [estimatorTabs, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">Failed to load data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="max-w-[95vw] mx-auto">
          <h1 className="text-3xl font-bold">Estimator KPI Tracking System</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[95vw] mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="grid w-full bg-card border border-border rounded-xl p-1 mb-6"
            style={{
              gridTemplateColumns: `repeat(${estimatorTabs.length + 5}, minmax(0, 1fr))`,
            }}
          >
            {estimatorTabs.map((profile) => (
              <TabsTrigger
                key={`${profile.user_id}-entry`}
                value={`${profile.user_id}-entry`}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {profile.display_name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="scorecards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Scorecards</TabsTrigger>
            <TabsTrigger value="team-dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Team Dashboard</TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analysis</TabsTrigger>
            <TabsTrigger value="liquidity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Liquidity</TabsTrigger>
            <TabsTrigger value="documentation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Docs</TabsTrigger>
          </TabsList>

          {/* Estimator data entry tabs */}
          {estimatorTabs.map((profile) => (
            <TabsContent key={`${profile.user_id}-entry`} value={`${profile.user_id}-entry`}>
              <DataEntryTab
                estimatorId={profile.user_id}
                estimatorName={profile.display_name}
              />
            </TabsContent>
          ))}

          {/* Legacy tabs using compatibility hook */}
          <TabsContent value="scorecards">
            <EstimatorScorecard kpiData={kpiData} />
          </TabsContent>

          <TabsContent value="team-dashboard">
            <TeamDashboard kpiData={kpiData} onAddEstimator={() => {}} />
          </TabsContent>

          <TabsContent value="analysis">
            <AnalysisTab kpiData={kpiData} />
          </TabsContent>

          <TabsContent value="liquidity">
            <LiquidityTab kpiData={kpiData} onUpdateEntry={() => {}} />
          </TabsContent>

          <TabsContent value="documentation">
            <Documentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Outer wrapper adds the EstimatorProvider
const EstimatorKPITracker: React.FC = () => (
  <EstimatorProvider>
    <EstimatorPageContent />
  </EstimatorProvider>
);

export default EstimatorKPITracker;
