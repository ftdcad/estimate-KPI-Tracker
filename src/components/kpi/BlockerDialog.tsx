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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BLOCKER_TYPES, type BlockerType } from '@/lib/status';

interface BlockerDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (blockerType: BlockerType, blockerName: string, blockerReason: string) => void;
  fileNumber: string;
}

export default function BlockerDialog({ open, onClose, onConfirm, fileNumber }: BlockerDialogProps) {
  const [blockerType, setBlockerType] = useState<BlockerType | ''>('');
  const [blockerName, setBlockerName] = useState('');
  const [blockerReason, setBlockerReason] = useState('');

  const handleConfirm = () => {
    if (!blockerType || !blockerReason.trim()) return;
    onConfirm(blockerType, blockerName.trim(), blockerReason.trim());
    // Reset state
    setBlockerType('');
    setBlockerName('');
    setBlockerReason('');
  };

  const handleClose = () => {
    setBlockerType('');
    setBlockerName('');
    setBlockerReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What's blocking this file?</DialogTitle>
          <p className="text-sm text-muted-foreground">File: {fileNumber}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Who */}
          <div className="space-y-2">
            <Label>Who are you waiting on?</Label>
            <Select value={blockerType} onValueChange={(v) => setBlockerType(v as BlockerType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select blocker type..." />
              </SelectTrigger>
              <SelectContent>
                {BLOCKER_TYPES.map((bt) => (
                  <SelectItem key={bt.value} value={bt.value}>
                    {bt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Name (optional) */}
          <div className="space-y-2">
            <Label>Name (optional)</Label>
            <Input
              value={blockerName}
              onChange={(e) => setBlockerName(e.target.value)}
              placeholder="e.g. Carlos Machin, Allstate adjuster..."
            />
          </div>

          {/* Step 3: Why */}
          <div className="space-y-2">
            <Label>Why?</Label>
            <Input
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="e.g. Need gutter dimensions"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!blockerType || !blockerReason.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Blocked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
