import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManageEstimatorDialogProps {
  existingEstimators: string[];
  onAddEstimator: (estimatorName: string) => void;
  onEditEstimator: (oldName: string, newName: string) => void;
  onRemoveEstimator: (estimatorName: string) => void;
}

type DialogMode = 'add' | 'edit' | 'remove';

const ManageEstimatorDialog: React.FC<ManageEstimatorDialogProps> = ({
  existingEstimators,
  onAddEstimator,
  onEditEstimator,
  onRemoveEstimator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('add');
  const [estimatorName, setEstimatorName] = useState('');
  const [selectedEstimator, setSelectedEstimator] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEstimatorName('');
    setSelectedEstimator('');
    setMode('add');
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleModeChange = (newMode: DialogMode) => {
    setMode(newMode);
    setEstimatorName('');
    setSelectedEstimator('');
  };

  const handleEstimatorSelect = (estimator: string) => {
    setSelectedEstimator(estimator);
    if (mode === 'edit') {
      setEstimatorName(estimator);
    }
  };

  const validateName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        title: "Name Required",
        description: "Please enter an estimator name.",
        variant: "destructive",
      });
      return false;
    }

    if (mode === 'add') {
      const normalizedName = trimmedName.toLowerCase();
      if (existingEstimators.some(existing => existing.toLowerCase() === normalizedName)) {
        toast({
          title: "Duplicate Name",
          description: "An estimator with this name already exists.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (mode === 'edit' && selectedEstimator) {
      const normalizedName = trimmedName.toLowerCase();
      const selectedNormalized = selectedEstimator.toLowerCase();
      if (normalizedName !== selectedNormalized && 
          existingEstimators.some(existing => existing.toLowerCase() === normalizedName)) {
        toast({
          title: "Duplicate Name",
          description: "An estimator with this name already exists.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const formatName = (name: string) => {
    return name.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'add') {
      if (!validateName(estimatorName)) return;
      
      const formattedName = formatName(estimatorName);
      onAddEstimator(formattedName);
      
      toast({
        title: "Estimator Added",
        description: `${formattedName} has been added successfully.`,
      });
    } else if (mode === 'edit') {
      if (!selectedEstimator) {
        toast({
          title: "No Estimator Selected",
          description: "Please select an estimator to edit.",
          variant: "destructive",
        });
        return;
      }
      
      if (!validateName(estimatorName)) return;
      
      const formattedName = formatName(estimatorName);
      if (formattedName !== selectedEstimator) {
        onEditEstimator(selectedEstimator, formattedName);
        
        toast({
          title: "Estimator Updated",
          description: `${selectedEstimator} has been renamed to ${formattedName}.`,
        });
      }
    }
    
    resetForm();
    setIsOpen(false);
  };

  const handleRemove = () => {
    if (!selectedEstimator) {
      toast({
        title: "No Estimator Selected",
        description: "Please select an estimator to remove.",
        variant: "destructive",
      });
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmRemove = () => {
    onRemoveEstimator(selectedEstimator);
    
    toast({
      title: "Estimator Removed",
      description: `${selectedEstimator} has been removed from the system.`,
    });

    setShowDeleteConfirm(false);
    resetForm();
    setIsOpen(false);
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'add': return 'Add New Estimator';
      case 'edit': return 'Edit Estimator';
      case 'remove': return 'Remove Estimator';
      default: return 'Manage Estimators';
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case 'add': return 'Enter the name for the new estimator. They will get their own data entry tab and be included in all reports.';
      case 'edit': return 'Select an estimator and update their name. All existing data will be preserved.';
      case 'remove': return 'Select an estimator to remove from the system. This action will permanently delete all their data.';
      default: return 'Add, edit, or remove estimators from the system.';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings size={16} />
            Manage Estimators
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('add')}
                className="gap-1"
              >
                <Plus size={14} />
                Add
              </Button>
              <Button
                type="button"
                variant={mode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('edit')}
                className="gap-1"
                disabled={existingEstimators.length === 0}
              >
                <Edit size={14} />
                Edit
              </Button>
              <Button
                type="button"
                variant={mode === 'remove' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('remove')}
                className="gap-1"
                disabled={existingEstimators.length === 0}
              >
                <Trash size={14} />
                Remove
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Estimator Selection for Edit/Remove */}
              {(mode === 'edit' || mode === 'remove') && (
                <div className="space-y-2">
                  <Label htmlFor="estimator-select">Select Estimator</Label>
                  <Select value={selectedEstimator} onValueChange={handleEstimatorSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an estimator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingEstimators.map((estimator) => (
                        <SelectItem key={estimator} value={estimator}>
                          {estimator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Name Input for Add/Edit */}
              {(mode === 'add' || mode === 'edit') && (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {mode === 'add' ? 'Estimator Name' : 'New Name'}
                  </Label>
                  <Input
                    id="name"
                    value={estimatorName}
                    onChange={(e) => setEstimatorName(e.target.value)}
                    placeholder={mode === 'add' ? 'Enter estimator name' : 'Enter new name'}
                    autoFocus={mode === 'add'}
                  />
                </div>
              )}

              {/* Remove Confirmation */}
              {mode === 'remove' && selectedEstimator && (
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md">
                  <p className="text-sm text-destructive font-medium">
                    Warning: This will permanently delete all data for {selectedEstimator}.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                {mode === 'remove' ? (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleRemove}
                    disabled={!selectedEstimator}
                  >
                    Remove Estimator
                  </Button>
                ) : (
                  <Button type="submit" disabled={mode === 'edit' && !selectedEstimator}>
                    {mode === 'add' ? 'Add Estimator' : 'Update Estimator'}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedEstimator} and all their data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All estimate entries</li>
                <li>Historical performance data</li>
                <li>KPI metrics and reports</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Remove Estimator
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageEstimatorDialog;