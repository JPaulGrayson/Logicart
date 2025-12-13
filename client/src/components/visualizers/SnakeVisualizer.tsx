import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface SnakeVisualizerProps {
  gridSize: number;
  snake: Position[];
  food: Position;
  score: number;
  gameOver: boolean;
  direction: 'up' | 'down' | 'left' | 'right';
  highlightedSegment: number | null;
  className?: string;
  onDirectionChange?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  interactive?: boolean;
}

export function SnakeVisualizer({
  gridSize,
  snake,
  food,
  score,
  gameOver,
  direction,
  highlightedSegment,
  className,
  onDirectionChange,
  interactive = false
}: SnakeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!interactive || !onDirectionChange) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'down') onDirectionChange('up');
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'up') onDirectionChange('down');
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'right') onDirectionChange('left');
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'left') onDirectionChange('right');
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactive, onDirectionChange, direction]);
  const isSnake = (x: number, y: number): number => {
    return snake.findIndex(s => s.x === x && s.y === y);
  };
  
  const isFood = (x: number, y: number): boolean => {
    return food.x === x && food.y === y;
  };
  
  const isHead = (x: number, y: number): boolean => {
    return snake.length > 0 && snake[0].x === x && snake[0].y === y;
  };
  
  const getDirectionArrow = () => {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
    }
  };
  
  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-card rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "text-xs px-2 py-0.5 rounded",
            gameOver ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
          )}>
            {gameOver ? 'Game Over' : 'Playing'}
          </div>
          <div className="text-sm font-mono">{getDirectionArrow()}</div>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full">
          <span className="text-xs text-muted-foreground">Score:</span>
          <span className="font-mono font-bold text-primary" data-testid="snake-score">{score}</span>
        </div>
      </div>
      
      <div 
        className="grid gap-0.5 aspect-square w-full max-w-[320px] mx-auto bg-muted/30 p-2 rounded-lg"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          const snakeIndex = isSnake(x, y);
          const isSnakeCell = snakeIndex !== -1;
          const isFoodCell = isFood(x, y);
          const isHeadCell = isHead(x, y);
          const isHighlighted = highlightedSegment !== null && snakeIndex === highlightedSegment;
          
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-sm transition-all",
                isFoodCell && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
                isHeadCell && "bg-emerald-400",
                isSnakeCell && !isHeadCell && "bg-emerald-600",
                isHighlighted && "ring-2 ring-yellow-500",
                !isSnakeCell && !isFoodCell && "bg-muted/50"
              )}
              data-testid={`snake-cell-${x}-${y}`}
            />
          );
        })}
      </div>
      
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-400" />
          <span>Head</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-600" />
          <span>Body</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Food</span>
        </div>
      </div>
      
      {interactive && (
        <div className="text-center text-xs text-muted-foreground mt-1" data-testid="snake-controls-hint">
          {gameOver ? (
            <span>Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Play</kbd> to restart</span>
          ) : (
            <span>Use <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Arrow Keys</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">WASD</kbd> to move</span>
          )}
        </div>
      )}
    </div>
  );
}
