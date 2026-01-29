/**
 * ProcessWorkbench - Main LogicProcess application page
 * Supports standard BPMN generation and Ralph Wiggum mode for AI task planning
 */

import React, { useState, useMemo, useCallback } from 'react';
import { SwimlaneDiagram } from '@/components/process/SwimlaneDiagram';
import { ProcessInput, type RalphArtifacts } from '@/components/process/ProcessInput';
import { RoleManager } from '@/components/process/RoleManager';
import type { ProcessMap, Role } from '@/types/process';
import { SAMPLE_REFUND_PROCESS, RALPH_LOOP_PROCESS } from '@/types/process';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Upload, Download, RotateCcw, Sparkles, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export default function ProcessWorkbench() {
  const { toast } = useToast();
  const [processMap, setProcessMap] = useState<ProcessMap>(SAMPLE_REFUND_PROCESS);
  const [processDescription, setProcessDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [ralphMode, setRalphMode] = useState(false);
  const [ralphArtifacts, setRalphArtifacts] = useState<RalphArtifacts | null>(null);
  
  const stepsPerRole = useMemo(() => {
    const counts = new Map<string, number>();
    processMap.steps.forEach(step => counts.set(step.roleId, (counts.get(step.roleId) || 0) + 1));
    return counts;
  }, [processMap.steps]);
  
  const handleRolesChange = useCallback((newRoles: Role[]) => {
    setProcessMap(prev => ({
      ...prev,
      roles: newRoles,
      steps: prev.steps.filter(s => newRoles.some(r => r.id === s.roleId)),
    }));
  }, []);
  
  const handleStepClick = useCallback((stepId: string) => {
    const step = processMap.steps.find(s => s.id === stepId);
    if (step) {
      toast({
        title: step.name,
        description: `Type: ${step.type} | Role: ${processMap.roles.find(r => r.id === step.roleId)?.name}`,
      });
    }
  }, [processMap, toast]);
  
  const handleGenerate = useCallback(async () => {
    if (!processDescription.trim()) {
      toast({ title: 'No Description', description: 'Please enter a description first.', variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    try {
      if (ralphMode) {
        const response = await fetch('/api/process/generate-ralph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: processDescription })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate Ralph plan');
        }
        
        if (data.success && data.artifacts) {
          setRalphArtifacts(data.artifacts);
          setProcessMap(RALPH_LOOP_PROCESS);
          toast({ 
            title: 'Ralph Plan Generated', 
            description: `Created PROMPT.md, plan.md, and progress.md with ${data.artifacts.completionCriteria.length} completion criteria.`
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        const response = await fetch('/api/process/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: processDescription })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate process map');
        }
        
        if (data.success && data.processMap) {
          setProcessMap(data.processMap);
          toast({ 
            title: 'Diagram Generated', 
            description: `Created "${data.processMap.name}" with ${data.processMap.roles.length} roles and ${data.processMap.steps.length} steps.`
          });
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({ 
        title: 'Generation Failed', 
        description: error instanceof Error ? error.message : 'Failed to generate',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [processDescription, toast, ralphMode]);
  
  const handleExportRalph = useCallback(async () => {
    if (!ralphArtifacts) return;
    
    try {
      const zip = new JSZip();
      zip.file('PROMPT.md', ralphArtifacts.prompt);
      zip.file('plan.md', ralphArtifacts.plan);
      zip.file('progress.md', ralphArtifacts.progress);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = 'ralph-artifacts.zip';
      link.href = URL.createObjectURL(blob);
      link.click();
      
      toast({ title: 'Export Complete', description: 'Downloaded PROMPT.md, plan.md, and progress.md' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not create zip file', variant: 'destructive' });
    }
  }, [ralphArtifacts, toast]);
  
  const handleRalphModeChange = useCallback((enabled: boolean) => {
    setRalphMode(enabled);
    setRalphArtifacts(null);
    if (enabled) {
      setProcessMap(RALPH_LOOP_PROCESS);
    } else {
      setProcessMap(SAMPLE_REFUND_PROCESS);
    }
  }, []);
  
  const handleReset = useCallback(() => {
    setProcessMap(SAMPLE_REFUND_PROCESS);
    setProcessDescription('');
    toast({ title: 'Reset Complete', description: 'Process map reset to sample data.' });
  }, [toast]);
  
  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(processMap, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${processMap.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [processMap]);
  
  const handleImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text()) as ProcessMap;
        if (!data.roles || !data.steps || !data.connections) throw new Error('Invalid format');
        setProcessMap(data);
        toast({ title: 'Import Successful', description: `Loaded "${data.name}" with ${data.steps.length} steps.` });
      } catch {
        toast({ title: 'Import Failed', description: 'Invalid JSON file format.', variant: 'destructive' });
      }
    };
    input.click();
  }, [toast]);
  
  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="flex-shrink-0 h-12 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">LogicProcess</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">BPMN Swimlane Mapping</p>
              </div>
            </div>
            <div className="h-6 w-px bg-border mx-2" />
            <span className="text-sm font-medium">{processMap.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8" onClick={handleImportJson} data-testid="button-import-json"><Upload className="w-4 h-4 mr-1.5" />Import</Button></TooltipTrigger><TooltipContent>Import from JSON</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8" onClick={handleExportJson} data-testid="button-export-json"><Download className="w-4 h-4 mr-1.5" />Export</Button></TooltipTrigger><TooltipContent>Export as JSON</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8" onClick={handleReset} data-testid="button-reset"><RotateCcw className="w-4 h-4 mr-1.5" />Reset</Button></TooltipTrigger><TooltipContent>Reset to sample</TooltipContent></Tooltip>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {leftPanelOpen && (
            <>
              <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                <ProcessInput 
                  value={processDescription} 
                  onChange={setProcessDescription} 
                  onGenerate={handleGenerate} 
                  isGenerating={isGenerating} 
                  ralphMode={ralphMode}
                  onRalphModeChange={handleRalphModeChange}
                  onExportRalph={handleExportRalph}
                  ralphArtifacts={ralphArtifacts}
                  className="h-full border-r border-border" 
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          <ResizablePanel defaultSize={50}>
            <div className="relative h-full">
              <div className="absolute top-2 left-2 z-20">
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-card/80 backdrop-blur" onClick={() => setLeftPanelOpen(!leftPanelOpen)} data-testid="button-toggle-left-panel">
                    {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger><TooltipContent side="right">{leftPanelOpen ? 'Hide input' : 'Show input'}</TooltipContent></Tooltip>
              </div>
              
              <div className="absolute top-2 right-2 z-20">
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-card/80 backdrop-blur" onClick={() => setRightPanelOpen(!rightPanelOpen)} data-testid="button-toggle-right-panel">
                    {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger><TooltipContent side="left">{rightPanelOpen ? 'Hide roles' : 'Show roles'}</TooltipContent></Tooltip>
              </div>
              
              <SwimlaneDiagram processMap={processMap} onStepClick={handleStepClick} className="h-full" />
            </div>
          </ResizablePanel>
          
          {rightPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
                <RoleManager roles={processMap.roles} onRolesChange={handleRolesChange} stepsPerRole={stepsPerRole} className="h-full border-l border-border" />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
