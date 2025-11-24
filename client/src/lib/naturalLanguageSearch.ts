/**
 * Natural Language Search for Flowchart Nodes (Premium Feature)
 * 
 * Allows users to search flowchart nodes using natural language queries like:
 * - "show me all conditionals"
 * - "find return statements"
 * - "show error handling"
 * - "find loops"
 */

import type { FlowNode } from './parser';

export interface SearchResult {
  matchedNodes: Set<string>; // Node IDs
  query: string;
  matchType: 'type' | 'content' | 'pattern' | 'none';
}

/**
 * Parse natural language query and match against flowchart nodes
 */
export function searchNodes(query: string, nodes: FlowNode[]): SearchResult {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return { matchedNodes: new Set(), query, matchType: 'none' };
  }

  // Pattern matching for common queries
  const patterns = [
    // Node type queries
    {
      keywords: ['conditional', 'if', 'else', 'decision', 'branch'],
      type: 'decision' as const,
      matchType: 'type' as const,
    },
    {
      keywords: ['return', 'output', 'exit'],
      type: 'output' as const,
      matchType: 'type' as const,
    },
    {
      keywords: ['start', 'entry', 'beginning', 'input'],
      type: 'input' as const,
      matchType: 'type' as const,
    },
    // Content-based queries
    {
      keywords: ['error', 'try', 'catch', 'throw', 'exception'],
      searchContent: true,
      terms: ['error', 'try', 'catch', 'throw', 'exception'],
      matchType: 'content' as const,
    },
    {
      keywords: ['loop', 'for', 'while', 'repeat', 'iterate'],
      searchContent: true,
      terms: ['for', 'while', 'do'],
      matchType: 'content' as const,
    },
    {
      keywords: ['variable', 'const', 'let', 'var', 'declaration'],
      searchContent: true,
      terms: ['const', 'let', 'var'],
      matchType: 'content' as const,
    },
    {
      keywords: ['function', 'call', 'invoke'],
      searchContent: true,
      terms: ['(', 'function'],
      matchType: 'content' as const,
    },
  ];

  // Check for pattern matches
  for (const pattern of patterns) {
    const matchesKeyword = pattern.keywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );

    if (matchesKeyword) {
      const matchedNodes = new Set<string>();

      for (const node of nodes) {
        let isMatch = false;

        // Type-based matching
        if ('type' in pattern && node.type === pattern.type) {
          isMatch = true;
        }

        // Content-based matching
        if (pattern.searchContent && pattern.terms) {
          const nodeLabel = node.data?.label?.toLowerCase() || '';
          if (pattern.terms.some(term => nodeLabel.includes(term))) {
            isMatch = true;
          }
        }

        if (isMatch && node.id !== 'start' && node.id !== 'end') {
          matchedNodes.add(node.id);
        }
      }

      if (matchedNodes.size > 0) {
        return { matchedNodes, query, matchType: pattern.matchType };
      }
    }
  }

  // Fallback: Direct text search in node labels
  const matchedNodes = new Set<string>();
  for (const node of nodes) {
    const nodeLabel = node.data?.label?.toLowerCase() || '';
    if (nodeLabel.includes(normalizedQuery) && node.id !== 'start' && node.id !== 'end') {
      matchedNodes.add(node.id);
    }
  }

  if (matchedNodes.size > 0) {
    return { matchedNodes, query, matchType: 'pattern' };
  }

  return { matchedNodes: new Set(), query, matchType: 'none' };
}

/**
 * Get suggested queries based on available nodes
 */
export function getSuggestedQueries(nodes: FlowNode[]): string[] {
  const suggestions: string[] = [];
  
  const hasDecisions = nodes.some(n => n.type === 'decision');
  const hasReturns = nodes.some(n => n.type === 'output');
  const hasErrors = nodes.some(n => 
    n.data?.label?.toLowerCase().includes('error') ||
    n.data?.label?.toLowerCase().includes('try') ||
    n.data?.label?.toLowerCase().includes('catch')
  );
  const hasLoops = nodes.some(n =>
    n.data?.label?.toLowerCase().includes('for') ||
    n.data?.label?.toLowerCase().includes('while')
  );

  if (hasDecisions) suggestions.push('Show all conditionals');
  if (hasReturns) suggestions.push('Find return statements');
  if (hasErrors) suggestions.push('Show error handling');
  if (hasLoops) suggestions.push('Find loops');

  return suggestions;
}
