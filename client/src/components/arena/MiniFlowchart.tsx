import { useMemo } from 'react';
import { ReactFlow, Background, Node, Edge, ReactFlowProvider, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface FlowNode {
  id: string;
  type: string;
  label: string;
  children: Array<{ targetId: string; condition?: string }>;
}

interface ParsedFlowchart {
  summary: { nodeCount: number; complexityScore: number; entryPoint: string };
  flow: FlowNode[];
}

interface MiniFlowchartProps {
  flowchart: ParsedFlowchart | null;
  provider: string;
}

const NODE_WIDTH = 150;
const NODE_HEIGHT = 40;

function layoutNodes(flowchart: ParsedFlowchart): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 30, ranksep: 50 });
  g.setDefaultEdgeLabel(() => ({}));

  flowchart.flow.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  flowchart.flow.forEach((node) => {
    node.children.forEach((child) => {
      g.setEdge(node.id, child.targetId);
    });
  });

  dagre.layout(g);

  const nodes: Node[] = flowchart.flow.map((node) => {
    const position = g.node(node.id);
    const isDecision = node.type === 'DECISION';
    const isFunction = node.type === 'FUNCTION';
    const isLoop = node.type === 'LOOP';

    return {
      id: node.id,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      data: { label: node.label.slice(0, 25) + (node.label.length > 25 ? '...' : '') },
      type: 'default',
      style: {
        background: isFunction ? '#3b82f6' : isDecision ? '#f59e0b' : isLoop ? '#8b5cf6' : '#374151',
        color: '#fff',
        border: 'none',
        borderRadius: isDecision ? '4px' : '6px',
        fontSize: '10px',
        padding: '6px 10px',
        width: NODE_WIDTH,
        transform: isDecision ? 'rotate(0deg)' : undefined,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });

  const edges: Edge[] = [];
  flowchart.flow.forEach((node) => {
    node.children.forEach((child, index) => {
      edges.push({
        id: `${node.id}-${child.targetId}-${index}`,
        source: node.id,
        target: child.targetId,
        type: 'smoothstep',
        style: { stroke: child.condition === 'true' ? '#22c55e' : child.condition === 'false' ? '#ef4444' : '#6b7280' },
        label: child.condition,
        labelStyle: { fontSize: 8, fill: '#9ca3af' },
      });
    });
  });

  return { nodes, edges };
}

function MiniFlowchartInner({ flowchart, provider }: MiniFlowchartProps) {
  const { nodes, edges } = useMemo(() => {
    if (!flowchart || flowchart.flow.length === 0) {
      return { nodes: [], edges: [] };
    }
    return layoutNodes(flowchart);
  }, [flowchart]);

  if (!flowchart || flowchart.flow.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        No flowchart available
      </div>
    );
  }

  return (
    <div className="h-full w-full" data-testid={`flowchart-${provider.toLowerCase()}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
      >
        <Background color="#30363d" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function MiniFlowchart(props: MiniFlowchartProps) {
  return (
    <ReactFlowProvider>
      <MiniFlowchartInner {...props} />
    </ReactFlowProvider>
  );
}
