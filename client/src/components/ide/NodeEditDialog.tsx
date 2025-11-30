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
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Check, X, RotateCcw } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';

interface NodeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeLabel: string;
  currentCode: string;
  lineStart?: number;
  lineEnd?: number;
  onSave: (newCode: string) => Promise<{ success: boolean; error?: string }>;
}

export function NodeEditDialog({
  open,
  onOpenChange,
  nodeLabel,
  currentCode,
  lineStart,
  lineEnd,
  onSave,
}: NodeEditDialogProps) {
  const [editedCode, setEditedCode] = useState(currentCode);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [rewrittenCode, setRewrittenCode] = useState('');

  useEffect(() => {
    setEditedCode(currentCode);
    setError(null);
    setInstructions('');
    setShowPreview(false);
    setRewrittenCode('');
  }, [currentCode, open]);

  const handleCodeChange = (newCode: string) => {
    setEditedCode(newCode);
    if (error) setError(null);
    if (newCode.trim().length === 0) {
      setError('Code cannot be empty');
    }
  };

  const handleAIRewrite = async () => {
    if (!instructions.trim()) return;
    
    setIsRewriting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rewrite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editedCode,
          instructions: instructions.trim(),
          context: `This code is from a flowchart node labeled "${nodeLabel}"${lineStart ? ` (lines ${lineStart}-${lineEnd})` : ''}.`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rewrite code');
      }
      
      const data = await response.json();
      setRewrittenCode(data.rewrittenCode);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while rewriting');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleApplyRewrite = () => {
    setEditedCode(rewrittenCode);
    setShowPreview(false);
    setInstructions('');
    setRewrittenCode('');
  };

  const handleDiscardRewrite = () => {
    setShowPreview(false);
    setRewrittenCode('');
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
    setInstructions('');
    setShowPreview(false);
    setRewrittenCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Edit Node
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono text-foreground">{nodeLabel}</span>
            {lineStart && lineEnd && (
              <span className="ml-2 text-muted-foreground">
                (Lines {lineStart}-{lineEnd})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Current/Edited Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Code</Label>
            <div className="bg-muted/30 rounded-md border overflow-hidden max-h-48 overflow-y-auto">
              <Editor
                value={editedCode}
                onValueChange={handleCodeChange}
                highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                padding={12}
                className="font-mono text-sm min-h-[100px]"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13,
                  backgroundColor: 'transparent',
                }}
                disabled={isSaving}
                data-testid="editor-node-code"
              />
            </div>
            {error && !showPreview && (
              <p className="text-sm text-destructive" data-testid="text-edit-error">
                {error}
              </p>
            )}
          </div>
          
          {/* AI Rewrite Section */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Rewrite
            </Label>
            <Textarea
              placeholder="Describe your changes... e.g., 'Add error handling', 'Make it more efficient', 'Add logging'"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[70px] resize-none text-sm"
              disabled={isRewriting || showPreview}
              data-testid="input-rewrite-instructions"
            />
            
            {!showPreview && (
              <Button
                onClick={handleAIRewrite}
                disabled={isRewriting || !instructions.trim()}
                variant="secondary"
                className="w-full"
                data-testid="button-rewrite-code"
              >
                {isRewriting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Rewrite with AI
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Rewrite Preview */}
          {showPreview && rewrittenCode && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-green-500 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  AI Suggestion
                </Label>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 rounded-md overflow-hidden max-h-48 overflow-y-auto">
                <Editor
                  value={rewrittenCode}
                  onValueChange={setRewrittenCode}
                  highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                  padding={12}
                  className="font-mono text-sm"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 13,
                    backgroundColor: 'transparent',
                  }}
                  data-testid="editor-rewritten-code"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You can edit the suggestion above before applying.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleApplyRewrite}
                  className="flex-1"
                  data-testid="button-apply-rewrite"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDiscardRewrite}
                  className="flex-1"
                  data-testid="button-discard-rewrite"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-edit"
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || editedCode.trim().length === 0}
            data-testid="button-save-edit"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
