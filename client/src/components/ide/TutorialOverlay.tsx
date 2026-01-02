import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

export const TutorialOverlay: React.FC = () => {
    const { activeTutorial, currentStepIndex, nextStep, prevStep, endTutorial } = useTutorial();
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activeTutorial) return;

        const currentStep = activeTutorial.steps[currentStepIndex];
        if (currentStep.targetId) {
            const updateRect = () => {
                const element = document.getElementById(currentStep.targetId!);
                if (element) {
                    setSpotlightRect(element.getBoundingClientRect());
                } else {
                    setSpotlightRect(null);
                }
            };

            updateRect();
            window.addEventListener('resize', updateRect);
            const observer = new MutationObserver(updateRect);
            observer.observe(document.body, { childList: true, subtree: true });

            return () => {
                window.removeEventListener('resize', updateRect);
                observer.disconnect();
            };
        } else {
            setSpotlightRect(null);
        }
    }, [activeTutorial, currentStepIndex]);

    if (!activeTutorial) return null;

    const currentStep = activeTutorial.steps[currentStepIndex];

    return createPortal(
        <div className="tutorial-overlay fixed inset-0 pointer-events-none z-[9999] flex flex-col items-center justify-end pb-16">
            {spotlightRect && (
                <div
                    ref={spotlightRef}
                    className="tutorial-spotlight absolute"
                    style={{
                        top: Math.max(8, spotlightRect.top - 8),
                        left: Math.max(8, spotlightRect.left - 8),
                        width: Math.min(window.innerWidth - 16, spotlightRect.width + 16),
                        // Force spotlight to stay 40px away from screen bottom to ensure visibility above Dock/Safari bars
                        height: Math.min(window.innerHeight - (spotlightRect.top - 8) - 40, spotlightRect.height + 16),
                        transition: spotlightRect ? 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
                        pointerEvents: 'auto',
                        opacity: spotlightRect ? 1 : 0
                    }}
                />
            )}

            <div
                className="tutorial-card pointer-events-auto w-[460px] shadow-[0_30px_70px_rgba(0,0,0,0.7)] border-primary/40 bg-card/98 backdrop-blur-2xl animate-in fade-in duration-500 ease-out"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold tracking-widest uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        Pathway: {activeTutorial.name}
                    </div>
                    <button
                        onClick={endTutorial}
                        className="p-1 hover:bg-primary/20 rounded-md transition-colors text-muted-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight leading-tight">{currentStep.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 min-h-[50px]">
                    {currentStep.content}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground font-medium">
                        Step {currentStepIndex + 1} of {activeTutorial.steps.length}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={prevStep}
                            disabled={currentStepIndex === 0}
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs font-semibold px-4"
                            onClick={nextStep}
                        >
                            {currentStepIndex === activeTutorial.steps.length - 1 ? 'Finish' : 'Next'}
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
