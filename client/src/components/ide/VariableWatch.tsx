import React from 'react';
import { ExecutionState } from '@/lib/interpreter';

interface VariableWatchProps {
  state: ExecutionState | null;
}

export function VariableWatch({ state }: VariableWatchProps) {
  if (!state || Object.keys(state.variables).length === 0) {
    return (
      <div className="h-full w-full bg-sidebar border-l border-border flex flex-col">
        <div className="h-10 border-b border-border flex items-center px-4 bg-sidebar/50 backdrop-blur text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Variables
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No variables yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-sidebar border-l border-border flex flex-col">
      <div className="h-10 border-b border-border flex items-center px-4 bg-sidebar/50 backdrop-blur text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Variables
      </div>
      <div className="flex-1 overflow-auto p-4">
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
      </div>
    </div>
  );
}
