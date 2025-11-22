import React from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Repeat } from 'lucide-react';

interface ExecutionControlsProps {
  isPlaying: boolean;
  canStep: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  progress?: { current: number; total: number };
  speed: number;
  onSpeedChange: (speed: number) => void;
  loop: boolean;
  onLoopToggle: () => void;
}

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
];

export function ExecutionControls({
  isPlaying,
  canStep,
  onPlay,
  onPause,
  onStepForward,
  onReset,
  progress,
  speed,
  onSpeedChange,
  loop,
  onLoopToggle
}: ExecutionControlsProps) {
  return (
    <div className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center px-6 justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-foreground">Execution Controls</h2>
        
        <div className="flex items-center gap-1 bg-muted/50 rounded p-1">
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!canStep}
            className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={isPlaying ? "button-pause" : "button-play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={onStepForward}
            disabled={!canStep || isPlaying}
            className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-step"
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onReset}
            className="p-2 rounded hover:bg-accent transition-colors"
            data-testid="button-reset"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-border" />
        
        <button
          onClick={onLoopToggle}
          className={`p-2 rounded transition-colors ${
            loop 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'hover:bg-accent'
          }`}
          data-testid="button-loop"
          title={loop ? "Loop enabled" : "Loop disabled"}
        >
          <Repeat className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Speed:</span>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onSpeedChange(option.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  speed === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                data-testid={`button-speed-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {progress && progress.total > 0 && (
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground font-mono">
            Step {progress.current} / {progress.total}
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
