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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddEstimatorDialogProps {
  existingEstimators: string[];
  onAddEstimator: (estimatorName: string) => void;
}

const AddEstimatorDialog: React.FC<AddEstimatorDialogProps> = ({
  existingEstimators,
  onAddEstimator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [estimatorName, setEstimatorName] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = estimatorName.trim();
    if (!trimmedName) {
      toast({
        title: "Name Required",
        description: "Please enter an estimator name.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates (case insensitive)
    const normalizedName = trimmedName.toLowerCase();
    if (existingEstimators.some(name => name.toLowerCase() === normalizedName)) {
      toast({
        title: "Duplicate Name",
        description: "An estimator with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    // Capitalize first letter of each word
    const formattedName = trimmedName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    onAddEstimator(formattedName);
    setEstimatorName('');
    setIsOpen(false);
    
    toast({
      title: "Estimator Added",
      description: `${formattedName} has been added successfully.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus size={16} />
          Add Estimator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Estimator</DialogTitle>
          <DialogDescription>
            Enter the name for the new estimator. They will get their own data entry tab and be included in all reports.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={estimatorName}
                onChange={(e) => setEstimatorName(e.target.value)}
                className="col-span-3"
                placeholder="Enter estimator name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Estimator</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEstimatorDialog;