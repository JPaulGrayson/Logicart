import dagre from 'dagre';
import type { FlowNode, FlowEdge } from './types.js';

export function computeLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  if (nodes.length === 0) return nodes;
  
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB', 
    nodesep: 50, 
    ranksep: 80,
    marginx: 20,
    marginy: 20
  });
  g.setDefaultEdgeLabel(() => ({}));
  
  nodes.forEach(node => {
    const isDecision = node.type === 'decision';
    const labelLength = node.data.label?.length || 10;
    const width = isDecision ? 120 : Math.max(150, labelLength * 7 + 40);
    const height = isDecision ? 80 : 50;
    g.setNode(node.id, { width, height });
  });
  
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(g);
  
  return nodes.map(node => {
    const pos = g.node(node.id);
    if (!pos) return node;
    
    return {
      ...node,
      position: { 
        x: pos.x - (pos.width || 150) / 2, 
        y: pos.y - (pos.height || 50) / 2 
      }
    };
  });
}
