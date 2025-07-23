import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EstimateEntry } from '@/types/kpi';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

interface ExcelImportDialogProps {
  onImport: (estimatorName: string, data: EstimateEntry[]) => void;
}

export const ExcelImportDialog = ({ onImport }: ExcelImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<EstimateEntry[]>([]);
  const [estimatorName, setEstimatorName] = useState('');
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

        const transformedData: EstimateEntry[] = jsonData.map((row: any, index) => ({
          id: `import-${Date.now()}-${index}`,
          date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          fileNumber: row['File Number'] || row['File #'] || '',
          clientName: row['Client Name'] || row.Client || '',
          severity: row.Severity ? parseInt(row.Severity) as 1 | 2 | 3 | 4 | 5 : null,
          timeHours: convertTimeToHours(row['Time on File'] || row.Time || ''),
          revisionTimeHours: convertTimeToHours(row['Revision Time'] || ''),
          estimateValue: row['Estimate Value'] || row.Value ? parseFloat(row['Estimate Value'] || row.Value) : null,
          revisions: row.Revisions ? parseInt(row.Revisions) : null,
          status: mapStatus(row.Status || ''),
          notes: row.Notes || ''
        }));

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
            <label className="block text-sm font-medium mb-2">Estimator Name:</label>
            <Input
              value={estimatorName}
              onChange={(e) => setEstimatorName(e.target.value)}
              placeholder="Enter estimator name"
            />
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