import React from 'react';
import { parseCodeToFlow } from '@/lib/parser';

// Hardcoded duplicate of the default code from Workbench to ensure identical data
const TEST_CODE = `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  let sub = factorial(n - 1);
  return n * sub;
}`;

export default function TestMiniMap() {
  const { nodes } = parseCodeToFlow(TEST_CODE);

  // Calculate bounds to center the SVG
  const minX = Math.min(...nodes.map(n => n.position.x));
  const maxX = Math.max(...nodes.map(n => n.position.x + (n.style?.width || 150)));
  const minY = Math.min(...nodes.map(n => n.position.y));
  const maxY = Math.max(...nodes.map(n => n.position.y + (n.style?.height || 40)));

  const width = maxX - minX + 100;
  const height = maxY - minY + 100;

  return (
    <div className="w-screen h-screen bg-background flex items-center justify-center flex-col gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">MiniMap Rendering Test</h1>
        <p className="text-muted-foreground">
          This page manually renders the SVG content that should appear in the MiniMap.
          <br/>
          If this works, the issue is specific to React Flow's MiniMap component clipping or context.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 shadow-xl">
        <svg 
          width="400" 
          height="300" 
          viewBox={`${minX - 50} ${minY - 50} ${width} ${height}`}
          className="bg-card"
        >
          {/* Draw connections roughly (just direct lines for debugging) */}
          {/* We skip edges for now as the user specifically asked about the nodes/black box content */}

          {nodes.map((node) => {
            let color = '#64748b';
            if (node.type === 'input') color = '#3b82f6';
            if (node.type === 'output') color = '#ef4444';
            if (node.type === 'decision') color = '#eab308';

            return (
              <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
                <rect
                  width={node.style?.width || 150}
                  height={node.style?.height || 40}
                  fill={color}
                  rx={4}
                />
                <text
                  x={(node.style?.width || 150) / 2}
                  y={(node.style?.height || 40) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {node.data.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
        Nodes detected: {nodes.length}
      </div>
    </div>
  );
}
