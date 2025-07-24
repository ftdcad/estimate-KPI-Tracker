import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Save, Calculator, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { EstimateEntry, PERIL_OPTIONS } from '../../types/kpi';
import { toast } from '@/hooks/use-toast';

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

  // Helper function to get today's date in local timezone
  const getTodayLocalDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize with one empty row if no data, also normalize existing data
  if (data.length === 0) {
    onDataUpdate([createEmptyEntry()]);
  } else {
    // Normalize existing data to ensure all string fields are actually strings
    const normalizedData = data.map(entry => ({
      ...entry,
      fileNumber: entry.fileNumber || '',
      clientName: entry.clientName || '',
      notes: entry.notes || ''
    }));
    
    // Update data if it was normalized
    if (JSON.stringify(normalizedData) !== JSON.stringify(data)) {
      onDataUpdate(normalizedData);
    }
  }

  function createEmptyEntry(): EstimateEntry {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: getTodayLocalDate(),
      fileNumber: '',
      clientName: '',
      peril: null, // Changed: No longer auto-populates to "Wind"
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
    
    // Ensure strings are properly handled
    if (!entry.fileNumber || entry.fileNumber.trim() === '') errors.push('File Number');
    if (!entry.clientName || entry.clientName.trim() === '') errors.push('Client Name');
    if (!entry.peril || entry.peril.trim() === '') errors.push('Peril');
    if (!entry.severity) errors.push('Severity');
    if (!entry.timeHours || entry.timeHours <= 0) errors.push('Hours');
    if (!entry.estimateValue || entry.estimateValue <= 0) errors.push('Estimated Value');
    if (!entry.status) errors.push('Status');
    
    return errors;
  };

  // Check if a field has validation error
  const hasFieldError = (entry: EstimateEntry, field: string): boolean => {
    if (!validationErrors.has(entry.id)) return false;
    
    switch (field) {
      // Removed date case since it's no longer validated
      case 'fileNumber': return !entry.fileNumber || entry.fileNumber.trim() === '';
      case 'clientName': return !entry.clientName || entry.clientName.trim() === '';
      case 'peril': return !entry.peril || entry.peril.trim() === '';
      case 'severity': return !entry.severity;
      case 'timeHours': return !entry.timeHours || entry.timeHours <= 0;
      case 'estimateValue': return !entry.estimateValue || entry.estimateValue <= 0;
      case 'status': return !entry.status;
      default: return false;
    }
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
    
    // Ensure data integrity - normalize string fields
    if (field === 'fileNumber' || field === 'clientName' || field === 'notes') {
      value = value || '';
    }
    
    // Handle date field - format as YYYY-MM-DD
    if (field === 'date' && value instanceof Date) {
      const year = value.getFullYear();
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const day = value.getDate().toString().padStart(2, '0');
      value = `${year}-${month}-${day}`;
    }
    
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
                <th className="border border-border p-2 w-28">Peril</th>
                <th className="border border-border p-2 w-20">Severity</th>
                <th className="border border-border p-2 w-24">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>Hours</TooltipTrigger>
                      <TooltipContent>
                        <p>Time conversion: 0.25 = 15min, 0.5 = 30min, 0.75 = 45min, 1.0 = 60min</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="border border-border p-2 w-24">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>Rev Time</TooltipTrigger>
                      <TooltipContent>
                        <p>Time conversion: 0.25 = 15min, 0.5 = 30min, 0.75 = 45min, 1.0 = 60min</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="border border-border p-2 w-28">Est. Value</th>
                <th className="border border-border p-2 w-20">Revisions</th>
                <th className="border border-border p-2 w-28">Status</th>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "border-0 h-8 w-full justify-start text-left font-normal",
                            !entry.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {entry.date ? format(new Date(entry.date), "MM/dd/yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={entry.date ? new Date(entry.date) : undefined}
                          onSelect={(date) => updateEntry(index, 'date', date)}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.fileNumber}
                      onChange={(e) => updateEntry(index, 'fileNumber', e.target.value)}
                      className={cn("border-0 h-8", hasFieldError(entry, 'fileNumber') && "ring-2 ring-red-500")}
                      placeholder="File #"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      value={entry.clientName}
                      onChange={(e) => updateEntry(index, 'clientName', e.target.value)}
                      className={cn("border-0 h-8", hasFieldError(entry, 'clientName') && "ring-2 ring-red-500")}
                      placeholder="Client name"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Select
                      value={entry.peril || ''}
                      onValueChange={(value) => updateEntry(index, 'peril', value === 'none' ? null : value)}
                    >
                      <SelectTrigger className={cn("border-0 h-8", hasFieldError(entry, 'peril') && "ring-2 ring-red-500")}>
                        <SelectValue placeholder="Select peril" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select Peril...</SelectItem>
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
                      <SelectTrigger className={cn("border-0 h-8", hasFieldError(entry, 'severity') && "ring-2 ring-red-500")}>
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
                      step="0.25"
                      min="0"
                      value={entry.timeHours ?? ''}
                      onChange={(e) => updateEntry(index, 'timeHours', e.target.value)}
                      onBlur={(e) => {
                        const numValue = e.target.value ? parseFloat(e.target.value) : null;
                        updateEntry(index, 'timeHours', numValue);
                      }}
                      className={cn("border-0 h-8 text-right", hasFieldError(entry, 'timeHours') && "ring-2 ring-red-500")}
                      placeholder="0.15"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={entry.revisionTimeHours ?? ''}
                      onChange={(e) => updateEntry(index, 'revisionTimeHours', e.target.value)}
                      onBlur={(e) => {
                        const numValue = e.target.value ? parseFloat(e.target.value) : null;
                        updateEntry(index, 'revisionTimeHours', numValue);
                      }}
                      className="border-0 h-8 text-right"
                      placeholder="0.15"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <Input
                      type="text"
                      value={entry.estimateValue ?? ''}
                      onChange={(e) => updateEntry(index, 'estimateValue', e.target.value ? parseFloat(e.target.value) : null)}
                      className={cn("border-0 h-8 text-right", hasFieldError(entry, 'estimateValue') && "ring-2 ring-red-500")}
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
                      <SelectTrigger className={cn("border-0 h-8", hasFieldError(entry, 'status') && "ring-2 ring-red-500")}>
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
  );
};

export default DataEntryTab;