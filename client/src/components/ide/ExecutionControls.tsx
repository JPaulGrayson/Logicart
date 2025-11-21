import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, ChevronRight } from 'lucide-react';

interface ExecutionControlsProps {
  isPlaying: boolean;
  canStep: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  progress?: { current: number; total: number };
}

export function ExecutionControls({
  isPlaying,
  canStep,
  onPlay,
  onPause,
  onStepForward,
  onReset,
  progress
}: ExecutionControlsProps) {
  return (
    <div className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center px-6 justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground mr-4">Execution Controls</h2>
        
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!canStep}
          className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid={isPlaying ? "button-pause" : "button-play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        
        <button
          onClick={onStepForward}
          disabled={!canStep || isPlaying}
          className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-step"
          title="Step Forward"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <button
          onClick={onReset}
          className="p-2 rounded hover:bg-accent transition-colors"
          data-testid="button-reset"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
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
