import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, DollarSign, Calendar, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { EstimateEntry, KPIData } from '../../types/kpi';
import { useToast } from '@/hooks/use-toast';

interface LiquidityTabProps {
  kpiData: KPIData;
  onUpdateEntry: (estimatorKey: string, entryId: string, updates: Partial<EstimateEntry>) => void;
}

const LiquidityTab: React.FC<LiquidityTabProps> = ({ kpiData, onUpdateEntry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<{
    entry: EstimateEntry;
    estimatorKey: string;
    estimatorName: string;
  } | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState('');
  const { toast } = useToast();

  // Get all entries from all estimators and historical data
  const allEntries = useMemo(() => {
    const entries: Array<{
      entry: EstimateEntry;
      estimatorKey: string;
      estimatorName: string;
      isHistorical: boolean;
      week?: string;
    }> = [];

    // Current week entries
    Object.entries(kpiData.estimators).forEach(([estimatorKey, estimatorEntries]) => {
      const estimatorName = kpiData.estimatorList.find(name => 
        name.toLowerCase().replace(/\s+/g, '') === estimatorKey
      ) || estimatorKey;
      
      estimatorEntries.forEach(entry => {
        entries.push({
          entry,
          estimatorKey,
          estimatorName,
          isHistorical: false
        });
      });
    });

    // Historical entries
    Object.entries(kpiData.historicalData).forEach(([week, weekData]) => {
      Object.entries(weekData).forEach(([estimatorKey, estimatorEntries]) => {
        const estimatorName = kpiData.estimatorList.find(name => 
          name.toLowerCase().replace(/\s+/g, '') === estimatorKey
        ) || estimatorKey;
        
        estimatorEntries.forEach(entry => {
          entries.push({
            entry,
            estimatorKey,
            estimatorName,
            isHistorical: true,
            week
          });
        });
      });
    });

    return entries;
  }, [kpiData]);

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allEntries.filter(({ entry }) =>
      entry.fileNumber.toLowerCase().includes(query) ||
      entry.clientName.toLowerCase().includes(query)
    );
  }, [allEntries, searchQuery]);

  // Calculate accuracy when both values are available
  const calculateAccuracy = (estimated: number, actual: number) => {
    if (estimated === 0) return 0;
    return ((actual - estimated) / estimated) * 100;
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (Math.abs(accuracy) <= 10) {
      return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Excellent ({accuracy.toFixed(1)}%)</Badge>;
    } else if (Math.abs(accuracy) <= 25) {
      return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Good ({accuracy.toFixed(1)}%)</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Needs Review ({accuracy.toFixed(1)}%)</Badge>;
    }
  };

  const handleSelectEntry = (entryData: typeof filteredEntries[0]) => {
    setSelectedEntry({
      entry: entryData.entry,
      estimatorKey: entryData.estimatorKey,
      estimatorName: entryData.estimatorName
    });
    setSettlementAmount(entryData.entry.actualSettlement?.toString() || '');
    setSettlementDate(entryData.entry.settlementDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveSettlement = () => {
    if (!selectedEntry) return;

    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid settlement amount.",
        variant: "destructive"
      });
      return;
    }

    if (!settlementDate) {
      toast({
        title: "Missing Date",
        description: "Please select a settlement date.",
        variant: "destructive"
      });
      return;
    }

    onUpdateEntry(selectedEntry.estimatorKey, selectedEntry.entry.id, {
      actualSettlement: amount,
      settlementDate,
      isSettled: true
    });

    toast({
      title: "Settlement Updated",
      description: `File ${selectedEntry.entry.fileNumber} settlement data saved successfully.`,
    });

    setSelectedEntry(null);
    setSettlementAmount('');
    setSettlementDate('');
  };

  // Calculate summary statistics
  const settledEntries = allEntries.filter(({ entry }) => entry.isSettled && entry.actualSettlement && entry.estimateValue);
  const averageAccuracy = settledEntries.length > 0 
    ? settledEntries.reduce((sum, { entry }) => 
        sum + calculateAccuracy(entry.estimateValue!, entry.actualSettlement!), 0
      ) / settledEntries.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-card shadow-medium border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign className="h-5 w-5" />
            Liquidity Tracking
          </CardTitle>
          <p className="text-muted-foreground">
            Track actual settlement amounts against estimates to measure long-term accuracy.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search and Entry Selection */}
        <Card className="shadow-soft border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">Find Estimate Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file number or client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredEntries.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredEntries.map(({ entry, estimatorKey, estimatorName, isHistorical, week }) => (
                  <div
                    key={`${entry.id}-${isHistorical ? week : 'current'}`}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleSelectEntry({ entry, estimatorKey, estimatorName, isHistorical, week })}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{entry.fileNumber}</div>
                      <div className="flex gap-2">
                        {entry.isSettled && <Badge variant="secondary">Settled</Badge>}
                        {isHistorical && <Badge variant="outline">Historical</Badge>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>{entry.clientName}</div>
                      <div className="flex justify-between mt-1">
                        <span>Estimator: {estimatorName}</span>
                        <span>Estimate: ${entry.estimateValue?.toLocaleString() || 'N/A'}</span>
                      </div>
                      {entry.isSettled && entry.actualSettlement && (
                        <div className="flex justify-between items-center mt-1">
                          <span>Settled: ${entry.actualSettlement.toLocaleString()}</span>
                          {entry.estimateValue && (
                            <span>{getAccuracyBadge(calculateAccuracy(entry.estimateValue, entry.actualSettlement))}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && filteredEntries.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No entries found matching your search.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Entry Form */}
        <Card className="shadow-soft border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">Enter Settlement Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEntry ? (
              <>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium mb-2">{selectedEntry.entry.fileNumber}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Client: {selectedEntry.entry.clientName}</div>
                    <div>Estimator: {selectedEntry.estimatorName}</div>
                    <div>Original Estimate: ${selectedEntry.entry.estimateValue?.toLocaleString() || 'N/A'}</div>
                    <div>Date: {selectedEntry.entry.date}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="settlement-amount">Actual Settlement Amount</Label>
                    <Input
                      id="settlement-amount"
                      type="number"
                      placeholder="Enter settlement amount"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="settlement-date">Settlement Date</Label>
                    <Input
                      id="settlement-date"
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                    />
                  </div>

                  {settlementAmount && selectedEntry.entry.estimateValue && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-sm font-medium mb-1">Accuracy Preview:</div>
                      {getAccuracyBadge(calculateAccuracy(selectedEntry.entry.estimateValue, parseFloat(settlementAmount)))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSettlement} className="flex-1">
                    Save Settlement
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select an estimate entry to enter settlement data.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="shadow-soft border-white/20">
        <CardHeader>
          <CardTitle className="text-lg">Liquidity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{settledEntries.length}</div>
              <div className="text-sm text-muted-foreground">Settled Cases</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{allEntries.length - settledEntries.length}</div>
              <div className="text-sm text-muted-foreground">Pending Settlement</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                {averageAccuracy > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                {Math.abs(averageAccuracy).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Accuracy</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {settledEntries.length > 0 ? (settledEntries.length / allEntries.length * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Settlement Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidityTab;