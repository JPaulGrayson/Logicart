import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Terminal, Wand2, Check, ExternalLink, Sparkles, Code2 } from 'lucide-react';
import { toast } from 'sonner';

const SCRIPT_TAG = `<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=MyApp&mode=push&hideBadge=true"></script>`;

const AGENT_PROMPT = `Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME&mode=push&hideBadge=true"></script>

2. Create a visualization handler:
const handleVisualize = (code, name) => {
  if (window.LogiGo?.visualize) {
    window.LogiGo.visualize(code, name);
  }
};

3. Call handleVisualize with CLEAN algorithm code:
handleVisualize(algorithms[selectedAlgorithm], selectedAlgorithm);

4. Connect the handler to a "View Flowchart" button.

5. TEST: Click the button - LogiGo should open with a clean flowchart.

URL params: mode=push disables auto-discovery, hideBadge=true hides the floating badge.`;

export function ConnectWizard() {
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    const copyScript = () => {
        navigator.clipboard.writeText(SCRIPT_TAG);
        setCopiedScript(true);
        toast.success('Script tag copied to clipboard!');
        setTimeout(() => setCopiedScript(false), 2000);
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(AGENT_PROMPT);
        setCopiedPrompt(true);
        toast.success('Agent prompt copied!');
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
                    <Wand2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Integration Wizard</h2>
                    <p className="text-muted-foreground text-sm">Connect your external app to LogiGo in seconds.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Step 1 */}
                <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                            The Bridge Script
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Add this single line to your app's HTML <code className="bg-primary/10 px-1 rounded">&lt;head&gt;</code> tag.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative group">
                            <pre className="p-4 bg-muted/80 rounded-xl overflow-x-auto text-[13px] font-mono border border-white/5 shadow-inner">
                                <code className="text-primary">{SCRIPT_TAG}</code>
                            </pre>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                onClick={copyScript}
                            >
                                {copiedScript ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                {copiedScript ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-white/5 p-2 rounded-lg">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Automatically sets up execution mirroring and AI grounding protocols.</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">2</span>
                            Ask AI Agent to Integrate
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Copy this prompt and paste it into your AI agent (Replit Agent, Cursor, or GPT-4o).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative group">
                            <div className="p-4 bg-muted/80 rounded-xl text-[13px] leading-relaxed border border-white/5 italic text-muted-foreground shadow-inner whitespace-pre-wrap">
                                "{AGENT_PROMPT}"
                            </div>
                            <Button
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
                                onClick={copyPrompt}
                            >
                                {copiedPrompt ? <Check className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {copiedPrompt ? 'Prompt Copied!' : 'Copy Prompt for Replit Agent'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-white/5 opacity-80">
                <div className="flex items-center gap-2 text-xs">
                    <Terminal className="w-4 h-4" />
                    <span>Manual setup? View the complete <a href="/docs/remote-sync" className="text-primary hover:underline font-medium">Remote Sync Guide</a></span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
            </div>
        </div>
    );
}
