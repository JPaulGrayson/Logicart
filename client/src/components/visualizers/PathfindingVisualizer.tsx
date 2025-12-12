import React from 'react';
import { cn } from '@/lib/utils';

interface Node {
  x: number;
  y: number;
}

interface PathfindingVisualizerProps {
  rows?: number;
  cols?: number;
  startNode?: Node;
  endNode?: Node;
  wallNodes?: Node[];
  pathNodes?: Node[];
  visitedNodes?: Node[];
  currentNode?: Node;
  className?: string;
  onCellClick?: (node: Node) => void;
}

export function PathfindingVisualizer({
  rows = 10,
  cols = 15,
  startNode = { x: 0, y: 0 },
  endNode = { x: cols - 1, y: rows - 1 },
  wallNodes = [],
  pathNodes = [],
  visitedNodes = [],
  currentNode,
  className,
  onCellClick
}: PathfindingVisualizerProps) {
  const isWall = (x: number, y: number) => 
    wallNodes.some(n => n.x === x && n.y === y);
  
  const isPath = (x: number, y: number) => 
    pathNodes.some(n => n.x === x && n.y === y);
  
  const isVisited = (x: number, y: number) => 
    visitedNodes.some(n => n.x === x && n.y === y);
  
  const isStart = (x: number, y: number) => 
    startNode.x === x && startNode.y === y;
  
  const isEnd = (x: number, y: number) => 
    endNode.x === x && endNode.y === y;
  
  const isCurrent = (x: number, y: number) =>
    currentNode?.x === x && currentNode?.y === y;

  const getCellColor = (x: number, y: number) => {
    if (isStart(x, y)) return 'bg-emerald-500';
    if (isEnd(x, y)) return 'bg-red-500';
    if (isWall(x, y)) return 'bg-slate-700';
    if (isCurrent(x, y)) return 'bg-yellow-500';
    if (isPath(x, y)) return 'bg-blue-500';
    if (isVisited(x, y)) return 'bg-teal-400/40';
    return 'bg-card hover:bg-accent/50';
  };

  const grid = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      row.push(
        <div
          key={`${x}-${y}`}
          id={`cell-${x}-${y}`}
          className={cn(
            "logigo-highlight-target w-5 h-5 min-w-[20px] min-h-[20px] border border-border/50 rounded-sm transition-all duration-150 cursor-pointer",
            getCellColor(x, y)
          )}
          onClick={() => onCellClick?.({ x, y })}
          data-testid={`cell-${x}-${y}`}
        />
      );
    }
    grid.push(
      <div key={y} className="flex gap-0.5">
        {row}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5 p-4 bg-card rounded-lg border border-border w-full", className)}>
      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Start
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500" /> End
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-teal-400/40" /> Visited
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-blue-500" /> Path
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        {grid}
      </div>
    </div>
  );
}
