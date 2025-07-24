import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EstimateEntry } from '@/types/kpi';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

interface ExcelImportDialogProps {
  onImport: (estimatorName: string, data: EstimateEntry[]) => void;
  existingEstimators?: string[];
}

export const ExcelImportDialog = ({ onImport, existingEstimators = [] }: ExcelImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<EstimateEntry[]>([]);
  const [estimatorName, setEstimatorName] = useState('');
  const [isNewEstimator, setIsNewEstimator] = useState(false);
  const { toast } = useToast();

  const convertTimeToHours = (timeStr: string): number | null => {
    if (!timeStr) return null;
    
    const str = timeStr.toString().toLowerCase();
    
    // Handle "30 minutes", "1.5 hours", etc.
    if (str.includes('min')) {
      const minutes = parseFloat(str.replace(/[^\d.]/g, ''));
      return minutes / 60;
    }
    if (str.includes('hour')) {
      return parseFloat(str.replace(/[^\d.]/g, ''));
    }
    
    // Direct number
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  const mapStatus = (statusStr: string): EstimateEntry['status'] => {
    if (!statusStr) return null;
    
    const str = statusStr.toLowerCase();
    if (str.includes('incomplete')) return 'incomplete';
    if (str.includes('sent') && str.includes('pa')) return 'sent';
    if (str.includes('sent') && str.includes('carrier')) return 'sent-to-carrier';
    if (str.includes('unable')) return 'unable-to-start';
    if (str.includes('pending')) return 'pending';
    
    return null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Transform the data to match our EstimateEntry interface with date header support
        const transformedData: EstimateEntry[] = [];
        let currentDate = new Date().toISOString().split('T')[0]; // Default to today
        
        // Date header patterns: "5/19 Estimates", "5/20", "MM/DD Estimates", etc.
        const dateHeaderPattern = /^(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})(\s+estimates?)?$/i;
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Skip completely empty rows
          const rowValues = Object.values(row).filter(val => val !== null && val !== undefined && val !== '');
          if (rowValues.length === 0) continue;
          
          // Check if this row is a date header
          const firstCellValue = String(Object.values(row)[0] || '').trim();
          if (dateHeaderPattern.test(firstCellValue)) {
            // Extract date from header (e.g., "5/19" -> "2024-05-19")
            const dateMatch = firstCellValue.match(/(\d{1,2})\/(\d{1,2})/);
            if (dateMatch) {
              const month = dateMatch[1].padStart(2, '0');
              const day = dateMatch[2].padStart(2, '0');
              const year = new Date().getFullYear(); // Use current year
              currentDate = `${year}-${month}-${day}`;
            }
            continue; // Skip to next row
          }
          
          // Check if this row contains actual estimate data
          const rowData = row as any;
          const hasFileNumber = rowData['File Number'] || rowData['File #'] || rowData.FileNumber;
          const hasClientName = rowData['Client Name'] || rowData.Client || rowData.ClientName;
          
          // Only process rows that have at least a file number or client name
          if (!hasFileNumber && !hasClientName) continue;
          
          // Create estimate entry
          const entry: EstimateEntry = {
            id: `import-${Date.now()}-${i}`,
            date: currentDate,
            fileNumber: String(hasFileNumber || ''),
            clientName: String(hasClientName || ''),
            peril: rowData.Peril || null,
            severity: rowData.Severity ? parseInt(rowData.Severity) as 1 | 2 | 3 | 4 | 5 : null,
            timeHours: convertTimeToHours(rowData['Time on File'] || rowData.Time || rowData.TimeHours || ''),
            revisionTimeHours: convertTimeToHours(rowData['Revision Time'] || rowData.RevisionTime || ''),
            estimateValue: rowData['Estimate Value'] || rowData.Value || rowData.EstimateValue ? parseFloat(rowData['Estimate Value'] || rowData.Value || rowData.EstimateValue) : null,
            revisions: rowData.Revisions ? parseInt(rowData.Revisions) : null,
            status: mapStatus(rowData.Status || ''),
            notes: String(rowData.Notes || ''),
            actualSettlement: null,
            settlementDate: null,
            isSettled: false
          };
          
          transformedData.push(entry);
        }

        setPreviewData(transformedData);
        toast({
          title: "File parsed successfully",
          description: `Found ${transformedData.length} entries to import`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "Please check your Excel file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (!estimatorName.trim()) {
      toast({
        title: "Please enter estimator name",
        variant: "destructive",
      });
      return;
    }

    if (previewData.length === 0) {
      toast({
        title: "No data to import",
        variant: "destructive",
      });
      return;
    }

    onImport(estimatorName.trim(), previewData);
    toast({
      title: "Data imported successfully",
      description: `Imported ${previewData.length} entries for ${estimatorName}`,
    });
    setIsOpen(false);
    setPreviewData([]);
    setEstimatorName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import Excel Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Import Excel Data (Temporary)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Estimator:</label>
            <div className="space-y-2">
              <Select value={isNewEstimator ? "new" : estimatorName} onValueChange={(value) => {
                if (value === "new") {
                  setIsNewEstimator(true);
                  setEstimatorName('');
                } else {
                  setIsNewEstimator(false);
                  setEstimatorName(value);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose existing estimator or add new..." />
                </SelectTrigger>
                <SelectContent>
                  {existingEstimators.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                  <SelectItem value="new">+ Add New Estimator</SelectItem>
                </SelectContent>
              </Select>
              
              {isNewEstimator && (
                <Input
                  value={estimatorName}
                  onChange={(e) => setEstimatorName(e.target.value)}
                  placeholder="Enter new estimator name"
                />
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Excel File:</label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </div>

          {previewData.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Preview ({previewData.length} entries):</h3>
              <div className="max-h-60 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">File #</th>
                      <th className="p-2 text-left">Client</th>
                      <th className="p-2 text-left">Severity</th>
                      <th className="p-2 text-left">Time (hrs)</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((entry, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{entry.date}</td>
                        <td className="p-2">{entry.fileNumber}</td>
                        <td className="p-2">{entry.clientName}</td>
                        <td className="p-2">{entry.severity}</td>
                        <td className="p-2">{entry.timeHours}</td>
                        <td className="p-2">{entry.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <p className="p-2 text-muted-foreground">...and {previewData.length - 10} more entries</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!estimatorName.trim() || previewData.length === 0}>
              Import Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};