/**
 * LogiGo Ghost Diff Engine - Premium Feature
 * 
 * Compares two code trees and identifies added, removed, and modified nodes.
 * Visualizes code changes as "ghost" nodes in the flowchart.
 */

import { FlowNode } from './parser';

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffNode extends FlowNode {
  diffStatus: DiffStatus;
  oldValue?: FlowNode;
}

export interface DiffStats {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export interface DiffResult {
  nodes: DiffNode[];
  stats: DiffStats;
}

export interface GhostDiffOptions {
  debug?: boolean;
  matchBy?: 'id' | 'signature';
}

export class GhostDiff {
  private options: Required<GhostDiffOptions>;

  constructor(options: GhostDiffOptions = {}) {
    this.options = {
      debug: options.debug || false,
      matchBy: options.matchBy || 'signature', // Use signature matching by default for better accuracy
    };
  }

  /**
   * Compare two trees and return diff information
   */
  diffTrees(oldTree: FlowNode[], newTree: FlowNode[]): DiffResult {
    // Always log for debugging
    console.log('[GhostDiff] Comparing trees...', {
      oldNodes: oldTree.length,
      newNodes: newTree.length,
    });
    
    // Log decision node labels for comparison (most likely to change)
    const oldDecisions = oldTree.filter(n => n.type === 'decision');
    const newDecisions = newTree.filter(n => n.type === 'decision');
    if (oldDecisions.length > 0) {
      console.log('[GhostDiff] Old decision labels:', oldDecisions.map(n => n.data.label));
      console.log('[GhostDiff] New decision labels:', newDecisions.map(n => n.data.label));
    }

    const result: DiffResult = {
      nodes: [],
      stats: {
        added: 0,
        removed: 0,
        modified: 0,
        unchanged: 0,
      },
    };

    // Create maps for quick lookup
    const oldMap = new Map(oldTree.map((node) => [this.getNodeKey(node), node]));
    const newMap = new Map(newTree.map((node) => [this.getNodeKey(node), node]));

    // Process all nodes from new tree (added or modified)
    newTree.forEach((newNode) => {
      const key = this.getNodeKey(newNode);
      const oldNode = oldMap.get(key);

      if (!oldNode) {
        // Node is new (added)
        result.nodes.push({
          ...newNode,
          diffStatus: 'added',
        });
        result.stats.added++;
      } else if (this.nodesAreDifferent(oldNode, newNode)) {
        // Node exists but was modified
        result.nodes.push({
          ...newNode,
          diffStatus: 'modified',
          oldValue: oldNode,
        });
        result.stats.modified++;
      } else {
        // Node is unchanged
        result.nodes.push({
          ...newNode,
          diffStatus: 'unchanged',
        });
        result.stats.unchanged++;
      }
    });

    // Process nodes from old tree that are missing in new tree (deleted/ghost)
    oldTree.forEach((oldNode) => {
      const key = this.getNodeKey(oldNode);
      if (!newMap.has(key)) {
        // Node was deleted (ghost)
        result.nodes.push({
          ...oldNode,
          diffStatus: 'removed',
        });
        result.stats.removed++;
      }
    });

    if (this.options.debug) {
      console.log('[GhostDiff] Diff complete:', result.stats);
    }

    return result;
  }

  /**
   * Get a unique key for a node based on match strategy
   */
  private getNodeKey(node: FlowNode): string {
    if (this.options.matchBy === 'signature') {
      return this.getNodeSignature(node);
    }
    // Default: match by ID
    return node.id;
  }

  /**
   * Generate a signature for a node based on its structure
   * Uses type + first keyword/identifier for structural matching
   */
  private getNodeSignature(node: FlowNode): string {
    const label = node.data.label || '';
    
    // Extract structural identifier: first word or up to first operator/value
    // This captures "if", "for", "let x", "return", etc. without values
    const structuralId = label
      .replace(/\s+/g, ' ')
      .split(/[=<>!+\-*/(){}[\];,]/)[0]
      .trim()
      .slice(0, 30) || 'no-id';
    
    const parts = [
      node.type,
      structuralId,
      // Add source line as secondary key when available
      node.data.sourceData?.start?.line ?? '',
    ].filter(Boolean);

    return parts.join('::');
  }

  /**
   * Check if two nodes are different
   */
  private nodesAreDifferent(oldNode: FlowNode, newNode: FlowNode): boolean {
    // Compare labels (primary check)
    if (oldNode.data.label !== newNode.data.label) {
      console.log('[GhostDiff] Label changed:', oldNode.data.label, '->', newNode.data.label);
      return true;
    }

    // Compare types
    if (oldNode.type !== newNode.type) {
      console.log('[GhostDiff] Type changed:', oldNode.type, '->', newNode.type);
      return true;
    }

    return false;
  }

  /**
   * Apply diff styling to nodes for visualization
   */
  applyDiffStyling(nodes: DiffNode[]): DiffNode[] {
    console.log('[Ghost Diff] Applying styling to', nodes.length, 'nodes');
    return nodes.map((node) => {
      const styledNode = { ...node };
      
      // Add CSS class based on diff status for styling via CSS
      const diffClass = `diff-${node.diffStatus}`;
      styledNode.className = styledNode.className 
        ? `${styledNode.className} ${diffClass}` 
        : diffClass;
      
      if (node.diffStatus !== 'unchanged') {
        console.log('[Ghost Diff] Node', node.id, 'status:', node.diffStatus, 'className:', styledNode.className);
      }

      return styledNode;
    });
  }
}
