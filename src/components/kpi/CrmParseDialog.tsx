import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, ClipboardPaste, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseCrmData, getParsedSummary, type ParsedCrmData } from '@/lib/crm-parser';

interface CrmParseDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (data: ParsedCrmData) => void;
}

const CrmParseDialog: React.FC<CrmParseDialogProps> = ({ open, onClose, onApply }) => {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedCrmData | null>(null);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseCrmData(rawText);
    setParsed(result);
    setStep('preview');
  };

  const handleApply = () => {
    if (parsed) {
      onApply(parsed);
    }
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setRawText('');
    setParsed(null);
    setStep('paste');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const summary = parsed ? getParsedSummary(parsed) : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assist — ClaimWizard Import
          </DialogTitle>
          <DialogDescription>
            {step === 'paste'
              ? 'Open the claim in ClaimWizard, press Ctrl+A then Ctrl+C, and paste below.'
              : `Found ${summary.length} field${summary.length !== 1 ? 's' : ''}. Review and click Apply to fill the form.`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'paste' && (
          <div className="space-y-3">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste ClaimWizard data here (Ctrl+V)..."
              className="min-h-[250px] text-sm font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Tip: In ClaimWizard, open the claim → Ctrl+A (select all) → Ctrl+C (copy) → paste here.
            </p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3">
            {summary.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No fields could be extracted from the pasted data.</p>
                <p className="text-xs mt-1">Make sure you copied the full ClaimWizard page.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-1/3">Field</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((item, i) => (
                      <tr key={item.label} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/20')}>
                        <td className="px-3 py-1.5 text-muted-foreground">{item.label}</td>
                        <td className="px-3 py-1.5 font-medium">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setStep('paste')}
            >
              <ClipboardPaste className="h-3 w-3 mr-1" />
              Back to paste
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'paste' ? (
            <Button onClick={handleParse} disabled={!rawText.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Parse
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={summary.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Apply {summary.length} field{summary.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrmParseDialog;
