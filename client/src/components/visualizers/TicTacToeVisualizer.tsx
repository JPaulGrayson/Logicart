import React from 'react';
import { cn } from '@/lib/utils';

interface TicTacToeVisualizerProps {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  highlightedCell: number | null;
  evaluatingCell: number | null;
  evaluationScore: number | null;
  className?: string;
}

export function TicTacToeVisualizer({
  board,
  currentPlayer,
  winner,
  highlightedCell,
  evaluatingCell,
  evaluationScore,
  className
}: TicTacToeVisualizerProps) {
  const getWinningLine = (): number[] => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return pattern;
      }
    }
    return [];
  };
  
  const winningLine = winner && winner !== 'tie' ? getWinningLine() : [];
  
  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-card rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {winner ? (
            winner === 'tie' ? 'Game Over - Tie!' : `Winner: ${winner}`
          ) : (
            `Current Turn: ${currentPlayer}`
          )}
        </div>
        {evaluationScore !== null && (
          <div className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-1 rounded-full">
            <span className="text-xs text-muted-foreground">Score:</span>
            <span className={cn(
              "font-mono font-bold",
              evaluationScore > 0 ? "text-emerald-400" : evaluationScore < 0 ? "text-red-400" : "text-muted-foreground"
            )}>
              {evaluationScore}
            </span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-1 aspect-square max-w-[180px] mx-auto">
        {board.map((cell, index) => {
          const isWinning = winningLine.includes(index);
          const isHighlighted = highlightedCell === index;
          const isEvaluating = evaluatingCell === index;
          
          return (
            <div
              key={index}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all",
                isWinning && "border-emerald-500 bg-emerald-500/20",
                isHighlighted && !isWinning && "border-yellow-500 bg-yellow-500/10",
                isEvaluating && !isWinning && "border-purple-500 bg-purple-500/10 animate-pulse",
                !isWinning && !isHighlighted && !isEvaluating && "border-border bg-muted/30",
                cell === 'X' && "text-blue-400",
                cell === 'O' && "text-red-400"
              )}
              data-testid={`ttt-cell-${index}`}
            >
              {cell || ''}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-400/50" />
          <span>X (Human)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-400/50" />
          <span>O (AI)</span>
        </div>
      </div>
    </div>
  );
}
