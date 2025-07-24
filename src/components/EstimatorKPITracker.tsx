import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataEntryTab from './kpi/DataEntryTab';
import EstimatorScorecard from './kpi/EstimatorScorecard';
import TeamDashboard from './kpi/TeamDashboard';
import AnalysisTab from './kpi/AnalysisTab';
import HistoricalData from './kpi/HistoricalData';
import Documentation from './kpi/Documentation';
import LiquidityTab from './kpi/LiquidityTab';
import ManageEstimatorDialog from './kpi/ManageEstimatorDialog';

import { EstimateEntry, KPIData } from '../types/kpi';

const EstimatorKPITracker: React.FC = () => {
  const [kpiData, setKPIData] = useState<KPIData>({
    estimators: {
      nell: [],
      brandon: []
    },
    estimatorList: ['Nell', 'Brandon'], // Default estimators
    historicalData: {},
    currentWeek: '2025-01-20'
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('kpi-tracker-data');
    if (savedData) {
      try {
        const loadedData = JSON.parse(savedData);
        // Migration: Add estimatorList if it doesn't exist
        if (!loadedData.estimatorList) {
          loadedData.estimatorList = Object.keys(loadedData.estimators).map(key => 
            key.charAt(0).toUpperCase() + key.slice(1)
          );
        }
        
        // Clean up duplicates: Remove lowercase duplicates from estimatorList
        const cleanEstimatorList = [];
        const seenNames = new Set();
        
        loadedData.estimatorList.forEach((name: string) => {
          const normalizedName = name.toLowerCase();
          if (!seenNames.has(normalizedName)) {
            seenNames.add(normalizedName);
            // Keep the properly capitalized version
            cleanEstimatorList.push(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
          }
        });
        
        // Clean up estimators object: Remove lowercase duplicates
        const cleanEstimators: any = {};
        cleanEstimatorList.forEach((name: string) => {
          const key = name.toLowerCase().replace(/\s+/g, '');
          // Keep data from either the properly cased or lowercase version
          cleanEstimators[key] = loadedData.estimators[key] || loadedData.estimators[name.toLowerCase()] || [];
        });
        
        // Clean up historical data
        const cleanHistoricalData: any = {};
        Object.keys(loadedData.historicalData || {}).forEach(week => {
          cleanHistoricalData[week] = {};
          cleanEstimatorList.forEach((name: string) => {
            const key = name.toLowerCase().replace(/\s+/g, '');
            const weekData = loadedData.historicalData[week];
            cleanHistoricalData[week][key] = weekData[key] || weekData[name.toLowerCase()] || [];
          });
        });
        
        setKPIData({
          ...loadedData,
          estimatorList: cleanEstimatorList,
          estimators: cleanEstimators,
          historicalData: cleanHistoricalData
        });
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
    const estimatorKey = getEstimatorKey(estimator);
    
    setKPIData(prev => {
      // Add estimator to list if it doesn't exist
      const updatedEstimatorList = prev.estimatorList.includes(estimator) 
        ? prev.estimatorList 
        : [...prev.estimatorList, estimator];
      
      return {
        ...prev,
        estimators: {
          ...prev.estimators,
          [estimatorKey]: data
        },
        estimatorList: updatedEstimatorList
      };
    });
  };

  const addEstimator = (estimatorName: string) => {
    const estimatorKey = estimatorName.toLowerCase().replace(/\s+/g, '');
    setKPIData(prev => ({
      ...prev,
      estimators: {
        ...prev.estimators,
        [estimatorKey]: []
      },
      estimatorList: [...prev.estimatorList, estimatorName]
    }));
  };

  const editEstimator = (oldName: string, newName: string) => {
    const oldKey = oldName.toLowerCase().replace(/\s+/g, '');
    const newKey = newName.toLowerCase().replace(/\s+/g, '');
    
    setKPIData(prev => {
      const newEstimators = { ...prev.estimators };
      const newHistoricalData = { ...prev.historicalData };
      
      // Move data from old key to new key
      if (newEstimators[oldKey]) {
        newEstimators[newKey] = newEstimators[oldKey];
        delete newEstimators[oldKey];
      }
      
      // Update historical data keys
      Object.keys(newHistoricalData).forEach(week => {
        if (newHistoricalData[week][oldKey]) {
          newHistoricalData[week][newKey] = newHistoricalData[week][oldKey];
          delete newHistoricalData[week][oldKey];
        }
      });
      
      // Update estimator list
      const newEstimatorList = prev.estimatorList.map(name => 
        name === oldName ? newName : name
      );
      
      return {
        ...prev,
        estimators: newEstimators,
        historicalData: newHistoricalData,
        estimatorList: newEstimatorList
      };
    });
  };

  const removeEstimator = (estimatorName: string) => {
    const estimatorKey = estimatorName.toLowerCase().replace(/\s+/g, '');
    
    setKPIData(prev => {
      const newEstimators = { ...prev.estimators };
      const newHistoricalData = { ...prev.historicalData };
      
      // Remove estimator data
      delete newEstimators[estimatorKey];
      
      // Remove from historical data
      Object.keys(newHistoricalData).forEach(week => {
        if (newHistoricalData[week][estimatorKey]) {
          delete newHistoricalData[week][estimatorKey];
        }
      });
      
      // Remove from estimator list
      const newEstimatorList = prev.estimatorList.filter(name => name !== estimatorName);
      
      return {
        ...prev,
        estimators: newEstimators,
        historicalData: newHistoricalData,
        estimatorList: newEstimatorList
      };
    });
  };

  const clearEstimatorData = (estimatorName: string) => {
    const estimatorKey = estimatorName.toLowerCase().replace(/\s+/g, '');
    
    setKPIData(prev => {
      const newEstimators = { ...prev.estimators };
      const newHistoricalData = { ...prev.historicalData };
      
      // Clear current week data but keep the estimator key
      newEstimators[estimatorKey] = [];
      
      // Clear historical data for this estimator
      Object.keys(newHistoricalData).forEach(week => {
        if (newHistoricalData[week][estimatorKey]) {
          newHistoricalData[week][estimatorKey] = [];
        }
      });
      
      return {
        ...prev,
        estimators: newEstimators,
        historicalData: newHistoricalData
      };
    });
  };

  const getEstimatorKey = (estimatorName: string) => {
    return estimatorName.toLowerCase().replace(/\s+/g, '');
  };

  const updateEstimateEntry = (estimatorKey: string, entryId: string, updates: Partial<EstimateEntry>) => {
    setKPIData(prev => {
      const newData = { ...prev };
      
      // Update current week data
      if (newData.estimators[estimatorKey]) {
        newData.estimators[estimatorKey] = newData.estimators[estimatorKey].map(entry =>
          entry.id === entryId ? { ...entry, ...updates } : entry
        );
      }
      
      // Update historical data
      Object.keys(newData.historicalData).forEach(week => {
        if (newData.historicalData[week][estimatorKey]) {
          newData.historicalData[week][estimatorKey] = newData.historicalData[week][estimatorKey].map(entry =>
            entry.id === entryId ? { ...entry, ...updates } : entry
          );
        }
      });
      
      return newData;
    });
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
        <Tabs defaultValue={`${getEstimatorKey(kpiData.estimatorList[0] || 'nell')}-entry`} className="w-full">
          <TabsList className={`grid w-full bg-white/70 backdrop-blur-sm shadow-soft border border-white/20 rounded-xl p-1 mb-6`} 
                    style={{ gridTemplateColumns: `repeat(${kpiData.estimatorList.length + 6}, minmax(0, 1fr))` }}>
            {kpiData.estimatorList.map((estimatorName) => (
              <TabsTrigger 
                key={`${getEstimatorKey(estimatorName)}-entry`}
                value={`${getEstimatorKey(estimatorName)}-entry`} 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft"
              >
                {estimatorName}
              </TabsTrigger>
            ))}
            <TabsTrigger value="historical" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Historical Data</TabsTrigger>
            <TabsTrigger value="scorecards" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Estimator Scorecards</TabsTrigger>
            <TabsTrigger value="team-dashboard" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Team Dashboard</TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Analysis</TabsTrigger>
            <TabsTrigger value="liquidity" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Liquidity</TabsTrigger>
            <TabsTrigger value="documentation" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-soft">Documentation</TabsTrigger>
          </TabsList>

          <Card className="mb-6 bg-gradient-card shadow-medium border-0">
            <CardHeader className="pb-3 flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-xl text-primary">
                  Week of {weekRange.start} - {weekRange.end}
                </CardTitle>
                <CardDescription className="text-base">
                  Performance tracking for the estimating department
                </CardDescription>
              </div>
              <ManageEstimatorDialog
                existingEstimators={kpiData.estimatorList}
                onAddEstimator={addEstimator}
                onEditEstimator={editEstimator}
                onRemoveEstimator={removeEstimator}
                onClearEstimatorData={clearEstimatorData}
              />
            </CardHeader>
          </Card>

          {kpiData.estimatorList.map((estimatorName) => {
            const estimatorKey = getEstimatorKey(estimatorName);
            return (
              <TabsContent key={`${estimatorKey}-entry`} value={`${estimatorKey}-entry`}>
                <DataEntryTab
                  estimator={estimatorKey}
                  estimatorName={estimatorName}
                  data={kpiData.estimators[estimatorKey] || []}
                  onDataUpdate={(data) => updateEstimatorData(estimatorName, data)}
                  weekRange={`${weekRange.start} - ${weekRange.end}`}
                />
              </TabsContent>
            );
          })}

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

          <TabsContent value="liquidity">
            <LiquidityTab kpiData={kpiData} onUpdateEntry={updateEstimateEntry} />
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