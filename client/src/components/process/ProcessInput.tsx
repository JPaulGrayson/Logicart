/**
 * ProcessInput - Natural language process description input
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, FileText, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PLACEHOLDER_TEXT = `Describe your business process in natural language. For example:

"When a customer requests a refund:
1. Customer submits the refund request form
2. Support agent reviews the request
3. System validates the order details
4. If eligible, finance team approves and processes payment
5. If not eligible, support sends rejection notice
6. Customer receives confirmation"

Include:
• Who performs each step (roles/departments)
• Decision points (if/then conditions)
• The sequence of actions
• Any delays or waiting periods`;

interface ProcessInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  className?: string;
}

export function ProcessInput({ value, onChange, onGenerate, isGenerating = false, className }: ProcessInputProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Process Description</h3>
        </div>
        
        <Button
          variant="default"
          size="sm"
          className="h-7 px-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          onClick={onGenerate}
          disabled={isGenerating || !value.trim()}
        >
          {isGenerating ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate Diagram</>
          )}
        </Button>
      </div>
      
      <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:bg-accent/50 transition-colors">
            <Info className="w-3.5 h-3.5" />
            <span>How to describe your process</span>
            {isHelpOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-3 bg-muted/30 border-b border-border text-xs space-y-2">
            <p className="font-medium text-foreground">Tips for best results:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Start with the <span className="text-cyan-400">trigger event</span></li>
              <li>List each step with <span className="text-cyan-400">who performs it</span></li>
              <li>Include <span className="text-amber-400">decision points</span> using "if/then"</li>
              <li>End with the <span className="text-red-400">final outcome(s)</span></li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div className="flex-1 p-4">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER_TEXT}
          className={cn('h-full min-h-[200px] resize-none', 'bg-background/50 border-border', 'placeholder:text-muted-foreground/50', 'focus:ring-1 focus:ring-cyan-500/50')}
        />
      </div>
      
      <div className="px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.length > 0 ? `${value.split('\n').filter(l => l.trim()).length} lines` : 'Describe your process above'}</span>
          <span className="text-[10px] opacity-60">AI generation coming in Phase 2</span>
        </div>
      </div>
    </div>
  );
}
