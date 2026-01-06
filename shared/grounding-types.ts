/**
 * LogicArt Grounding Layer Types
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
