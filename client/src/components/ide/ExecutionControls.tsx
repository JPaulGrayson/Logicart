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
    <div className="border-b border-border bg-card/50 backdrop-blur p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Execution</h2>
        {progress && progress.total > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {progress.current}/{progress.total}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 bg-muted/50 rounded p-0.5">
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!canStep}
            className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={isPlaying ? "button-pause" : "button-play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
          
          {hasTimeTravel && onStepBackward && (
            <button
              onClick={onStepBackward}
              disabled={!canStepBack || isPlaying}
              className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-step-backward"
              title="Step Backward (Time Travel)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          
          <button
            onClick={onStepForward}
            disabled={!canStep || isPlaying}
            className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-step"
            title="Step Forward"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onReset}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            data-testid="button-reset"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onStop}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            data-testid="button-stop"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onLoopToggle}
          className={`p-1.5 rounded transition-colors ${
            loop 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'hover:bg-accent bg-muted/50'
          }`}
          data-testid="button-loop"
          title={loop ? "Loop enabled" : "Loop disabled"}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Speed:</span>
          <Select
            value={speed.toString()}
            onValueChange={(value) => onSpeedChange(parseFloat(value))}
          >
            <SelectTrigger className="w-[70px] h-7 text-[10px]" data-testid="select-speed">
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
    </div>
  );
}
