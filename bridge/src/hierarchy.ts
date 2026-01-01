/**
 * LogiGo Hierarchical Views
 * 
 * Multi-level code visualization with zoom levels:
 * - System level: File/module overview
 * - Feature level: Function groups/regions
 * - Function level: Individual statements
 */

import { FlowNode } from './parser';

export type ZoomLevel = 'system' | 'feature' | 'function' | 'statement';

export interface HierarchyNode {
    id: string;
    parentId?: string;
    level: ZoomLevel;
    label: string;
    children: string[];
    collapsed: boolean;
    originalNodes: FlowNode[];
    summary?: string;
}

export interface ViewState {
    currentZoom: ZoomLevel;
    collapsedNodes: Set<string>;
    focusedNodeId?: string;
}

// Region comment patterns for grouping
const REGION_PATTERNS = [
    /^\/\/\s*---+\s*(.+?)\s*---+/,           // // --- SECTION ---
    /^\/\/\s*#region\s+(.+)/,                  // // #region Name
    /^\/\/\s*MARK:\s*-?\s*(.+)/,              // // MARK: - Section
    /^\/\*\*?\s*@section\s+(.+)\s*\*?\*?\//,  // /** @section Name */
];

export class HierarchicalView {
    private nodes: FlowNode[];
    private hierarchy: Map<string, HierarchyNode>;
    private viewState: ViewState;

    constructor(nodes: FlowNode[]) {
        this.nodes = nodes;
        this.hierarchy = new Map();
        this.viewState = {
            currentZoom: 'function',
            collapsedNodes: new Set()
        };
        this.buildHierarchy();
    }

    private buildHierarchy(): void {
        // Level 1: System (containers/functions)
        const containers = this.nodes.filter(n => n.type === 'container');
        const standaloneNodes = this.nodes.filter(n => !n.parentNode && n.type !== 'container');

        // Create system-level node
        const systemNode: HierarchyNode = {
            id: 'system-root',
            level: 'system',
            label: 'Code Overview',
            children: containers.map(c => c.id),
            collapsed: false,
            originalNodes: this.nodes,
            summary: `${containers.length} functions, ${this.nodes.length} nodes`
        };
        this.hierarchy.set(systemNode.id, systemNode);

        // Create feature-level nodes for containers
        containers.forEach(container => {
            const childNodes = this.nodes.filter(n => n.parentNode === container.id);

            const featureNode: HierarchyNode = {
                id: container.id,
                parentId: 'system-root',
                level: 'feature',
                label: container.data.label,
                children: childNodes.map(c => c.id),
                collapsed: false,
                originalNodes: [container, ...childNodes],
                summary: `${childNodes.length} statements`
            };
            this.hierarchy.set(featureNode.id, featureNode);

            // Create function-level nodes for each statement
            childNodes.forEach(node => {
                const funcNode: HierarchyNode = {
                    id: node.id,
                    parentId: container.id,
                    level: 'function',
                    label: node.data.label,
                    children: [],
                    collapsed: false,
                    originalNodes: [node]
                };
                this.hierarchy.set(funcNode.id, funcNode);
            });
        });

        // Handle standalone nodes
        standaloneNodes.forEach(node => {
            const funcNode: HierarchyNode = {
                id: node.id,
                parentId: 'system-root',
                level: 'function',
                label: node.data.label,
                children: [],
                collapsed: false,
                originalNodes: [node]
            };
            this.hierarchy.set(funcNode.id, funcNode);
        });
    }

    /**
     * Get nodes visible at the current zoom level
     */
    getVisibleNodes(): FlowNode[] {
        const result: FlowNode[] = [];

        this.hierarchy.forEach((hNode, id) => {
            // Skip if parent is collapsed
            if (hNode.parentId && this.viewState.collapsedNodes.has(hNode.parentId)) {
                return;
            }

            // Show based on zoom level
            switch (this.viewState.currentZoom) {
                case 'system':
                    if (hNode.level === 'system' || hNode.level === 'feature') {
                        result.push(...this.createSummaryNodes(hNode));
                    }
                    break;
                case 'feature':
                    if (hNode.level !== 'statement') {
                        result.push(...this.createSummaryNodes(hNode));
                    }
                    break;
                case 'function':
                case 'statement':
                    result.push(...hNode.originalNodes);
                    break;
            }
        });

        return result;
    }

    private createSummaryNodes(hNode: HierarchyNode): FlowNode[] {
        // For collapsed or summarized nodes, create a single summary node
        if (hNode.level === 'feature' || hNode.level === 'system') {
            const firstOriginal = hNode.originalNodes[0];
            if (firstOriginal) {
                return [{
                    ...firstOriginal,
                    data: {
                        ...firstOriginal.data,
                        label: hNode.label,
                        description: hNode.summary,
                        collapsed: this.viewState.collapsedNodes.has(hNode.id),
                        children: hNode.children
                    }
                }];
            }
        }
        return hNode.originalNodes;
    }

    /**
     * Set the current zoom level
     */
    setZoomLevel(level: ZoomLevel): void {
        this.viewState.currentZoom = level;
    }

    getZoomLevel(): ZoomLevel {
        return this.viewState.currentZoom;
    }

    /**
     * Zoom in to the next detail level
     */
    zoomIn(): ZoomLevel {
        const levels: ZoomLevel[] = ['system', 'feature', 'function', 'statement'];
        const currentIndex = levels.indexOf(this.viewState.currentZoom);
        if (currentIndex < levels.length - 1) {
            this.viewState.currentZoom = levels[currentIndex + 1];
        }
        return this.viewState.currentZoom;
    }

    /**
     * Zoom out to the previous level
     */
    zoomOut(): ZoomLevel {
        const levels: ZoomLevel[] = ['system', 'feature', 'function', 'statement'];
        const currentIndex = levels.indexOf(this.viewState.currentZoom);
        if (currentIndex > 0) {
            this.viewState.currentZoom = levels[currentIndex - 1];
        }
        return this.viewState.currentZoom;
    }

    /**
     * Collapse a node and hide its children
     */
    collapse(nodeId: string): void {
        this.viewState.collapsedNodes.add(nodeId);
    }

    /**
     * Expand a collapsed node
     */
    expand(nodeId: string): void {
        this.viewState.collapsedNodes.delete(nodeId);
    }

    /**
     * Toggle collapse state
     */
    toggle(nodeId: string): boolean {
        if (this.viewState.collapsedNodes.has(nodeId)) {
            this.viewState.collapsedNodes.delete(nodeId);
            return false;
        } else {
            this.viewState.collapsedNodes.add(nodeId);
            return true;
        }
    }

    /**
     * Focus on a specific node (zoom to it)
     */
    focusNode(nodeId: string): void {
        this.viewState.focusedNodeId = nodeId;

        // Find the node and ensure its parents are expanded
        const hNode = this.hierarchy.get(nodeId);
        if (hNode?.parentId) {
            this.expand(hNode.parentId);
        }
    }

    /**
     * Get hierarchy info for a node
     */
    getNodeHierarchy(nodeId: string): HierarchyNode | undefined {
        return this.hierarchy.get(nodeId);
    }

    /**
     * Get all nodes at a specific level
     */
    getNodesAtLevel(level: ZoomLevel): HierarchyNode[] {
        return Array.from(this.hierarchy.values())
            .filter(node => node.level === level);
    }

    /**
     * Get breadcrumb path for a node
     */
    getBreadcrumb(nodeId: string): string[] {
        const path: string[] = [];
        let current = this.hierarchy.get(nodeId);

        while (current) {
            path.unshift(current.label);
            current = current.parentId ? this.hierarchy.get(current.parentId) : undefined;
        }

        return path;
    }
}
