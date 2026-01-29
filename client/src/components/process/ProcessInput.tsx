/**
 * ProcessInput - Natural language process description input
 * Supports standard BPMN generation and Ralph Wiggum mode for AI task planning
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, FileText, Loader2, ChevronDown, ChevronUp, Info, Repeat, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PLACEHOLDER_TEXT = `Describe your process in plain English...

Example: "When a customer orders food, the waiter takes the order, kitchen prepares it, waiter delivers it, customer pays."`;

const RALPH_PLACEHOLDER_TEXT = `Describe your AI coding task...

Example: "Migrate our Express API to TypeScript, add comprehensive test coverage, and update all route handlers to use async/await patterns."`;

interface ProcessInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  className?: string;
  ralphMode?: boolean;
  onRalphModeChange?: (enabled: boolean) => void;
  onExportRalph?: () => void;
  ralphArtifacts?: RalphArtifacts | null;
}

export interface RalphArtifacts {
  prompt: string;
  plan: string;
  progress: string;
  completionCriteria: string[];
}

export function ProcessInput({ 
  value, 
  onChange, 
  onGenerate, 
  isGenerating = false, 
  className,
  ralphMode = false,
  onRalphModeChange,
  onExportRalph,
  ralphArtifacts
}: ProcessInputProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {ralphMode ? (
            <Repeat className="w-4 h-4 text-amber-500" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold">
            {ralphMode ? 'Ralph Mode' : 'Process Description'}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {ralphArtifacts && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={onExportRalph}
              data-testid="button-export-ralph"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className={cn(
              "h-7 px-3",
              ralphMode 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                : "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            )}
            onClick={onGenerate}
            disabled={isGenerating || !value.trim()}
            data-testid="button-generate"
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating...</>
            ) : ralphMode ? (
              <><Repeat className="w-3.5 h-3.5 mr-1.5" />Generate Ralph Plan</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate Diagram</>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border">
        <Switch
          id="ralph-mode"
          checked={ralphMode}
          onCheckedChange={onRalphModeChange}
          data-testid="switch-ralph-mode"
        />
        <Label htmlFor="ralph-mode" className="text-xs cursor-pointer flex items-center gap-2">
          <span className={ralphMode ? 'text-amber-400 font-medium' : 'text-muted-foreground'}>
            Ralph Wiggum Mode
          </span>
          {ralphMode && (
            <span className="text-[10px] text-muted-foreground">(AI Task Planner)</span>
          )}
        </Label>
      </div>
      
      <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <CollapsibleTrigger asChild>
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
            data-testid="button-toggle-help"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{ralphMode ? 'How to use Ralph Mode' : 'How to describe your process'}</span>
            {isHelpOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-3 bg-muted/30 border-b border-border text-xs space-y-2">
            {ralphMode ? (
              <>
                <p className="font-medium text-foreground">Ralph Wiggum Technique:</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Describe your <span className="text-amber-400">coding task</span> in detail</li>
                  <li>Include specific <span className="text-amber-400">acceptance criteria</span></li>
                  <li>Mention technologies and <span className="text-cyan-400">constraints</span></li>
                  <li>AI generates: <span className="text-green-400">PROMPT.md, plan.md, progress.md</span></li>
                </ul>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Named after the "while loop" technique for persistent AI coding agents.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">Tips for best results:</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Start with the <span className="text-cyan-400">trigger event</span></li>
                  <li>List each step with <span className="text-cyan-400">who performs it</span></li>
                  <li>Include <span className="text-amber-400">decision points</span> using "if/then"</li>
                  <li>End with the <span className="text-red-400">final outcome(s)</span></li>
                </ul>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div className="flex-1 p-4">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={ralphMode ? RALPH_PLACEHOLDER_TEXT : PLACEHOLDER_TEXT}
          className={cn(
            'h-full min-h-[200px] resize-none', 
            'bg-background/50 border-border', 
            'placeholder:text-muted-foreground/50', 
            ralphMode ? 'focus:ring-1 focus:ring-amber-500/50' : 'focus:ring-1 focus:ring-cyan-500/50'
          )}
          data-testid="textarea-description"
        />
      </div>
      
      <div className="px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.length > 0 ? `${value.split('\n').filter(l => l.trim()).length} lines` : 'Describe your process above'}</span>
          <span className="text-[10px] opacity-60">Powered by AI</span>
        </div>
      </div>
    </div>
  );
}
