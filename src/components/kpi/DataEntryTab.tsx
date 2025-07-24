import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Save, Calculator } from 'lucide-react';
import { EstimateEntry, PERIL_OPTIONS } from '../../types/kpi';
import { toast } from '@/hooks/use-toast';
import { PersonalStatsCard } from './PersonalStatsCard';
import { cn } from '@/lib/utils';

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
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

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
      peril: null,
      severity: null,
      timeHours: null,
      revisionTimeHours: null,
      estimateValue: null,
      revisions: null,
      status: null,
      notes: '',
      actualSettlement: null,
      settlementDate: null,
      isSettled: false
    };
  }

  const validateEntry = (entry: EstimateEntry): string[] => {
    const errors: string[] = [];
    
    if (!entry.date) errors.push('Date');
    if (!entry.fileNumber.trim()) errors.push('File Number');
    if (!entry.clientName.trim()) errors.push('Client Name');
    if (!entry.peril) errors.push('Peril');
    if (!entry.severity) errors.push('Severity');
    if (!entry.timeHours || entry.timeHours <= 0) errors.push('Time Hours');
    if (!entry.estimateValue || entry.estimateValue <= 0) errors.push('Estimated Value');
    if (!entry.status) errors.push('Status');
    
    return errors;
  };

  const hasIncompleteRows = (): boolean => {
    return data.some(entry => validateEntry(entry).length > 0);
  };

  const saveEntry = () => {
    // Check if there are any incomplete rows
    const incompleteRows = data.map((entry, index) => ({ 
      entry, 
      index, 
      errors: validateEntry(entry) 
    })).filter(row => row.errors.length > 0);

    if (incompleteRows.length > 0) {
      const errorMessages = incompleteRows.map(row => 
        `Row ${row.index + 1}: Missing ${row.errors.join(', ')}`
      ).join('\n');
      
      toast({
        title: "Cannot add new entry",
        description: `Please complete all required fields:\n${errorMessages}`,
        variant: "destructive"
      });
      
      // Update validation errors for visual feedback
      const errorIds = incompleteRows.map(row => row.entry.id);
      setValidationErrors(new Set(errorIds));
      return;
    }

    // Clear validation errors
    setValidationErrors(new Set());
    
    // Add new row only if all existing rows are complete
    const newData = [...data, createEmptyEntry()];
    onDataUpdate(newData);
    
    toast({
      title: "Entry saved",
      description: "New row added. You can now enter the next estimate."
    });
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
    
    // Clear validation error for this entry if it becomes valid
    const entryId = newData[index].id;
    if (validationErrors.has(entryId)) {
      const errors = validateEntry(newData[index]);
      if (errors.length === 0) {
        const newErrors = new Set(validationErrors);
        newErrors.delete(entryId);
        setValidationErrors(newErrors);
      }
    }
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
    <>
      <PersonalStatsCard data={data} estimatorName={estimatorName} />
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
          <div className="mb-4">
            <p className="text-sm text-muted-foreground flex items-center">
              <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
              Required fields
            </p>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border border-border p-2 w-10">✓</th>
                <th className="border border-border p-2 w-24">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Date
                </th>
                <th className="border border-border p-2 w-32">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  File Number
                </th>
                <th className="border border-border p-2 w-40">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Client Name
                </th>
                <th className="border border-border p-2 w-28">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Peril
                </th>
                <th className="border border-border p-2 w-20">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Severity
                </th>
                <th className="border border-border p-2 w-24">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Time (hrs)
                </th>
                <th className="border border-border p-2 w-24">Rev Time</th>
                <th className="border border-border p-2 w-28">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Est. Value
                </th>
                <th className="border border-border p-2 w-20">Revisions</th>
                <th className="border border-border p-2 w-28">
                  <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                  Status
                </th>
                <th className="border border-border p-2 w-36">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, index) => {
                const hasErrors = validationErrors.has(entry.id);
                const errors = validateEntry(entry);
                return (
                <tr key={entry.id} className={cn("hover:bg-accent/50", hasErrors && "bg-red-50 dark:bg-red-950/20")}>
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
                      className={cn("border-0 h-8", !entry.date && hasErrors && "ring-2 ring-red-500")}
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.fileNumber}
                      onChange={(e) => updateEntry(index, 'fileNumber', e.target.value)}
                      className={cn("border-0 h-8", !entry.fileNumber.trim() && hasErrors && "ring-2 ring-red-500")}
                      placeholder="File #"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.clientName}
                      onChange={(e) => updateEntry(index, 'clientName', e.target.value)}
                      className={cn("border-0 h-8", !entry.clientName.trim() && hasErrors && "ring-2 ring-red-500")}
                      placeholder="Client name"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Select
                      value={entry.peril || ''}
                      onValueChange={(value) => updateEntry(index, 'peril', value || null)}
                    >
                      <SelectTrigger className={cn("border-0 h-8", !entry.peril && hasErrors && "ring-2 ring-red-500")}>
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIL_OPTIONS.map((peril) => (
                          <SelectItem key={peril} value={peril}>
                            {peril}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-border p-1">
                    <Select
                      value={entry.severity?.toString() || ''}
                      onValueChange={(value) => updateEntry(index, 'severity', value ? parseInt(value) : null)}
                    >
                      <SelectTrigger className={cn("border-0 h-8", !entry.severity && hasErrors && "ring-2 ring-red-500")}>
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
                      type="text"
                      value={entry.timeHours ?? ''}
                      onChange={(e) => updateEntry(index, 'timeHours', e.target.value ? parseFloat(e.target.value) : null)}
                      className={cn("border-0 h-8 text-right", (!entry.timeHours || entry.timeHours <= 0) && hasErrors && "ring-2 ring-red-500")}
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="text"
                      value={entry.revisionTimeHours ?? ''}
                      onChange={(e) => updateEntry(index, 'revisionTimeHours', e.target.value ? parseFloat(e.target.value) : null)}
                      className="border-0 h-8 text-right"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="text"
                      value={entry.estimateValue ?? ''}
                      onChange={(e) => updateEntry(index, 'estimateValue', e.target.value ? parseFloat(e.target.value) : null)}
                      className={cn("border-0 h-8 text-right", (!entry.estimateValue || entry.estimateValue <= 0) && hasErrors && "ring-2 ring-red-500")}
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="text"
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
                      <SelectTrigger className={cn("border-0 h-8", !entry.status && hasErrors && "ring-2 ring-red-500")}>
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="incomplete">Incomplete</SelectItem>
                         <SelectItem value="sent">Sent to the PA</SelectItem>
                         <SelectItem value="sent-to-carrier">Sent to Carrier</SelectItem>
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
              )})}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={saveEntry} variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Entry
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
    </>
  );
};

export default DataEntryTab;