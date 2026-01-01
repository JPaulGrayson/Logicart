import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from 'lucide-react';

interface NodeLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeLabel: string;
  currentUserLabel?: string;
  onSave: (label: string) => Promise<{ success: boolean; error?: string }>;
}

export function NodeLabelDialog({
  open,
  onOpenChange,
  nodeLabel,
  currentUserLabel,
  onSave,
}: NodeLabelDialogProps) {
  const [label, setLabel] = useState(currentUserLabel || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLabel(currentUserLabel || '');
    setError(null);
  }, [currentUserLabel, open]);

  const handleSave = async () => {
    if (label.trim().length === 0) {
      setError('Label cannot be empty');
      return;
    }
    
    setIsSaving(true);
    const result = await onSave(label.trim());
    setIsSaving(false);
    
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || 'Failed to add label');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="label-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {currentUserLabel ? 'Edit Label' : 'Add Label'}
          </DialogTitle>
          <DialogDescription>
            Add a human-readable label to this node. The label will appear on the flowchart.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Node</Label>
            <div className="p-2 bg-muted rounded text-sm font-mono truncate">
              {nodeLabel}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="label-input">Label</Label>
            <Input
              id="label-input"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Initialize counter, Check condition..."
              className="font-mono"
              autoFocus
              data-testid="input-node-label"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
          
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-muted-foreground">
            <strong className="text-blue-400">Tip:</strong> This will add a{' '}
            <code className="bg-muted px-1 rounded">// @logigo: {label || 'your label'}</code>{' '}
            comment above the code.
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-cancel-label"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || label.trim().length === 0}
            data-testid="button-save-label"
          >
            {isSaving ? 'Saving...' : 'Save Label'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NodeLabelDialog;
