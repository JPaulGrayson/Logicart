import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2, Loader2 } from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function ShareDialog({ open, onOpenChange, code }: ShareDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, title: title || undefined, description: description || undefined })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create share link');
      }
      
      const { url } = await response.json();
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setShareUrl('');
    setCopied(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Flowchart
          </DialogTitle>
          <DialogDescription>
            Create a shareable link to this flowchart that anyone can view.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {!shareUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="share-title">Title (optional)</Label>
                <Input
                  id="share-title"
                  placeholder="My Flowchart"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-share-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="share-description">Description (optional)</Label>
                <Textarea
                  id="share-description"
                  placeholder="What does this code do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="input-share-description"
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <Button 
                onClick={handleShare} 
                className="w-full"
                disabled={isLoading || !code.trim()}
                data-testid="button-create-share"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Share Link Created!</p>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="text-xs"
                    data-testid="input-share-url"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleCopy}
                    data-testid="button-copy-share-url"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Anyone with this link can view your flowchart
              </p>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Done
                </Button>
                <Button 
                  onClick={() => setShareUrl('')} 
                  variant="ghost"
                  className="flex-1"
                >
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
