import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Loader2, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';

interface GitHubRepo {
  owner: string;
  name: string;
  fullName: string;
}

interface GitHubSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  flowchartData: any;
  token: string | null;
}

export function GitHubSyncModal({ open, onOpenChange, code, flowchartData, token }: GitHubSyncModalProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [filename, setFilename] = useState('flowchart');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string } | null>(null);

  useEffect(() => {
    if (open) {
      checkGitHubStatus();
      setSyncResult(null);
    }
  }, [open]);

  const checkGitHubStatus = async () => {
    try {
      const response = await fetch('/api/github/status');
      const data = await response.json();
      setGithubConnected(data.connected);
      if (data.connected && data.user) {
        setGithubUser(data.user);
        loadRepos();
      }
    } catch (error) {
      setGithubConnected(false);
    }
  };

  const loadRepos = async () => {
    if (!token) return;
    
    setIsLoadingRepos(true);
    try {
      const response = await apiRequest('GET', '/api/github/repos', undefined, {
        Authorization: `Bearer ${token}`
      });
      const data = await response.json();
      if (data.success && data.repos) {
        setRepos(data.repos);
        if (data.repos.length > 0 && !selectedRepo) {
          setSelectedRepo(data.repos[0].fullName);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleSync = async () => {
    if (!selectedRepo || !token) return;

    const repo = repos.find(r => r.fullName === selectedRepo);
    if (!repo) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await apiRequest('POST', '/api/github/sync', {
        owner: repo.owner,
        repo: repo.name,
        filename,
        code,
        flowchartData,
      }, {
        Authorization: `Bearer ${token}`
      });

      const data = await response.json();
      setSyncResult(data);

      if (data.success) {
        toast.success('Synced to GitHub successfully!');
      } else {
        toast.error(data.error || 'Failed to sync');
      }
    } catch (error: any) {
      setSyncResult({ success: false, error: error.message });
      toast.error('Failed to sync to GitHub');
    } finally {
      setIsSyncing(false);
    }
  };

  const extractFunctionName = (code: string): string => {
    const match = code.match(/function\s+(\w+)/);
    return match ? match[1] : 'flowchart';
  };

  useEffect(() => {
    if (code && open) {
      const name = extractFunctionName(code);
      setFilename(name);
    }
  }, [code, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Sync to GitHub
          </DialogTitle>
          <DialogDescription>
            Save your flowchart to a GitHub repository for version control and backup.
          </DialogDescription>
        </DialogHeader>

        {githubConnected === false ? (
          <div className="py-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              GitHub is not connected. Please connect your GitHub account first.
            </p>
            <Button variant="outline" disabled>
              Connect GitHub (Configure in Replit)
            </Button>
          </div>
        ) : githubConnected === null ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Checking GitHub connection...</p>
          </div>
        ) : syncResult?.success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-foreground mb-2">Successfully synced to GitHub!</p>
            {syncResult.url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(syncResult.url, '_blank')}
                data-testid="link-view-github"
              >
                <ExternalLink className="w-4 h-4" />
                View on GitHub
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {githubUser && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <img src={githubUser.avatar_url} alt="GitHub" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-foreground">{githubUser.login}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="repo">Repository</Label>
              {isLoadingRepos ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading repositories...
                </div>
              ) : (
                <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger id="repo" data-testid="select-repo">
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="flowchart"
                data-testid="input-filename"
              />
              <p className="text-xs text-muted-foreground">
                Will be saved as: logicart/{filename}_YYYY-MM-DD.json
              </p>
            </div>

            {syncResult?.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                {syncResult.error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-github-cancel">
            {syncResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {!syncResult?.success && githubConnected && (
            <Button
              onClick={handleSync}
              disabled={isSyncing || !selectedRepo || !code.trim()}
              className="gap-2"
              data-testid="button-github-sync"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  Sync to GitHub
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
