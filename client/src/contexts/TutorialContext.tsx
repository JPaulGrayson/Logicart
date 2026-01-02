import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface TutorialStep {
    targetId?: string;
    title: string;
    content: string;
    actionRequired?: 'click' | 'input' | 'next';
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface Tutorial {
    id: string;
    name: string;
    description: string;
    steps: TutorialStep[];
}

interface TutorialContextType {
    activeTutorial: Tutorial | null;
    currentStepIndex: number;
    startTutorial: (tutorialId: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    endTutorial: () => void;
    isTutorialActive: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);

    // Load tutorials from data file (this will be implemented next)
    useEffect(() => {
        import('../lib/tutorials').then((mod) => {
            setTutorials(mod.tutorials);
        });
    }, []);

    const startTutorial = useCallback((tutorialId: string) => {
        const tutorial = tutorials.find(t => t.id === tutorialId);
        if (tutorial) {
            setActiveTutorial(tutorial);
            setCurrentStepIndex(0);
            document.body.classList.add('tutorial-active');
        }
    }, [tutorials]);

    const nextStep = useCallback(() => {
        if (activeTutorial && currentStepIndex < activeTutorial.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            endTutorial();
        }
    }, [activeTutorial, currentStepIndex]);

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    }, [currentStepIndex]);

    const endTutorial = useCallback(() => {
        setActiveTutorial(null);
        setCurrentStepIndex(0);
        document.body.classList.remove('tutorial-active');
    }, []);

    return (
        <TutorialContext.Provider value={{
            activeTutorial,
            currentStepIndex,
            startTutorial,
            nextStep,
            prevStep,
            endTutorial,
            isTutorialActive: !!activeTutorial
        }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
