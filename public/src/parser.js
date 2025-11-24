/**
 * LogiGo Parser - Lightweight AST Parser
 * 
 * Converts JavaScript code into a simplified flowchart structure
 */

class LogiGoParser {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            ...options
        };
    }

    /**
     * Parse JavaScript code into flowchart nodes
     * @param {string} code - Raw JavaScript code
     * @returns {Array} Array of flowchart nodes
     */
    parse(code) {
        if (this.options.debug) {
            console.log('[LogiGo Parser] Parsing code...');
        }

        // This is a stub implementation
        // In production, this would use acorn or @babel/parser
        const nodes = [];

        // Simple regex-based parsing for demo purposes
        const lines = code.split('\n');
        let nodeId = 0;

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//')) {
                return; // Skip empty lines and comments
            }

            // Detect function declarations
            if (trimmed.match(/^function\s+(\w+)/)) {
                const match = trimmed.match(/^function\s+(\w+)/);
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'function',
                    label: `Function: ${match[1]}`,
                    code_ref: match[1],
                    line: index + 1,
                    code: trimmed
                });
            }
            // Detect if statements
            else if (trimmed.match(/^if\s*\(/)) {
                const condition = trimmed.match(/if\s*\((.*?)\)/)?.[1] || 'condition';
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'branch',
                    label: `If: ${condition}`,
                    code_ref: `if_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
            // Detect loops
            else if (trimmed.match(/^(for|while)\s*\(/)) {
                const loopType = trimmed.match(/^(for|while)/)[1];
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'loop',
                    label: `${loopType.toUpperCase()} Loop`,
                    code_ref: `${loopType}_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
            // Detect return statements
            else if (trimmed.match(/^return\s/)) {
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'return',
                    label: 'Return',
                    code_ref: `return_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
            // Generic statement
            else if (trimmed.length > 0) {
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'statement',
                    label: trimmed.substring(0, 30) + (trimmed.length > 30 ? '...' : ''),
                    code_ref: `stmt_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
        });

        if (this.options.debug) {
            console.log(`[LogiGo Parser] Parsed ${nodes.length} nodes`);
        }

        return nodes;
    }

    /**
     * Parse code and return a tree structure with edges
     * @param {string} code - Raw JavaScript code
     * @returns {Object} { nodes, edges }
     */
    parseToGraph(code) {
        const nodes = this.parse(code);
        const edges = [];

        // Create simple sequential edges
        for (let i = 0; i < nodes.length - 1; i++) {
            edges.push({
                id: `edge_${i}`,
                source: nodes[i].id,
                target: nodes[i + 1].id,
                type: 'default'
            });
        }

        return { nodes, edges };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogiGoParser;
}

// Browser global
if (typeof window !== 'undefined') {
    window.LogiGoParser = LogiGoParser;
}
