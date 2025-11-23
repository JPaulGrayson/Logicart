import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

declare global {
  interface Window {
    flowData: any;
    filePath: string;
    vscode: any;
  }
}

interface FlowNode {
  id: string;
  type: string;
  data: { label: string; sourceData?: any };
  position: { x: number; y: number };
  className?: string;
  style?: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: any;
}

function FlowchartViewer() {
  const [flowData, setFlowData] = React.useState(window.flowData);
  const [selectedNode, setSelectedNode] = React.useState<FlowNode | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'updateFlow') {
        setFlowData(message.flowData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    if (node.data.sourceData) {
      window.vscode.postMessage({
        command: 'jumpToLine',
        line: node.data.sourceData.start.line
      });
    }
  };

  const nodes: FlowNode[] = flowData.nodes || [];
  const edges: FlowEdge[] = flowData.edges || [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.style?.width || 150;
    const height = node.style?.height || 40;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  const padding = 50;
  const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`;

  return (
    <div className="flowchart-container">
      <div className="header">
        <h2>Cartographer - {window.filePath.split(/[\\/]/).pop()}</h2>
        {selectedNode && (
          <div className="selected-node-info">
            Selected: {selectedNode.data.label}
            {selectedNode.data.sourceData && (
              <span> (Line {selectedNode.data.sourceData.start.line})</span>
            )}
          </div>
        )}
      </div>
      
      <svg ref={svgRef} viewBox={viewBox} className="flowchart-svg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#666" />
          </marker>
        </defs>

        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;
          
          const sourceX = sourceNode.position.x + (sourceNode.style?.width || 150) / 2;
          const sourceY = sourceNode.position.y + (sourceNode.style?.height || 40);
          const targetX = targetNode.position.x + (targetNode.style?.width || 150) / 2;
          const targetY = targetNode.position.y;
          
          const midY = (sourceY + targetY) / 2;
          
          return (
            <g key={edge.id}>
              <path
                d={`M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`}
                stroke={edge.style?.stroke || '#666'}
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={targetX}
                  y={midY - 5}
                  textAnchor="middle"
                  className="edge-label"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map(node => {
          const isDecision = node.type === 'decision';
          const x = node.position.x;
          const y = node.position.y;
          const width = node.style?.width || 150;
          const height = node.style?.height || 40;
          
          return (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`node ${node.className || ''} ${selectedNode?.id === node.id ? 'selected' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              {isDecision ? (
                <polygon
                  points={`${x + width/2},${y} ${x + width},${y + height/2} ${x + width/2},${y + height} ${x},${y + height/2}`}
                  fill={node.type === 'input' ? '#3b82f6' : node.type === 'output' ? '#ef4444' : '#fbbf24'}
                  stroke="#333"
                  strokeWidth="2"
                />
              ) : (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="8"
                  fill={node.type === 'input' ? '#3b82f6' : node.type === 'output' ? '#ef4444' : '#e5e7eb'}
                  stroke="#333"
                  strokeWidth="2"
                />
              )}
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="node-label"
                fill={node.type === 'input' || node.type === 'output' ? 'white' : '#1f2937'}
              >
                {node.data.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<FlowchartViewer />);
