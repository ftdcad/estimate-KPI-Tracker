import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BLOCKER_TYPES } from '@/lib/status';

interface UnblockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (resolutionNote: string) => void;
  fileNumber: string;
  blockerType: string;
  blockerReason: string;
  blockedAt: string | null;
}

function formatDuration(blockedAt: string | null): string {
  if (!blockedAt) return '';
  const ms = Date.now() - new Date(blockedAt).getTime();
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(ms / 60000);
  return `${minutes}m`;
}

export default function UnblockDialog({
  open,
  onClose,
  onConfirm,
  fileNumber,
  blockerType,
  blockerReason,
  blockedAt,
}: UnblockDialogProps) {
  const [resolutionNote, setResolutionNote] = useState('');

  const blockerLabel = BLOCKER_TYPES.find((bt) => bt.value === blockerType)?.label || blockerType;

  const handleConfirm = () => {
    onConfirm(resolutionNote.trim());
    setResolutionNote('');
  };

  const handleClose = () => {
    setResolutionNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve blocker</DialogTitle>
          <p className="text-sm text-muted-foreground">File: {fileNumber}</p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
            <p className="text-amber-300 font-medium">
              Blocked {formatDuration(blockedAt)} — {blockerLabel}
            </p>
            <p className="text-muted-foreground mt-1">"{blockerReason}"</p>
          </div>

          <div className="space-y-2">
            <Label>Resolution note (optional)</Label>
            <Input
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Got dimensions from Carlos"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Unblocked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
