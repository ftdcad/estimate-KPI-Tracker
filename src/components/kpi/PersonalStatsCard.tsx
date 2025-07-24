import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, DollarSign, Clock, Target, CheckCircle, BarChart3 } from 'lucide-react';
import { EstimateEntry } from '../../types/kpi';
import { calculateWeeklyMetrics } from '../../utils/kpiCalculations';

interface PersonalStatsCardProps {
  data: EstimateEntry[];
  estimatorName: string;
}

type MetricType = 'dollarsPerHour' | 'dollarsPerMinute' | 'totalWeeklyValue' | 'firstTimeApproval' | 'avgSeverity' | 'estimatesCompleted';

interface MetricConfig {
  id: MetricType;
  label: string;
  icon: React.ReactNode;
  formatter: (value: number) => string;
  color: string;
}

const metricConfigs: MetricConfig[] = [
  {
    id: 'dollarsPerHour',
    label: 'Dollars Per Hour',
    icon: <DollarSign className="w-5 h-5" />,
    formatter: (value) => `${value.toLocaleString()}/hr`,
    color: 'text-green-600'
  },
  {
    id: 'dollarsPerMinute',
    label: 'Dollars Per Minute',
    icon: <Clock className="w-5 h-5" />,
    formatter: (value) => `${value.toLocaleString()}/min`,
    color: 'text-blue-600'
  },
  {
    id: 'totalWeeklyValue',
    label: 'Total Weekly Value',
    icon: <TrendingUp className="w-5 h-5" />,
    formatter: (value) => `$${value.toLocaleString()}`,
    color: 'text-purple-600'
  },
  {
    id: 'firstTimeApproval',
    label: 'First-Time Approval Rate',
    icon: <CheckCircle className="w-5 h-5" />,
    formatter: (value) => `${value.toFixed(0)}%`,
    color: 'text-emerald-600'
  },
  {
    id: 'avgSeverity',
    label: 'Average Claim Severity',
    icon: <BarChart3 className="w-5 h-5" />,
    formatter: (value) => `Level ${value.toFixed(1)}`,
    color: 'text-orange-600'
  },
  {
    id: 'estimatesCompleted',
    label: 'Estimates Completed',
    icon: <Target className="w-5 h-5" />,
    formatter: (value) => `${value} estimates`,
    color: 'text-indigo-600'
  }
];

export const PersonalStatsCard: React.FC<PersonalStatsCardProps> = ({ data, estimatorName }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('dollarsPerHour');
  
  const metrics = calculateWeeklyMetrics(data);
  
  const calculateMetricValue = (metricType: MetricType): number => {
    switch (metricType) {
      case 'dollarsPerHour':
        return metrics.dollarPerHour;
      case 'dollarsPerMinute':
        return metrics.dollarPerHour / 60;
      case 'totalWeeklyValue':
        return data.reduce((sum, entry) => sum + (entry.estimateValue || 0), 0);
      case 'firstTimeApproval':
        return metrics.firstTimeApprovalRate;
      case 'avgSeverity':
        const validSeverities = data.filter(entry => entry.severity !== null);
        const totalSeverity = validSeverities.reduce((sum, entry) => sum + (entry.severity || 0), 0);
        return validSeverities.length > 0 ? totalSeverity / validSeverities.length : 0;
      case 'estimatesCompleted':
        return metrics.totalEstimates;
      default:
        return 0;
    }
  };

  const currentConfig = metricConfigs.find(config => config.id === selectedMetric)!;
  const currentValue = calculateMetricValue(selectedMetric);

  return (
    <Card className="mb-6 bg-gradient-to-r from-background to-muted/20 border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {estimatorName}'s Performance
          </h3>
          <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metricConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-muted/50 ${currentConfig.color}`}>
            {currentConfig.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{currentConfig.label}</p>
            <p className={`text-3xl font-bold transition-all duration-300 ${currentConfig.color}`}>
              {currentConfig.formatter(currentValue)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};