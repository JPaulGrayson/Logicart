import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
    chart: string;
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

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            if (!chart) return;
            
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Failed to render diagram');
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="flex justify-center py-8 bg-red-500/10 rounded-xl my-6 text-red-400 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div 
            className="flex justify-center py-8 bg-muted/20 rounded-xl my-6 overflow-x-auto"
            ref={ref}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default Mermaid;
