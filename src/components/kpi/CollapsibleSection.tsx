import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
  badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              open && 'rotate-90'
            )}
          />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {badge}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-3 space-y-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSection;
