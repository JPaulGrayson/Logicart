import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
    chart: string;
    interactive?: boolean;
}

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    flowchart: {
        htmlLabels: true,
        curve: 'basis',
    },
});

const Mermaid: React.FC<MermaidProps> = ({ chart, interactive = true }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [elements, setElements] = useState<SVGElement[]>([]);
    const playIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            if (!chart) return;
            
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
                setCurrentStep(-1);
                setIsPlaying(false);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Failed to render diagram');
            }
        };

        renderChart();
    }, [chart]);

    useEffect(() => {
        if (!ref.current || !svg) return;
        
        const svgElement = ref.current.querySelector('svg');
        if (!svgElement) return;
        
        svgElement.setAttribute('focusable', 'false');
        svgElement.style.outline = 'none';
        
        const animatableElements: SVGElement[] = [];
        
        const messageLines = svgElement.querySelectorAll('.messageLine0, .messageLine1');
        const messageTexts = svgElement.querySelectorAll('.messageText');
        const actors = svgElement.querySelectorAll('.actor');
        const flowNodes = svgElement.querySelectorAll('.node');
        const flowEdges = svgElement.querySelectorAll('.edgePath');
        
        messageLines.forEach(el => animatableElements.push(el as SVGElement));
        messageTexts.forEach(el => animatableElements.push(el as SVGElement));
        actors.forEach(el => animatableElements.push(el as SVGElement));
        flowNodes.forEach(el => animatableElements.push(el as SVGElement));
        flowEdges.forEach(el => animatableElements.push(el as SVGElement));
        
        setElements(animatableElements);
    }, [svg]);

    const highlightStep = useCallback((step: number) => {
        if (!ref.current) return;
        
        const svgElement = ref.current.querySelector('svg');
        if (!svgElement) return;
        
        const allHighlightable = svgElement.querySelectorAll('.messageLine0, .messageLine1, .messageText, .node, .edgePath');
        allHighlightable.forEach(el => {
            (el as SVGElement).style.opacity = '0.3';
            (el as SVGElement).style.transition = 'opacity 0.3s ease';
        });
        
        const actors = svgElement.querySelectorAll('.actor, .actor-line');
        actors.forEach(el => {
            (el as SVGElement).style.opacity = '1';
        });
        
        const messageLines = svgElement.querySelectorAll('.messageLine0, .messageLine1');
        const messageTexts = svgElement.querySelectorAll('.messageText');
        
        if (step >= 0 && step < messageLines.length) {
            for (let i = 0; i <= step; i++) {
                if (messageLines[i]) {
                    (messageLines[i] as SVGElement).style.opacity = '1';
                }
                if (messageTexts[i]) {
                    (messageTexts[i] as SVGElement).style.opacity = '1';
                }
            }
            
            if (messageLines[step]) {
                (messageLines[step] as SVGElement).style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
            }
            if (messageTexts[step]) {
                (messageTexts[step] as SVGElement).style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
            }
        }
    }, []);

    const resetHighlights = useCallback(() => {
        if (!ref.current) return;
        
        const svgElement = ref.current.querySelector('svg');
        if (!svgElement) return;
        
        const allElements = svgElement.querySelectorAll('*');
        allElements.forEach(el => {
            (el as SVGElement).style.opacity = '';
            (el as SVGElement).style.filter = '';
            (el as SVGElement).style.transition = '';
        });
    }, []);

    const getStepCount = useCallback(() => {
        if (!ref.current) return 0;
        const svgElement = ref.current.querySelector('svg');
        if (!svgElement) return 0;
        return svgElement.querySelectorAll('.messageLine0, .messageLine1').length;
    }, []);

    const stepForward = useCallback(() => {
        const stepCount = getStepCount();
        if (stepCount === 0) return;
        
        setCurrentStep(prev => {
            const next = prev >= stepCount - 1 ? -1 : prev + 1;
            if (next === -1) {
                resetHighlights();
            } else {
                highlightStep(next);
            }
            return next;
        });
    }, [getStepCount, highlightStep, resetHighlights]);

    const togglePlay = useCallback(() => {
        const stepCount = getStepCount();
        if (stepCount === 0) return;
        
        if (isPlaying) {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
                playIntervalRef.current = null;
            }
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            stepForward();
            playIntervalRef.current = window.setInterval(() => {
                setCurrentStep(prev => {
                    const next = prev >= stepCount - 1 ? -1 : prev + 1;
                    if (next === -1) {
                        resetHighlights();
                        if (playIntervalRef.current) {
                            clearInterval(playIntervalRef.current);
                            playIntervalRef.current = null;
                        }
                        setIsPlaying(false);
                    } else {
                        highlightStep(next);
                    }
                    return next;
                });
            }, 1000);
        }
    }, [isPlaying, stepForward, getStepCount, highlightStep, resetHighlights]);

    useEffect(() => {
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, []);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!interactive) return;
        
        if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
            event.preventDefault();
            event.stopPropagation();
            togglePlay();
        } else if (event.key === 's' || event.key === 'S' || event.key === 'ArrowRight') {
            event.preventDefault();
            event.stopPropagation();
            if (isPlaying) {
                if (playIntervalRef.current) {
                    clearInterval(playIntervalRef.current);
                    playIntervalRef.current = null;
                }
                setIsPlaying(false);
            }
            stepForward();
        } else if (event.key === 'r' || event.key === 'R') {
            event.preventDefault();
            event.stopPropagation();
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
                playIntervalRef.current = null;
            }
            setIsPlaying(false);
            setCurrentStep(-1);
            resetHighlights();
        }
    }, [interactive, togglePlay, stepForward, resetHighlights, isPlaying]);

    const handleClick = useCallback(() => {
        if (interactive && ref.current) {
            ref.current.focus();
        }
    }, [interactive]);

    if (error) {
        return (
            <div className="flex justify-center py-8 bg-red-500/10 rounded-xl my-6 text-red-400 text-sm">
                {error}
            </div>
        );
    }

    const stepCount = elements.length > 0 ? getStepCount() : 0;

    return (
        <div className="relative my-6">
            <div 
                className="flex justify-center py-8 bg-muted/20 rounded-xl overflow-x-auto outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
                ref={ref}
                tabIndex={interactive ? 0 : -1}
                onKeyDown={handleKeyDown}
                onClick={handleClick}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            {interactive && stepCount > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                    <span className="opacity-60">
                        {currentStep === -1 ? 'Click & press Space' : `Step ${currentStep + 1}/${stepCount}`}
                    </span>
                    {isPlaying && (
                        <span className="flex items-center gap-1 text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Playing
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default Mermaid;
