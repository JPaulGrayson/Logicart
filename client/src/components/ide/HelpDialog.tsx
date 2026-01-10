import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  Code2,
  Keyboard,
  Info,
  Lightbulb,
  Sparkles,
  ChevronRight,
  BookOpen,
  Github,
  Layers,
  Workflow,
  Layout,
  ExternalLink,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from '@/components/ui/Mermaid';
import { ConnectWizard } from './ConnectWizard';
import { cn } from '@/lib/utils';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: string;
}

const VISIBLE_DOCS = [
  { id: 'getting-started', title: 'Getting Started', emoji: '🚀', slug: 'getting-started' },
  { id: 'vibe-coder-guide', title: 'Vibe Coder Guide', emoji: '✨', slug: 'vibe-coder-guide' },
  { id: 'agent-api', title: 'Agent API', emoji: '🤖', slug: 'agent-api' },
  { id: 'mcp-guide', title: 'MCP Integration', emoji: '🔌', slug: 'mcp-guide' },
  { id: 'integration-wizard', title: 'Integration Wizard', emoji: '🪄', component: true },
  { id: 'common-pitfalls', title: 'Common Pitfalls', emoji: '⚠️', slug: 'common-pitfalls' },
  { id: 'api-reference', title: 'API Reference', emoji: '🔧', slug: 'api-reference' },
  { id: 'arena-masterclass', title: 'Arena Masterclass', emoji: '🏛', slug: 'arena-masterclass' },
  { id: 'remote-sync', title: 'Remote Sync Guide', emoji: '🛰', slug: 'remote-sync' },
  { id: 'file-sync', title: 'File Sync Guide', emoji: '🔄', slug: 'file-sync' },
  { id: 'dev-vs-production', title: 'Dev vs Production', emoji: '🌐', slug: 'dev-vs-production' },
];

const GALLERY_ITEMS = [
  {
    title: 'Sorting Algorithms',
    url: '/demo/library/sorting.html',
    icon: <Workflow className="w-4 h-4 text-blue-400" />,
    description: 'Visualization of Bubble, Quick, and Merge sort.'
  },
  {
    title: 'Ghost Diff Demo',
    url: '/demo/ghost_diff.html',
    icon: <Layers className="w-4 h-4 text-purple-400" />,
    description: 'See execution diffs in real-time.'
  },
  {
    title: 'Visual Handshake',
    url: '/demo/visual_handshake.html',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    description: 'Connecting code to DOM elements.'
  }
];

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 my-6 flex gap-3 text-sm text-blue-100/80 leading-relaxed shadow-sm animate-in fade-in duration-500">
    <div className="text-xl">💡</div>
    <div className="flex-1 prose-invert prose-sm">
      {children}
    </div>
  </div>
);

export function HelpDialog({ open, onOpenChange, initialSection }: HelpDialogProps) {
  const { startTutorial } = useTutorial();
  const [activeSection, setActiveSection] = useState<string>(initialSection || 'getting-started');
  const [docContent, setDocContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    const doc = VISIBLE_DOCS.find(d => d.id === activeSection);
    if (doc && doc.slug) {
      fetchDoc(doc.slug);
    } else {
      setDocContent(null);
    }
  }, [activeSection]);

  const fetchDoc = async (slug: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/docs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setDocContent(data.content);
      } else {
        setDocContent('Failed to load documentation.');
      }
    } catch (error) {
      setDocContent('Error loading documentation.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (activeSection === 'integration-wizard') {
      return <ConnectWizard />;
    }

    if (activeSection === 'shortcuts') {
      return (
        <div className="space-y-6 pr-4">
          <section>
            <h3 className="text-lg font-semibold mb-3">Execution Control</h3>
            <div className="space-y-2">
              <ShortcutRow shortcut="Space or K" description="Play / Pause execution" />
              <ShortcutRow shortcut="S or →" description="Step forward (next step)" />
              <ShortcutRow shortcut="B or ←" description="Step backward (Time Travel)" />
              <ShortcutRow shortcut="R" description="Reset execution" />
              <ShortcutRow shortcut="L" description="Toggle loop mode" />
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-3">Speed Control</h3>
            <div className="space-y-2">
              <ShortcutRow shortcut="[" description="Decrease speed" />
              <ShortcutRow shortcut="]" description="Increase speed" />
              <ShortcutRow shortcut="1-5" description="Set speed preset (1=0.5x, 2=1x, 3=2x, 4=5x, 5=10x)" />
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-3">View & Navigation</h3>
            <div className="space-y-2">
              <ShortcutRow shortcut="F" description="Toggle fullscreen (Workspace mode)" />
              <ShortcutRow shortcut="Escape" description="Exit fullscreen" />
              <ShortcutRow shortcut="V" description="Toggle variables panel" />
              <ShortcutRow shortcut="D" description="Toggle Ghost Diff overlay" />
              <ShortcutRow shortcut="Cmd/Ctrl + K" description="Focus Natural Language Search" />
            </div>
          </section>
        </div>
      );
    }

    if (activeSection === 'about') {
      return (
        <div className="space-y-6 pr-4 text-sm text-muted-foreground">
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">LogicArt Studio</h3>
            <p>
              A bidirectional code-to-flowchart visualization tool designed for "Vibe Coders" who benefit from visual learning and debugging.
            </p>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">Version</h3>
            <p><strong>LogicArt Studio:</strong> v1.2.0-stable</p>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">Key Features</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              <li>✓ Static code analysis</li>
              <li>✓ Live Mode debugging</li>
              <li>✓ Time Travel execution</li>
              <li>✓ View Levels (1000ft, etc)</li>
              <li>✓ Ghost Diff overlays</li>
              <li>✓ Multi-AI Model Arena</li>
              <li>✓ MCP Integration</li>
              <li>✓ VS Code Extension</li>
            </ul>
          </section>
        </div>
      );
    }

    if (activeSection === 'gallery') {
      return (
        <div className="space-y-8 pr-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GALLERY_ITEMS.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-muted/30 rounded-2xl border border-white/5 hover:border-primary/40 hover:bg-muted/50 transition-all shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-background rounded-xl border border-white/5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </a>
            ))}
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (docContent) {
      return (
        <div className="markdown-content pb-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';

                if (!inline && language === 'mermaid') {
                  return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                }

                if (!inline && language === 'callout') {
                  return <InfoBox>{children}</InfoBox>;
                }

                return !inline ? (
                  <div className="relative group my-4">
                    <pre className="p-3 bg-muted/80 rounded-lg overflow-x-auto border border-white/5 font-mono text-[13px] shadow-inner">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] text-primary" {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-white tracking-tight">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold mt-8 mb-3 border-b border-white/5 pb-2 text-slate-100 tracking-tight">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold mt-6 mb-2 text-slate-200">{children}</h3>,
              p: ({ children }) => <p className="text-slate-400 leading-relaxed mb-4 text-sm">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-400 text-sm">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-400 text-sm">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
              strong: ({ children }) => <strong className="text-slate-200 font-semibold">{children}</strong>,
              hr: () => <hr className="my-6 border-white/5" />,
              table: ({ children }) => <table className="w-full my-4 text-sm border-collapse">{children}</table>,
              th: ({ children }) => <th className="text-left p-2 border-b border-white/10 text-slate-300 font-semibold">{children}</th>,
              td: ({ children }) => <td className="p-2 border-b border-white/5 text-slate-400">{children}</td>
            }}
          >
            {docContent}
          </ReactMarkdown>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] h-[90vh] p-0 overflow-hidden border-white/10 shadow-2xl bg-[#09090b]">
        <div className="flex h-full w-full overflow-hidden">
          {/* Sidebar */}
          <div className="w-[260px] flex flex-col border-r border-white/5 bg-[#0e0e11]">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  L
                </div>
                <h2 className="font-bold text-lg tracking-tight">LogicArt Doc</h2>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em] opacity-60">Documentation Center v1.3</p>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
              <div className="space-y-6">
                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">General</div>
                  <div className="space-y-1">
                    {VISIBLE_DOCS.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setActiveSection(doc.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group",
                          activeSection === doc.id
                            ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span className="text-base grayscale group-hover:grayscale-0 transition-all">{doc.emoji}</span>
                        <span className="font-medium">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Resources</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveSection('shortcuts')}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group",
                        activeSection === 'shortcuts' ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <Keyboard className="w-4 h-4" />
                      <span className="font-medium">Shortcuts</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('gallery')}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group",
                        activeSection === 'gallery' ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="font-medium">Showcase Gallery</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('about')}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group",
                        activeSection === 'about' ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <Info className="w-4 h-4" />
                      <span className="font-medium">About LogicArt</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5">
                  <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Interactive Tours</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { onOpenChange(false); startTutorial('agent-nudge'); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-blue-400 hover:bg-blue-400/10 transition-colors"
                    >
                      <span>The Agent Bridge</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => { onOpenChange(false); startTutorial('vibe-master'); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-purple-400 hover:bg-purple-400/10 transition-colors"
                    >
                      <span>The Vibe Master</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 bg-muted/20 border-t border-white/5">
              <a
                href="https://github.com/JPaulGrayson/LogicArt"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-white transition-colors"
              >
                <Github className="w-3 h-3" />
                View Source on GitHub
              </a>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
            <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0e0e11]/50 backdrop-blur-md flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold tracking-tight capitalize">
                  {VISIBLE_DOCS.find(d => d.id === activeSection)?.title ||
                    (activeSection === 'shortcuts' ? 'Shortcuts' :
                      activeSection === 'about' ? 'About LogicArt' :
                        activeSection === 'gallery' ? 'Showcase Gallery' : '')}
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-white">
                Close
              </Button>
            </header>

            <div className="flex-1 overflow-auto">
              <div key={activeSection} className="px-6 py-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
      <span className="text-sm text-slate-300">{description}</span>
      <kbd className="px-2 py-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded shadow-sm font-mono">
        {shortcut}
      </kbd>
    </div>
  );
}
