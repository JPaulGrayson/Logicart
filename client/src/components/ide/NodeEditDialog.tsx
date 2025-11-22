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
  onSave: (newCode: string) => void;
}

export function NodeEditDialog({
  open,
  onOpenChange,
  nodeLabel,
  currentCode,
  onSave,
}: NodeEditDialogProps) {
  const [editedCode, setEditedCode] = useState(currentCode);

  useEffect(() => {
    setEditedCode(currentCode);
  }, [currentCode, open]);

  const handleSave = () => {
    onSave(editedCode);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEditedCode(currentCode);
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
        <div className="py-4">
          <Textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="font-mono text-sm min-h-[120px]"
            data-testid="textarea-node-edit"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            data-testid="button-save-edit"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
