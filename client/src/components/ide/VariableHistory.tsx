import React, { useMemo } from 'react';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface VariableSnapshot {
  step: number;
  variables: Record<string, unknown>;
}

interface VariableHistoryProps {
  history: VariableSnapshot[];
  currentStep: number;
  onJumpToStep?: (step: number) => void;
}

export function VariableHistory({ history, currentStep, onJumpToStep }: VariableHistoryProps) {
  const variableNames = useMemo(() => {
    const names = new Set<string>();
    history.forEach(snapshot => {
      Object.keys(snapshot.variables).forEach(name => names.add(name));
    });
    return Array.from(names);
  }, [history]);

  const getVariableHistory = (name: string) => {
    return history.map(snapshot => ({
      step: snapshot.step,
      value: snapshot.variables[name]
    })).filter(entry => entry.value !== undefined);
  };

  const getTrend = (values: { step: number; value: unknown }[]) => {
    if (values.length < 2) return 'stable';
    const last = values[values.length - 1].value;
    const prev = values[values.length - 2].value;
    if (typeof last === 'number' && typeof prev === 'number') {
      if (last > prev) return 'up';
      if (last < prev) return 'down';
    }
    return 'stable';
  };

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      return '{...}';
    }
    return String(value);
  };

  if (history.length === 0 || variableNames.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No history yet</p>
        <p className="text-xs mt-1">Run execution to track variable changes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="variable-history">
      {variableNames.map(name => {
        const varHistory = getVariableHistory(name);
        const trend = getTrend(varHistory);
        const currentValue = varHistory.find(v => v.step === currentStep)?.value;

        return (
          <div key={name} className="border border-border rounded-md p-3 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-semibold text-primary">{name}</span>
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground">
                  {varHistory.length} changes
                </span>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {varHistory.map((entry, idx) => {
                const isNumeric = typeof entry.value === 'number';
                const isCurrent = entry.step === currentStep;
                
                return (
                  <button
                    key={idx}
                    onClick={() => onJumpToStep?.(entry.step)}
                    className={`
                      flex-shrink-0 px-2 py-1 rounded text-xs font-mono transition-all
                      ${isCurrent 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background' 
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }
                    `}
                    title={`Step ${entry.step}: ${formatValue(entry.value)}`}
                    data-testid={`history-${name}-step-${entry.step}`}
                  >
                    {formatValue(entry.value)}
                  </button>
                );
              })}
            </div>

            {typeof currentValue === 'number' && varHistory.length > 1 && (
              <div className="mt-2 h-8 flex items-end gap-px">
                {varHistory.map((entry, idx) => {
                  if (typeof entry.value !== 'number') return null;
                  const values = varHistory
                    .map(v => typeof v.value === 'number' ? v.value : 0);
                  const max = Math.max(...values);
                  const min = Math.min(...values);
                  const range = max - min || 1;
                  const height = ((entry.value - min) / range) * 100;
                  const isCurrent = entry.step === currentStep;

                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-all ${
                        isCurrent ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      style={{ height: `${Math.max(10, height)}%` }}
                      title={`Step ${entry.step}: ${entry.value}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
