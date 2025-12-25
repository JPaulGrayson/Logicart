import React from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Repeat, Square } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { features } from '@/lib/features';

interface ExecutionControlsProps {
  isPlaying: boolean;
  canStep: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward?: () => void;
  onReset: () => void;
  onStop: () => void;
  progress?: { current: number; total: number };
  speed: number;
  onSpeedChange: (speed: number) => void;
  loop: boolean;
  onLoopToggle: () => void;
}

interface SpeedOption {
  value: number;
  label: string;
  premium?: boolean;
}

const SPEED_OPTIONS: SpeedOption[] = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
  { value: 20, label: '20x' },
];

export function ExecutionControls({
  isPlaying,
  canStep,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onStop,
  progress,
  speed,
  onSpeedChange,
  loop,
  onLoopToggle
}: ExecutionControlsProps) {
  const hasTimeTravel = features.hasFeature('timeTravel');
  const speedOptions = SPEED_OPTIONS;
  const canStepBack = hasTimeTravel && progress && progress.current > 0;
  
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
          
          {hasTimeTravel && onStepBackward && (
            <button
              onClick={onStepBackward}
              disabled={!canStepBack || isPlaying}
              className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-step-backward"
              title="Step Backward (Time Travel)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          
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
          
          <button
            onClick={onStop}
            className="p-2 rounded hover:bg-accent transition-colors"
            data-testid="button-stop"
            title="Stop"
          >
            <Square className="w-4 h-4" />
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
          <span className="text-xs text-muted-foreground">
            Speed:
          </span>
          <Select
            value={speed.toString()}
            onValueChange={(value) => onSpeedChange(parseFloat(value))}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs" data-testid="select-speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {speedOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value.toString()}
                  data-testid={`option-speed-${option.value}`}
                  className={option.premium ? 'font-semibold' : ''}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
