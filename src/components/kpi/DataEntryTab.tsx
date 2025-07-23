import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { EstimateEntry } from '../../types/kpi';
import { toast } from '@/hooks/use-toast';

interface DataEntryTabProps {
  estimator: string;
  estimatorName: string;
  data: EstimateEntry[];
  onDataUpdate: (data: EstimateEntry[]) => void;
  weekRange: string;
}

const DataEntryTab: React.FC<DataEntryTabProps> = ({
  estimator,
  estimatorName,
  data,
  onDataUpdate,
  weekRange
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Initialize with one empty row if no data
  if (data.length === 0) {
    onDataUpdate([createEmptyEntry()]);
  }

  function createEmptyEntry(): EstimateEntry {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      fileNumber: '',
      clientName: '',
      severity: null,
      timeHours: null,
      revisionTimeHours: null,
      estimateValue: null,
      revisions: null,
      status: null,
      notes: ''
    };
  }

  const addRow = () => {
    const newData = [...data, createEmptyEntry()];
    onDataUpdate(newData);
  };

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one row to delete.",
        variant: "destructive"
      });
      return;
    }

    if (selectedRows.size === data.length) {
      toast({
        title: "Cannot delete all rows",
        description: "You must keep at least one row in the table.",
        variant: "destructive"
      });
      return;
    }

    const newData = data.filter(entry => !selectedRows.has(entry.id));
    onDataUpdate(newData);
    setSelectedRows(new Set());
    
    toast({
      title: "Rows deleted",
      description: `${selectedRows.size} row(s) have been deleted.`
    });
  };

  const updateEntry = (index: number, field: keyof EstimateEntry, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onDataUpdate(newData);
  };

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const calculateMetrics = () => {
    toast({
      title: "Metrics calculated",
      description: "Weekly metrics have been calculated! View results in the Estimator Scorecards and Team Dashboard tabs."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{estimatorName} - Current Week</span>
          <span className="text-sm font-normal text-muted-foreground">
            Entries: {data.length}
          </span>
        </CardTitle>
        <CardDescription>
          Week of {weekRange}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border border-border p-2 w-10">✓</th>
                <th className="border border-border p-2 w-24">Date</th>
                <th className="border border-border p-2 w-32">File Number</th>
                <th className="border border-border p-2 w-40">Client Name</th>
                <th className="border border-border p-2 w-20">Severity</th>
                <th className="border border-border p-2 w-24">Time (hrs)</th>
                <th className="border border-border p-2 w-24">Rev Time</th>
                <th className="border border-border p-2 w-28">Est. Value</th>
                <th className="border border-border p-2 w-20">Revisions</th>
                <th className="border border-border p-2 w-28">Status</th>
                <th className="border border-border p-2 w-36">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-accent/50">
                  <td className="border border-border p-2 text-center">
                    <Checkbox
                      checked={selectedRows.has(entry.id)}
                      onCheckedChange={() => toggleRowSelection(entry.id)}
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(index, 'date', e.target.value)}
                      className="border-0 h-8"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.fileNumber}
                      onChange={(e) => updateEntry(index, 'fileNumber', e.target.value)}
                      className="border-0 h-8"
                      placeholder="File #"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.clientName}
                      onChange={(e) => updateEntry(index, 'clientName', e.target.value)}
                      className="border-0 h-8"
                      placeholder="Client name"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Select
                      value={entry.severity?.toString() || ''}
                      onValueChange={(value) => updateEntry(index, 'severity', value ? parseInt(value) : null)}
                    >
                      <SelectTrigger className="border-0 h-8">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.timeHours ?? ''}
                      onChange={(e) => updateEntry(index, 'timeHours', e.target.value ? parseFloat(e.target.value) : null)}
                      className="border-0 h-8 text-right"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.revisionTimeHours ?? ''}
                      onChange={(e) => updateEntry(index, 'revisionTimeHours', e.target.value ? parseFloat(e.target.value) : null)}
                      className="border-0 h-8 text-right"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="number"
                      value={entry.estimateValue ?? ''}
                      onChange={(e) => updateEntry(index, 'estimateValue', e.target.value ? parseFloat(e.target.value) : null)}
                      className="border-0 h-8 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="number"
                      value={entry.revisions ?? ''}
                      onChange={(e) => updateEntry(index, 'revisions', e.target.value ? parseInt(e.target.value) : null)}
                      className="border-0 h-8 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Select
                      value={entry.status || ''}
                      onValueChange={(value) => updateEntry(index, 'status', value || null)}
                    >
                      <SelectTrigger className="border-0 h-8">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        <SelectItem value="sent">Sent to the PA</SelectItem>
                        <SelectItem value="unable-to-start">Unable to start</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.notes}
                      onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                      className="border-0 h-8"
                      placeholder="Notes"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={addRow} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button 
            onClick={deleteSelectedRows} 
            variant="outline" 
            size="sm"
            disabled={selectedRows.size === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <Button onClick={calculateMetrics} size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate This Week
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataEntryTab;