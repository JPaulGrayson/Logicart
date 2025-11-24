/**
 * Runtime Overlay Component (Premium Feature)
 * 
 * Floating toolbar for execution controls that persists across scrolling
 * Based on Antigravity's overlay.js pattern
 */

import { Play, Pause, SkipForward, RotateCcw, Square } from 'lucide-react';
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
  onReset,
  onStop,
  onSpeedChange,
}: RuntimeOverlayProps) {
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border-2 border-border rounded-xl shadow-2xl z-50 px-4 py-3"
      data-testid="runtime-overlay"
    >
      <div className="flex items-center gap-4">
        {/* Execution controls */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <Button
              variant="default"
              size="sm"
              onClick={onPlay}
              disabled={!canStep}
              className="gap-2"
              data-testid="overlay-button-play"
            >
              <Play className="w-4 h-4" />
              Play
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onPause}
              className="gap-2"
              data-testid="overlay-button-pause"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onStep}
            disabled={!canStep || isPlaying}
            data-testid="overlay-button-step"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!canStep}
            data-testid="overlay-button-reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            disabled={!canStep}
            data-testid="overlay-button-stop"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Progress indicator */}
        <div className="text-sm text-muted-foreground font-mono">
          Step {currentStep}/{totalSteps}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Speed control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Speed:</span>
          <div className="flex items-center gap-1">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSpeedChange(option.value)}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${speed === option.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent hover:bg-accent/80'
                  }
                `}
                data-testid={`overlay-speed-${option.value}`}
              >
                {option.label}
                {option.premium && <span className="ml-1">⚡</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
