/**
 * Parser module - re-exports from @logicart/bridge
 * 
 * This module uses the shared bridge package for parsing,
 * ensuring consistency across Replit, VS Code, and Antigravity IDEs.
 * 
 * NOTE: In a production npm setup, this would be:
 * export * from '@logicart/bridge';
 * 
 * For now, we re-export from the bridge source directly.
 */

// Re-export types from bridge
export type { 
  SourceLocation, 
  FlowNode, 
  FlowEdge, 
  FlowData 
} from '../../../docs/bridge/src/types';

// Re-export the parser function from bridge
export { parseCodeToFlow } from '../../../docs/bridge/src/parser';

// Import types for grounding
import type { FlowNode, FlowEdge } from '../../../docs/bridge/src/types';
import type { GroundingContext, GroundingNode, GroundingNodeType } from '@shared/grounding-types';

/**
 * Generate a lightweight, high-density JSON representation of the flowchart
 * for LLM consumption. Strips visual data, preserves logic topology.
 */
export function generateGroundingContext(nodes: FlowNode[], edges: FlowEdge[]): GroundingContext {
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
    switch (flowType) {
      case 'input': return 'FUNCTION';
      case 'decision': return 'DECISION';
      case 'container': return 'LOOP';
      default:
        // Check if it's a loop based on label content
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.startsWith('for') || lowerLabel.startsWith('while')) {
          return 'LOOP';
        }
        return 'ACTION';
    }
  };
  
  let complexityScore = 0;
  
  // Include ALL nodes (don't filter out containers - they represent loops)
  const groundingNodes: GroundingNode[] = nodes.map(node => {
    const label = node.data.label || '';
    const nodeType = mapNodeType(node.type, label);
    
    // Count complexity based on actual node types
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
