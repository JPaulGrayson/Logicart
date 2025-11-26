/**
 * Runtime Overlay Component (Premium Feature)
 * 
 * Floating toolbar for execution controls that persists across scrolling
 * Based on Antigravity's overlay.js pattern
 */

import { Play, Pause, SkipForward, SkipBack, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RuntimeOverlayProps {
  isPlaying: boolean;
  canStep: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBackward?: () => void;
  onReset: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
}

export function RuntimeOverlay({
  isPlaying,
  canStep,
  currentStep,
  totalSteps,
  speed,
  onPlay,
  onPause,
  onStep,
  onStepBackward,
  onReset,
  onStop,
  onSpeedChange,
}: RuntimeOverlayProps) {
  const canStepBack = onStepBackward && currentStep > 0;
  const speedOptions = [
    { value: 0.25, label: '0.25×', premium: true },
    { value: 0.5, label: '0.5×', premium: false },
    { value: 1, label: '1×', premium: false },
    { value: 2, label: '2×', premium: false },
    { value: 3, label: '3×', premium: true },
    { value: 5, label: '5×', premium: true },
    { value: 10, label: '10×', premium: true },
  ];

  return (
    <div 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur border-2 border-purple-500/30 rounded-lg shadow-xl z-40 px-3 py-2"
      data-testid="runtime-overlay"
    >
      {/* Label to clarify this is a separate control panel */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-500/20">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
          <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wide">Runtime Controls</span>
        </div>
        <span className="text-[9px] text-muted-foreground/60">(Premium)</span>
      </div>
      
      {/* Compact floating controls for when sidebar is hidden/scrolled away */}
      <div className="flex items-center gap-2 text-xs">
        {/* Essential execution controls - compact icon buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant={isPlaying ? "default" : "outline"}
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!canStep && !isPlaying}
            className="h-7 w-7 p-0"
            data-testid={isPlaying ? "overlay-button-pause" : "overlay-button-play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          
          {onStepBackward && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStepBackward}
              disabled={!canStepBack || isPlaying}
              className="h-7 w-7 p-0"
              data-testid="overlay-button-step-backward"
              title="Step Backward (Time Travel)"
            >
              <SkipBack className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onStep}
            disabled={!canStep || isPlaying}
            className="h-7 w-7 p-0"
            data-testid="overlay-button-step"
            title="Step Forward"
          >
            <SkipForward className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!canStep}
            className="h-7 w-7 p-0"
            data-testid="overlay-button-reset"
            title="Reset"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            disabled={!canStep}
            className="h-7 w-7 p-0"
            data-testid="overlay-button-stop"
            title="Stop"
          >
            <Square className="w-3 h-3" />
          </Button>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Progress indicator */}
        <div className="text-xs text-muted-foreground font-mono">
          {currentStep}/{totalSteps}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Compact speed selector dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-background border border-border rounded px-1.5 py-0.5 text-xs"
            data-testid="overlay-speed-select"
          >
            {speedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}{option.premium ? ' ⚡' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
