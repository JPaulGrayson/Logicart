import React, { useState, useRef, useCallback } from 'react';
import { SortingVisualizer, PathfindingVisualizer } from '@/components/visualizers';
import { X, Play, RotateCcw, MapPin, Target, Blocks, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type VisualizerType = 'sorting' | 'pathfinding' | null;
export type GridEditMode = 'start' | 'end' | 'wall' | null;

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
  title?: string;
  sortingState?: SortingState;
  pathfindingState?: PathfindingState;
  onClose?: () => void;
  onReset?: () => void;
  onPlay?: () => void;
  isPlaying?: boolean;
  editMode?: GridEditMode;
  onEditModeChange?: (mode: GridEditMode) => void;
  onCellClick?: (node: { x: number; y: number }) => void;
  className?: string;
}

export function VisualizationPanel({
  type,
  title: customTitle,
  sortingState,
  pathfindingState,
  onClose,
  onReset,
  onPlay,
  isPlaying = false,
  editMode,
  onEditModeChange,
  onCellClick,
  className
}: VisualizationPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.initialX + deltaX,
      y: dragRef.current.initialY + deltaY
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  if (!type) return null;

  const defaultTitle = type === 'sorting' ? 'Sorting Visualization' : 'Pathfinding Visualization';
  const title = customTitle || defaultTitle;

  const toggleEditMode = (mode: GridEditMode) => {
    if (onEditModeChange) {
      onEditModeChange(editMode === mode ? null : mode);
    }
  };

  return (
    <div 
      className={cn("flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-xl", className)}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b border-border bg-accent/30",
          "cursor-grab select-none",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3 h-3 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
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
      
      {/* Edit mode toolbar for pathfinding */}
      {type === 'pathfinding' && onEditModeChange && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/30">
          <span className="text-[10px] text-muted-foreground mr-1">Edit:</span>
          <Button
            variant={editMode === 'start' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleEditMode('start')}
            className={cn("h-5 px-2 text-[10px] gap-1", editMode === 'start' && "bg-emerald-600 hover:bg-emerald-700")}
            data-testid="button-edit-start"
            title="Click a cell to set start point"
          >
            <MapPin className="w-2.5 h-2.5" />
            Start
          </Button>
          <Button
            variant={editMode === 'end' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleEditMode('end')}
            className={cn("h-5 px-2 text-[10px] gap-1", editMode === 'end' && "bg-red-600 hover:bg-red-700")}
            data-testid="button-edit-end"
            title="Click a cell to set end point"
          >
            <Target className="w-2.5 h-2.5" />
            End
          </Button>
          <Button
            variant={editMode === 'wall' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleEditMode('wall')}
            className={cn("h-5 px-2 text-[10px] gap-1", editMode === 'wall' && "bg-slate-600 hover:bg-slate-700")}
            data-testid="button-edit-wall"
            title="Click cells to add/remove walls"
          >
            <Blocks className="w-2.5 h-2.5" />
            Wall
          </Button>
          {editMode && (
            <span className="text-[9px] text-muted-foreground ml-2 italic">
              Click grid to place
            </span>
          )}
        </div>
      )}
      
      <div className="flex-1 p-2">
        {type === 'sorting' && sortingState && (
          <SortingVisualizer
            array={sortingState.array}
            activeIndices={sortingState.activeIndices}
            sortedIndices={sortingState.sortedIndices}
            swapIndices={sortingState.swapIndices}
            pivotIndex={sortingState.pivotIndex}
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
            onCellClick={onCellClick}
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
