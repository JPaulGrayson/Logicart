/**
 * LogiGo Grounding Layer
 * 
 * Lightweight, high-density JSON representation of flowcharts
 * for LLM consumption. Strips visual data, preserves logic topology.
 */

export type GroundingNodeType = "FUNCTION" | "DECISION" | "LOOP" | "ACTION";

export interface GroundingNode {
  id: string;
  type: GroundingNodeType;
  label: string;
  snippet: string;
  parents: string[];
  children: Array<{ targetId: string; condition?: string }>;
}

export interface GroundingSummary {
  entryPoint: string;
  nodeCount: number;
  complexityScore: number;
}

export interface GroundingContext {
  summary: GroundingSummary;
  flow: GroundingNode[];
}

export interface FlowNodeInput {
  id: string;
  type: string;
  data: {
    label: string;
    userLabel?: string;
  };
}

export interface FlowEdgeInput {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Generate a lightweight, high-density JSON representation of the flowchart
 * for LLM consumption. Strips visual data, preserves logic topology.
 */
export function generateGroundingContext(
  nodes: FlowNodeInput[],
  edges: FlowEdgeInput[]
): GroundingContext {
  const parentMap = new Map<string, string[]>();
  const childrenMap = new Map<string, Array<{ targetId: string; condition?: string }>>();

  edges.forEach(edge => {
    if (!parentMap.has(edge.target)) {
      parentMap.set(edge.target, []);
    }
    parentMap.get(edge.target)!.push(edge.source);

    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push({
      targetId: edge.target,
      condition: edge.label || undefined
    });
  });

  const mapNodeType = (flowType: string, label: string): GroundingNodeType => {
    const lowerLabel = label.toLowerCase();

    // Check for loop patterns first (loops may be tagged as 'decision' in FlowNode)
    if (lowerLabel.startsWith('for') || lowerLabel.startsWith('while') ||
        lowerLabel.includes('for (') || lowerLabel.includes('while (')) {
      return 'LOOP';
    }

    switch (flowType) {
      case 'input': return 'FUNCTION';
      case 'decision': return 'DECISION';
      case 'container': return 'LOOP';
      default: return 'ACTION';
    }
  };

  let complexityScore = 0;

  const groundingNodes: GroundingNode[] = nodes.map(node => {
    const label = node.data.label || '';
    const nodeType = mapNodeType(node.type, label);

    if (nodeType === 'DECISION' || nodeType === 'LOOP') {
      complexityScore++;
    }

    return {
      id: node.id,
      type: nodeType,
      label: node.data.userLabel || label,
      snippet: label.slice(0, 50),
      parents: parentMap.get(node.id) || [],
      children: childrenMap.get(node.id) || []
    };
  });

  const entryNode = nodes.find(n => n.type === 'input');

  return {
    summary: {
      entryPoint: entryNode?.id || groundingNodes[0]?.id || 'unknown',
      nodeCount: groundingNodes.length,
      complexityScore
    },
    flow: groundingNodes
  };
}
