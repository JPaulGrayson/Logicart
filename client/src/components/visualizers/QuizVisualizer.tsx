import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface QuizVisualizerProps {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number | null;
  score: number;
  totalQuestions: number;
  currentQuestion: number;
  isAnswered: boolean;
  className?: string;
}

export function QuizVisualizer({
  question,
  options,
  correctAnswer,
  selectedAnswer,
  score,
  totalQuestions,
  currentQuestion,
  isAnswered,
  className
}: QuizVisualizerProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-card rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Question {currentQuestion + 1} of {totalQuestions}
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full">
          <span className="text-xs text-muted-foreground">Score:</span>
          <span className="font-mono font-bold text-primary" data-testid="quiz-score">{score}</span>
        </div>
      </div>
      
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
        />
      </div>
      
      <div 
        className="p-3 bg-muted/50 rounded-lg border border-border"
        data-testid="quiz-question"
      >
        <div className="text-sm font-medium">{question || 'Loading question...'}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = correctAnswer === index;
          const showResult = isAnswered;
          
          return (
            <div
              key={index}
              className={cn(
                "p-2 rounded-lg border-2 text-sm transition-all cursor-pointer hover:border-primary/50",
                !showResult && isSelected && "border-primary bg-primary/10",
                !showResult && !isSelected && "border-border",
                showResult && isCorrect && "border-emerald-500 bg-emerald-500/10",
                showResult && isSelected && !isCorrect && "border-red-500 bg-red-500/10"
              )}
              data-testid={`quiz-option-${index}`}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                  showResult && isCorrect ? "bg-emerald-500 text-white" : 
                  showResult && isSelected && !isCorrect ? "bg-red-500 text-white" : 
                  "bg-muted"
                )}>
                  {showResult && isCorrect ? <Check className="w-3 h-3" /> : 
                   showResult && isSelected && !isCorrect ? <X className="w-3 h-3" /> : 
                   String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1 truncate">{option}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
