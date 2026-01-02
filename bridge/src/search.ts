/**
 * LogiGo Natural Language Search
 * 
 * AI-powered search through flowchart nodes using natural language queries.
 * Matches queries like "find the login function" or "show where errors happen"
 */

import { FlowNode } from './types';

export interface SearchResult {
    node: FlowNode;
    score: number;
    matchReason: string;
}

export interface SearchOptions {
    limit?: number;
    minScore?: number;
    nodeTypes?: string[];
}

// Common programming patterns and their keywords
const PATTERN_KEYWORDS: Record<string, string[]> = {
    error: ['error', 'catch', 'throw', 'exception', 'fail', 'invalid'],
    validation: ['validate', 'check', 'verify', 'valid', 'invalid', 'is', 'has'],
    loop: ['for', 'while', 'loop', 'iterate', 'each', 'every'],
    condition: ['if', 'else', 'switch', 'case', 'condition', 'when'],
    return: ['return', 'result', 'output', 'give', 'send'],
    function: ['function', 'method', 'call', 'invoke', 'run', 'execute'],
    variable: ['variable', 'let', 'const', 'var', 'set', 'assign', 'store'],
    input: ['input', 'parameter', 'argument', 'param', 'receive', 'accept'],
    output: ['output', 'print', 'log', 'display', 'show', 'write'],
    calculation: ['calculate', 'compute', 'math', 'add', 'subtract', 'multiply', 'divide'],
    comparison: ['compare', 'equal', 'greater', 'less', 'same', 'different'],
    auth: ['login', 'logout', 'auth', 'password', 'user', 'session', 'token'],
    data: ['data', 'fetch', 'load', 'save', 'store', 'get', 'set']
};

export class NaturalLanguageSearch {
    private nodes: FlowNode[];
    private indexedNodes: Map<string, { node: FlowNode; keywords: string[] }>;

    constructor(nodes: FlowNode[]) {
        this.nodes = nodes;
        this.indexedNodes = new Map();
        this.buildIndex();
    }

    private buildIndex(): void {
        this.nodes.forEach(node => {
            const keywords = this.extractKeywords(node);
            this.indexedNodes.set(node.id, { node, keywords });
        });
    }

    private extractKeywords(node: FlowNode): string[] {
        const keywords: string[] = [];

        // Extract from label
        const label = (node.data.label || '').toLowerCase();
        keywords.push(...label.split(/\s+|[(){}[\],;:.!?]/));

        // Extract from description
        if (node.data.description) {
            keywords.push(...node.data.description.toLowerCase().split(/\s+/));
        }

        // Add node type
        keywords.push(node.type);

        // Add pattern matches
        for (const [pattern, patternKeywords] of Object.entries(PATTERN_KEYWORDS)) {
            if (patternKeywords.some(kw => label.includes(kw))) {
                keywords.push(pattern);
            }
        }

        return keywords.filter(k => k.length > 1);
    }

    /**
     * Search nodes using natural language query
     */
    search(query: string, options: SearchOptions = {}): SearchResult[] {
        const { limit = 10, minScore = 0.1, nodeTypes } = options;

        const queryWords = this.parseQuery(query);
        const results: SearchResult[] = [];

        this.indexedNodes.forEach(({ node, keywords }) => {
            // Filter by node type if specified
            if (nodeTypes && !nodeTypes.includes(node.type)) return;

            const { score, reason } = this.calculateScore(queryWords, keywords, node);

            if (score >= minScore) {
                results.push({ node, score, matchReason: reason });
            }
        });

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    }

    private parseQuery(query: string): string[] {
        const words = query.toLowerCase()
            .replace(/['"]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 1);

        // Expand query with pattern synonyms
        const expanded: string[] = [...words];

        for (const word of words) {
            for (const [pattern, patternKeywords] of Object.entries(PATTERN_KEYWORDS)) {
                if (patternKeywords.includes(word) || pattern === word) {
                    expanded.push(...patternKeywords);
                }
            }
        }

        return [...new Set(expanded)];
    }

    private calculateScore(queryWords: string[], nodeKeywords: string[], node: FlowNode): { score: number; reason: string } {
        let matchCount = 0;
        const matchedWords: string[] = [];

        for (const queryWord of queryWords) {
            for (const keyword of nodeKeywords) {
                if (keyword.includes(queryWord) || queryWord.includes(keyword)) {
                    matchCount++;
                    if (!matchedWords.includes(queryWord)) {
                        matchedWords.push(queryWord);
                    }
                }
            }
        }

        // Bonus for exact label match
        const label = (node.data.label || '').toLowerCase();
        if (queryWords.some(w => label === w)) {
            matchCount += 5;
        }

        // Bonus for decision nodes when searching for conditions
        if (node.type === 'decision' && queryWords.some(w => PATTERN_KEYWORDS.condition?.includes(w))) {
            matchCount += 2;
        }

        const score = queryWords.length > 0 ? matchCount / (queryWords.length * 2) : 0;
        const reason = matchedWords.length > 0
            ? `Matched: ${matchedWords.join(', ')}`
            : 'No direct match';

        return { score: Math.min(score, 1), reason };
    }

    /**
     * Find nodes by pattern type
     */
    findByPattern(pattern: keyof typeof PATTERN_KEYWORDS): FlowNode[] {
        return this.nodes.filter(node => {
            const keywords = this.indexedNodes.get(node.id)?.keywords || [];
            return keywords.includes(pattern);
        });
    }

    /**
     * Get suggested searches based on current nodes
     */
    getSuggestions(): string[] {
        const suggestions: string[] = [];
        const patterns = new Set<string>();

        this.indexedNodes.forEach(({ keywords }) => {
            for (const pattern of Object.keys(PATTERN_KEYWORDS)) {
                if (keywords.includes(pattern)) {
                    patterns.add(pattern);
                }
            }
        });

        patterns.forEach(pattern => {
            suggestions.push(`Find ${pattern} logic`);
        });

        // Add specific function suggestions
        const functionNodes = this.nodes.filter(n => n.type === 'container' || n.type === 'input');
        functionNodes.slice(0, 3).forEach(n => {
            suggestions.push(`Go to ${n.data.label}`);
        });

        return suggestions.slice(0, 5);
    }
}
