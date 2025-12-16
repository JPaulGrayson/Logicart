import React, { useState } from 'react';
import { ExecutionState } from '@/lib/interpreter';
import { VariableHistory, type VariableSnapshot } from './VariableHistory';
import { Clock, Variable } from 'lucide-react';

interface VariableWatchProps {
  state: ExecutionState | null;
  history?: VariableSnapshot[];
  currentStep?: number;
  onJumpToStep?: (step: number) => void;
}

export function VariableWatch({ state, history = [], currentStep = 0, onJumpToStep }: VariableWatchProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const hasVariables = state && Object.keys(state.variables).length > 0;
  const hasHistory = history.length > 0;

  return (
    <div className="h-full w-full bg-sidebar border-l border-border flex flex-col">
      <div className="h-10 border-b border-border flex items-center bg-sidebar/50 backdrop-blur">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
            activeTab === 'current' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-current-variables"
        >
          <Variable className="w-3 h-3" />
          Current
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
            activeTab === 'history' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-variable-history"
        >
          <Clock className="w-3 h-3" />
          History
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'current' ? (
          hasVariables && state ? (
            <>
              <div className="space-y-3">
                {Object.entries(state.variables).map(([name, value]) => (
                  <div key={name} className="flex flex-col gap-1" data-testid={`variable-${name}`}>
                    <div className="text-xs font-mono text-primary font-semibold">{name}</div>
                    <div className="text-sm font-mono text-foreground bg-card px-3 py-2 rounded border border-border">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
              
              {state.callStack.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                    Call Stack
                  </div>
                  <div className="space-y-2">
                    {state.callStack.map((frame, idx) => (
                      <div 
                        key={idx} 
                        className="text-xs font-mono bg-card px-3 py-2 rounded border border-border"
                        data-testid={`callstack-${idx}`}
                      >
                        {frame.functionName}()
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No variables yet
            </div>
          )
        ) : (
          <VariableHistory 
            history={history} 
            currentStep={currentStep} 
            onJumpToStep={onJumpToStep} 
          />
        )}
      </div>
    </div>
  );
}
