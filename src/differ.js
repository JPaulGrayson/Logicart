/**
 * LogiGo Differ - Ghost Diff Engine
 * 
 * Compares two code trees and identifies added, removed, and modified nodes
 */

class LogiGoDiffer {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            matchBy: options.matchBy || 'id', // 'id' or 'signature'
            ...options
        };
    }

    /**
     * Compare two trees and return diff information
     * @param {Array} oldTree - Previous version of the code tree
     * @param {Array} newTree - Current version of the code tree
     * @returns {Object} { nodes, stats }
     */
    diffTrees(oldTree, newTree) {
        if (this.options.debug) {
            console.log('[LogiGoDiffer] Comparing trees...', {
                oldNodes: oldTree.length,
                newNodes: newTree.length
            });
        }

        const result = {
            nodes: [],
            stats: {
                added: 0,
                removed: 0,
                modified: 0,
                unchanged: 0
            }
        };

        // Create maps for quick lookup
        const oldMap = new Map(oldTree.map(node => [this.getNodeKey(node), node]));
        const newMap = new Map(newTree.map(node => [this.getNodeKey(node), node]));

        // Process all nodes from new tree (added or modified)
        newTree.forEach(newNode => {
            const key = this.getNodeKey(newNode);
            const oldNode = oldMap.get(key);

            if (!oldNode) {
                // Node is new (added)
                result.nodes.push({
                    ...newNode,
                    diffStatus: 'added',
                    className: 'node-added'
                });
                result.stats.added++;
            } else if (this.nodesAreDifferent(oldNode, newNode)) {
                // Node exists but was modified
                result.nodes.push({
                    ...newNode,
                    diffStatus: 'modified',
                    className: 'node-modified',
                    oldValue: oldNode
                });
                result.stats.modified++;
            } else {
                // Node is unchanged
                result.nodes.push({
                    ...newNode,
                    diffStatus: 'unchanged',
                    className: 'node-unchanged'
                });
                result.stats.unchanged++;
            }
        });

        // Process nodes from old tree that are missing in new tree (deleted)
        oldTree.forEach(oldNode => {
            const key = this.getNodeKey(oldNode);
            if (!newMap.has(key)) {
                // Node was deleted (ghost)
                result.nodes.push({
                    ...oldNode,
                    diffStatus: 'deleted',
                    className: 'node-deleted'
                });
                result.stats.removed++;
            }
        });

        if (this.options.debug) {
            console.log('[LogiGoDiffer] Diff complete:', result.stats);
        }

        return result;
    }

    /**
     * Get a unique key for a node based on match strategy
     * @param {Object} node - The node to get a key for
     * @returns {string}
     */
    getNodeKey(node) {
        if (this.options.matchBy === 'signature') {
            // Match by function signature or code structure
            return this.getNodeSignature(node);
        }
        // Default: match by ID or code_ref
        return node.id || node.code_ref || node.label;
    }

    /**
     * Generate a signature for a node based on its structure
     * @param {Object} node - The node to generate a signature for
     * @returns {string}
     */
    getNodeSignature(node) {
        // Create a signature from type + label + line (if available)
        const parts = [
            node.type,
            node.label?.toLowerCase().replace(/\s+/g, '_'),
            node.line
        ].filter(Boolean);

        return parts.join('::');
    }

    /**
     * Check if two nodes are different
     * @param {Object} oldNode - Previous version of the node
     * @param {Object} newNode - Current version of the node
     * @returns {boolean}
     */
    nodesAreDifferent(oldNode, newNode) {
        // Compare relevant fields
        const fields = ['label', 'code', 'type', 'line'];

        for (const field of fields) {
            if (oldNode[field] !== newNode[field]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Apply diff classes to nodes for rendering
     * @param {Array} nodes - Nodes with diff status
     * @returns {Array} Nodes with CSS classes applied
     */
    applyDiffStyles(nodes) {
        return nodes.map(node => {
            const styles = this.getStylesForStatus(node.diffStatus);
            return {
                ...node,
                style: styles
            };
        });
    }

    /**
     * Get CSS styles for a diff status
     * @param {string} status - 'added', 'deleted', 'modified', 'unchanged'
     * @returns {Object}
     */
    getStylesForStatus(status) {
        const styleMap = {
            added: {
                border: '2px solid #28a745',
                backgroundColor: '#d4edda',
                animation: 'pulse 1s ease-in-out'
            },
            deleted: {
                border: '2px solid #dc3545',
                backgroundColor: '#f8d7da',
                opacity: '0.5'
            },
            modified: {
                border: '2px solid #ffc107',
                backgroundColor: '#fff3cd'
            },
            unchanged: {
                border: '1px solid #dee2e6',
                backgroundColor: '#f8f9fa'
            }
        };

        return styleMap[status] || styleMap.unchanged;
    }

    /**
     * Generate a summary of changes
     * @param {Object} diffResult - Result from diffTrees()
     * @returns {string}
     */
    getSummary(diffResult) {
        const { stats } = diffResult;
        const total = stats.added + stats.removed + stats.modified + stats.unchanged;

        const parts = [];
        if (stats.added > 0) parts.push(`${stats.added} added`);
        if (stats.removed > 0) parts.push(`${stats.removed} removed`);
        if (stats.modified > 0) parts.push(`${stats.modified} modified`);
        if (stats.unchanged > 0) parts.push(`${stats.unchanged} unchanged`);

        return `${total} nodes: ${parts.join(', ')}`;
    }

    /**
     * Filter nodes by diff status
     * @param {Array} nodes - Nodes with diff status
     * @param {string} status - Status to filter by
     * @returns {Array}
     */
    filterByStatus(nodes, status) {
        return nodes.filter(node => node.diffStatus === status);
    }

    /**
     * Get all changes (added + modified + deleted)
     * @param {Array} nodes - Nodes with diff status
     * @returns {Array}
     */
    getChanges(nodes) {
        return nodes.filter(node =>
            node.diffStatus === 'added' ||
            node.diffStatus === 'modified' ||
            node.diffStatus === 'deleted'
        );
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogiGoDiffer;
}

// Browser global
if (typeof window !== 'undefined') {
    window.LogiGoDiffer = LogiGoDiffer;
}

// ES Module export
export default LogiGoDiffer;
