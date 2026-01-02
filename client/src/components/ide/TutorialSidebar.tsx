import React from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const TutorialSidebar: React.FC = () => {
    const { activeTutorial, currentStepIndex, nextStep, prevStep, endTutorial, isTutorialActive } = useTutorial();

    if (!isTutorialActive || !activeTutorial) return null;

    const currentStep = activeTutorial.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / activeTutorial.steps.length) * 100;

    return (
        <div className="border-b border-primary/30 bg-primary/10 p-4 space-y-3 animate-in slide-in-from-top duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Active Tour</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10 text-primary" onClick={endTutorial}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">{currentStep.title}</h4>
                <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1 flex-1" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {currentStepIndex + 1} / {activeTutorial.steps.length}
                    </span>
                </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.content}
            </p>

            <div className="flex gap-2 pt-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] flex-1"
                    onClick={prevStep}
                    disabled={currentStepIndex === 0}
                >
                    <ChevronLeft className="w-3 h-3 mr-1" /> Back
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-[10px] flex-1 bg-primary text-primary-foreground"
                    onClick={nextStep}
                >
                    {currentStepIndex === activeTutorial.steps.length - 1 ? (
                        <>Complete <CheckCircle2 className="w-3 h-3 ml-1" /></>
                    ) : (
                        <>Next <ChevronRight className="w-3 h-3 ml-1" /></>
                    )}
                </Button>
            </div>
        </div>
    );
};
