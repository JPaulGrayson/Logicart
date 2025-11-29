import React from 'react';
import { SortingVisualizer, PathfindingVisualizer } from '@/components/visualizers';
import { X, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type VisualizerType = 'sorting' | 'pathfinding' | null;

interface SortingState {
  array: number[];
  activeIndices: number[];
  sortedIndices: number[];
  swapIndices: number[];
  pivotIndex?: number;
}

interface PathfindingState {
  rows: number;
  cols: number;
  startNode: { x: number; y: number };
  endNode: { x: number; y: number };
  wallNodes: { x: number; y: number }[];
  pathNodes: { x: number; y: number }[];
  visitedNodes: { x: number; y: number }[];
  currentNode?: { x: number; y: number };
}

interface VisualizationPanelProps {
  type: VisualizerType;
  sortingState?: SortingState;
  pathfindingState?: PathfindingState;
  onClose?: () => void;
  onReset?: () => void;
  onPlay?: () => void;
  isPlaying?: boolean;
  className?: string;
}

export function VisualizationPanel({
  type,
  sortingState,
  pathfindingState,
  onClose,
  onReset,
  onPlay,
  isPlaying = false,
  className
}: VisualizationPanelProps) {
  if (!type) return null;

  const title = type === 'sorting' ? 'Sorting Visualization' : 'Pathfinding Visualization';

  return (
    <div className={cn("flex flex-col bg-card border border-border rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/30">
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {onPlay && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPlay}
              className="h-6 w-6 p-0"
              data-testid="button-viz-play"
            >
              <Play className={cn("w-3 h-3", isPlaying && "text-primary")} />
            </Button>
          )}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 w-6 p-0"
              data-testid="button-viz-reset"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              data-testid="button-viz-close"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] p-2">
        {type === 'sorting' && sortingState && (
          <SortingVisualizer
            array={sortingState.array}
            activeIndices={sortingState.activeIndices}
            sortedIndices={sortingState.sortedIndices}
            swapIndices={sortingState.swapIndices}
            pivotIndex={sortingState.pivotIndex}
            className="h-full"
          />
        )}
        
        {type === 'pathfinding' && pathfindingState && (
          <PathfindingVisualizer
            rows={pathfindingState.rows}
            cols={pathfindingState.cols}
            startNode={pathfindingState.startNode}
            endNode={pathfindingState.endNode}
            wallNodes={pathfindingState.wallNodes}
            pathNodes={pathfindingState.pathNodes}
            visitedNodes={pathfindingState.visitedNodes}
            currentNode={pathfindingState.currentNode}
          />
        )}
      </div>
    </div>
  );
}

export const DEFAULT_SORTING_STATE: SortingState = {
  array: [64, 34, 25, 12, 22, 11, 90],
  activeIndices: [],
  sortedIndices: [],
  swapIndices: [],
};

export const DEFAULT_PATHFINDING_STATE: PathfindingState = {
  rows: 8,
  cols: 12,
  startNode: { x: 1, y: 1 },
  endNode: { x: 10, y: 6 },
  wallNodes: [
    { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
    { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 },
  ],
  pathNodes: [],
  visitedNodes: [],
};

export type { SortingState, PathfindingState };
