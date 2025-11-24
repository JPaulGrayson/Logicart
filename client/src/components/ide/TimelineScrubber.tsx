/**
 * Timeline Scrubber Component (Premium Feature - Time Travel)
 * 
 * Visual timeline for navigating through execution history
 * Allows scrubbing through steps and jumping to specific points
 */

import { useState } from 'react';
import { Clock, Bookmark } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface TimelineBookmark {
  step: number;
  label: string;
}

interface TimelineScrubberProps {
  currentStep: number;
  totalSteps: number;
  onJumpToStep: (step: number) => void;
  bookmarks?: TimelineBookmark[];
  onAddBookmark?: (step: number) => void;
  onRemoveBookmark?: (step: number) => void;
  disabled?: boolean;
}

export function TimelineScrubber({
  currentStep,
  totalSteps,
  onJumpToStep,
  bookmarks = [],
  onAddBookmark,
  onRemoveBookmark,
  disabled = false,
}: TimelineScrubberProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSliderChange = (values: number[]) => {
    const step = values[0];
    if (step !== currentStep) {
      onJumpToStep(step);
    }
  };

  const hasBookmarkAtStep = (step: number) => {
    return bookmarks.some(b => b.step === step);
  };

  const toggleBookmark = () => {
    if (hasBookmarkAtStep(currentStep)) {
      onRemoveBookmark?.(currentStep);
    } else {
      onAddBookmark?.(currentStep);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Timeline</span>
        <span className="text-xs text-muted-foreground font-mono ml-auto">
          Step {currentStep} of {totalSteps}
        </span>
        
        {onAddBookmark && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBookmark}
            disabled={disabled || totalSteps === 0}
            className={hasBookmarkAtStep(currentStep) ? 'text-primary' : ''}
            data-testid="button-toggle-bookmark"
            title={hasBookmarkAtStep(currentStep) ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`w-4 h-4 ${hasBookmarkAtStep(currentStep) ? 'fill-primary' : ''}`} />
          </Button>
        )}
      </div>

      <div className="relative">
        {/* Timeline slider */}
        <Slider
          value={[currentStep]}
          min={0}
          max={Math.max(totalSteps, 1)}
          step={1}
          onValueChange={handleSliderChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          disabled={disabled || totalSteps === 0}
          className="w-full"
          data-testid="timeline-slider"
        />

        {/* Bookmark markers */}
        {bookmarks.length > 0 && totalSteps > 0 && (
          <div className="absolute -top-2 left-0 right-0 h-4 pointer-events-none">
            {bookmarks.map((bookmark, idx) => {
              const position = (bookmark.step / totalSteps) * 100;
              return (
                <div
                  key={idx}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                  title={bookmark.label}
                >
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-lg" />
                </div>
              );
            })}
          </div>
        )}

        {/* Step markers every 5 steps for visual reference */}
        {totalSteps > 10 && (
          <div className="absolute top-6 left-0 right-0 h-3 pointer-events-none">
            {Array.from({ length: Math.floor(totalSteps / 5) + 1 }, (_, i) => i * 5).map((step) => {
              if (step > totalSteps) return null;
              const position = (step / totalSteps) * 100;
              return (
                <div
                  key={step}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-px h-2 bg-muted" />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">{step}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookmark list */}
      {bookmarks.length > 0 && (
        <div className="mt-8 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Bookmarks</div>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map((bookmark, idx) => (
              <button
                key={idx}
                onClick={() => onJumpToStep(bookmark.step)}
                className={`
                  px-2 py-1 text-xs rounded border transition-colors
                  ${bookmark.step === currentStep 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card hover:bg-accent border-border'
                  }
                `}
                data-testid={`bookmark-${bookmark.step}`}
              >
                <Bookmark className="w-3 h-3 inline mr-1" />
                Step {bookmark.step}
                {bookmark.label && `: ${bookmark.label}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
