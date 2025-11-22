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
import { Textarea } from "@/components/ui/textarea";

interface NodeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeLabel: string;
  currentCode: string;
  onSave: (newCode: string) => Promise<{ success: boolean; error?: string }>;
}

export function NodeEditDialog({
  open,
  onOpenChange,
  nodeLabel,
  currentCode,
  onSave,
}: NodeEditDialogProps) {
  const [editedCode, setEditedCode] = useState(currentCode);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedCode(currentCode);
    setError(null);
  }, [currentCode, open]);

  const handleCodeChange = (newCode: string) => {
    setEditedCode(newCode);
    
    // Clear previous errors when editing
    if (error) {
      setError(null);
    }
    
    // Basic validation: code should not be empty
    if (newCode.trim().length === 0) {
      setError('Code cannot be empty');
    }
  };

  const handleSave = async () => {
    if (editedCode.trim().length === 0) {
      setError('Code cannot be empty');
      return;
    }
    
    setIsSaving(true);
    const result = await onSave(editedCode);
    setIsSaving(false);
    
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditedCode(currentCode);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
          <DialogDescription>
            Editing: <span className="font-mono text-foreground">{nodeLabel}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Textarea
            value={editedCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            className={`font-mono text-sm min-h-[120px] ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            data-testid="textarea-node-edit"
            autoFocus
            disabled={isSaving}
          />
          {error && (
            <p className="text-sm text-red-500" data-testid="text-edit-error">
              {error}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Tip: Edit the code snippet for this node. Changes will update the flowchart automatically.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-edit"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            data-testid="button-save-edit"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
