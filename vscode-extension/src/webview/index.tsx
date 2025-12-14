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
  type: 'input' | 'output' | 'default' | 'decision' | 'container';
  data: {
    label: string;
    sourceData?: any;
    description?: string;
    children?: string[];
    collapsed?: boolean;
    zoomLevel?: 'mile-high' | '1000ft' | '100ft';
    isChildOfCollapsed?: boolean;
  };
  position: { x: number; y: number };
  className?: string;
  style?: any;
  parentNode?: string;
  extent?: 'parent';
  hidden?: boolean;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: any;
  animated?: boolean;
}

function FlowchartViewer() {
  const [flowData, setFlowData] = React.useState(window.flowData);
  const [selectedNode, setSelectedNode] = React.useState<FlowNode | null>(null);
  const [collapsedContainers, setCollapsedContainers] = React.useState<Set<string>>(new Set());
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

  const toggleContainer = (containerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedContainers(prev => {
      const next = new Set(prev);
      if (next.has(containerId)) {
        next.delete(containerId);
      } else {
        next.add(containerId);
      }
      return next;
    });
  };

  const nodes: FlowNode[] = flowData.nodes || [];
  const edges: FlowEdge[] = flowData.edges || [];

  // Filter out hidden nodes (children of collapsed containers)
  const visibleNodes = nodes.filter(node => {
    if (node.hidden) return false;
    if (node.parentNode && collapsedContainers.has(node.parentNode)) return false;
    return true;
  });

  // Filter edges that connect to hidden nodes
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(edge =>
    visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

  // Get container nodes
  const containerNodes = visibleNodes.filter(n => n.type === 'container');
  const regularNodes = visibleNodes.filter(n => n.type !== 'container');

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  visibleNodes.forEach(node => {
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
  const viewBox = nodes.length > 0
    ? `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`
    : '0 0 400 300';

  const getNodeColor = (node: FlowNode) => {
    switch (node.type) {
      case 'input': return '#3b82f6';
      case 'output': return '#ef4444';
      case 'decision': return '#fbbf24';
      case 'container': return '#1e293b';
      default: return '#e5e7eb';
    }
  };

  const getNodeTextColor = (node: FlowNode) => {
    switch (node.type) {
      case 'input':
      case 'output':
      case 'container':
        return 'white';
      default:
        return '#1f2937';
    }
  };

  return (
    <div className="flowchart-container">
      <div className="header">
        <h2>LogiGo - {window.filePath.split(/[\\/]/).pop()}</h2>
        {selectedNode && (
          <div className="selected-node-info">
            Selected: {selectedNode.data.label}
            {selectedNode.data.sourceData && (
              <span> (Line {selectedNode.data.sourceData.start.line})</span>
            )}
          </div>
        )}
        {containerNodes.length > 0 && (
          <div className="container-legend">
            <span className="legend-title">Containers:</span>
            {containerNodes.map(container => (
              <button
                key={container.id}
                className={`container-toggle ${collapsedContainers.has(container.id) ? 'collapsed' : 'expanded'}`}
                onClick={(e) => toggleContainer(container.id, e)}
              >
                {collapsedContainers.has(container.id) ? '▶' : '▼'} {container.data.label}
              </button>
            ))}
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
          <marker
            id="arrowhead-animated"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Render container nodes first (as backgrounds) */}
        {containerNodes.map(node => {
          const x = node.position.x;
          const y = node.position.y;
          const width = node.style?.width || 300;
          const height = collapsedContainers.has(node.id) ? 60 : (node.style?.height || 200);
          const isCollapsed = collapsedContainers.has(node.id);

          return (
            <g
              key={node.id}
              className={`container-node ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => handleNodeClick(node)}
            >
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx="12"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.9"
              />
              {/* Container header */}
              <rect
                x={x}
                y={y}
                width={width}
                height="40"
                rx="12"
                fill="#3b82f6"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {/* Bottom corners fix for header */}
              <rect
                x={x}
                y={y + 28}
                width={width}
                height="14"
                fill="#3b82f6"
              />
              {/* Collapse toggle button */}
              <g
                className="collapse-button"
                onClick={(e) => toggleContainer(node.id, e)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={x + 20}
                  cy={y + 20}
                  r="10"
                  fill="rgba(255,255,255,0.2)"
                />
                <text
                  x={x + 20}
                  y={y + 24}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {isCollapsed ? '▶' : '▼'}
                </text>
              </g>
              {/* Container label */}
              <text
                x={x + 40}
                y={y + 25}
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {node.data.label}
              </text>
              {/* Child count badge */}
              {node.data.children && (
                <g>
                  <rect
                    x={x + width - 50}
                    y={y + 10}
                    width="40"
                    height="20"
                    rx="10"
                    fill="rgba(255,255,255,0.2)"
                  />
                  <text
                    x={x + width - 30}
                    y={y + 24}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                  >
                    {node.data.children.length}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render edges */}
        {visibleEdges.map(edge => {
          const sourceNode = visibleNodes.find(n => n.id === edge.source);
          const targetNode = visibleNodes.find(n => n.id === edge.target);

          if (!sourceNode || !targetNode) return null;

          const sourceX = sourceNode.position.x + (sourceNode.style?.width || 150) / 2;
          const sourceY = sourceNode.position.y + (sourceNode.style?.height || 40);
          const targetX = targetNode.position.x + (targetNode.style?.width || 150) / 2;
          const targetY = targetNode.position.y;

          const midY = (sourceY + targetY) / 2;
          const isAnimated = edge.animated;

          return (
            <g key={edge.id}>
              <path
                d={`M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`}
                stroke={isAnimated ? '#3b82f6' : (edge.style?.stroke || '#666')}
                strokeWidth={isAnimated ? '3' : '2'}
                strokeDasharray={isAnimated ? '5,5' : 'none'}
                fill="none"
                markerEnd={isAnimated ? 'url(#arrowhead-animated)' : 'url(#arrowhead)'}
                className={isAnimated ? 'animated-edge' : ''}
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

        {/* Render regular nodes */}
        {regularNodes.map(node => {
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
                  points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`}
                  fill={getNodeColor(node)}
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
                  fill={getNodeColor(node)}
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
                fill={getNodeTextColor(node)}
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
