/**
 * LogicProcess Layout Engine
 * 
 * Auto-positions process steps in swimlanes using topological sort
 */

import type { Node, Edge } from '@xyflow/react';
import type { 
  ProcessMap, 
  ProcessStep, 
  Role, 
  Connection,
  LayoutConfig, 
  ProcessNodeData,
  SwimlaneLaneData
} from '@/types/process';
import { DEFAULT_LAYOUT_CONFIG } from '@/types/process';

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  dimensions: { width: number; height: number };
}

function topologicalSort(steps: ProcessStep[], connections: Connection[]): ProcessStep[] {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();
  const stepMap = new Map<string, ProcessStep>();
  
  steps.forEach(step => {
    inDegree.set(step.id, 0);
    adjacencyList.set(step.id, []);
    stepMap.set(step.id, step);
  });
  
  connections.forEach(conn => {
    adjacencyList.get(conn.sourceId)?.push(conn.targetId);
    inDegree.set(conn.targetId, (inDegree.get(conn.targetId) || 0) + 1);
  });
  
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });
  
  const sorted: ProcessStep[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const step = stepMap.get(current);
    if (step) sorted.push(step);
    
    adjacencyList.get(current)?.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }
  
  return sorted.length === steps.length ? sorted : steps;
}

function calculateLevels(steps: ProcessStep[], connections: Connection[]): Map<string, number> {
  const levels = new Map<string, number>();
  const sorted = topologicalSort(steps, connections);
  
  const parents = new Map<string, string[]>();
  steps.forEach(s => parents.set(s.id, []));
  connections.forEach(c => parents.get(c.targetId)?.push(c.sourceId));
  
  sorted.forEach(step => {
    const parentIds = parents.get(step.id) || [];
    if (parentIds.length === 0) {
      levels.set(step.id, 0);
    } else {
      const maxParentLevel = Math.max(...parentIds.map(p => levels.get(p) || 0));
      levels.set(step.id, maxParentLevel + 1);
    }
  });
  
  return levels;
}

export function layoutProcess(
  processMap: ProcessMap,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutResult {
  const { roles, steps, connections } = processMap;
  const levels = calculateLevels(steps, connections);
  
  const laneIndex = new Map<string, number>();
  roles.forEach((role, idx) => laneIndex.set(role.id, idx));
  
  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  const totalWidth = roles.length * (config.laneWidth + config.laneGap) - config.laneGap;
  const totalHeight = config.headerHeight + (maxLevel + 2) * config.verticalGap;
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Create swimlane background nodes
  roles.forEach((role, idx) => {
    const laneX = idx * (config.laneWidth + config.laneGap);
    nodes.push({
      id: `lane-${role.id}`,
      type: 'swimlane',
      position: { x: laneX, y: 0 },
      data: { role, width: config.laneWidth, height: totalHeight } as SwimlaneLaneData,
      draggable: false,
      selectable: false,
      style: { zIndex: -1 },
    });
  });
  
  // Create process step nodes
  steps.forEach(step => {
    const laneIdx = laneIndex.get(step.roleId) ?? 0;
    const level = levels.get(step.id) ?? 0;
    const role = roles.find(r => r.id === step.roleId)!;
    
    const laneX = laneIdx * (config.laneWidth + config.laneGap);
    const nodeX = laneX + (config.laneWidth - config.nodeWidth) / 2;
    const nodeY = config.headerHeight + level * config.verticalGap + config.verticalGap / 2;
    
    nodes.push({
      id: step.id,
      type: 'processNode',
      position: { x: nodeX, y: nodeY },
      data: { step, role } as ProcessNodeData,
    });
  });
  
  // Create edges
  connections.forEach(conn => {
    edges.push({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      label: conn.label,
      type: 'smoothstep',
      style: { 
        stroke: conn.type === 'exception' ? '#ef4444' : '#64748b',
        strokeWidth: 2,
      },
      labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 },
      labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
      labelBgPadding: [4, 8] as [number, number],
      labelBgBorderRadius: 4,
    });
  });
  
  return { nodes, edges, dimensions: { width: totalWidth, height: totalHeight } };
}
