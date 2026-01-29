/**
 * LogicProcess - BPMN Process Mapping Types
 * 
 * Data model for business process visualization with swimlanes
 */

export type RoleType = 'human' | 'system' | 'ai' | 'external';

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  color: string;
  description?: string;
}

export type StepType = 'start' | 'end' | 'task' | 'decision' | 'delay' | 'subprocess';

export interface ProcessStep {
  id: string;
  roleId: string;
  type: StepType;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  metadata?: Record<string, unknown>;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type?: 'default' | 'conditional' | 'exception';
}

export interface ProcessMap {
  id: string;
  name: string;
  description?: string;
  roles: Role[];
  steps: ProcessStep[];
  connections: Connection[];
  createdAt?: string;
  updatedAt?: string;
}

// React Flow node/edge types for rendering
export interface SwimlaneLaneData {
  role: Role;
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface ProcessNodeData {
  step: ProcessStep;
  role: Role;
  isActive?: boolean;
  isHighlighted?: boolean;
  [key: string]: unknown;
}

// Layout configuration
export interface LayoutConfig {
  laneWidth: number;
  laneGap: number;
  nodeWidth: number;
  nodeHeight: number;
  verticalGap: number;
  horizontalPadding: number;
  headerHeight: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  laneWidth: 280,
  laneGap: 8,
  nodeWidth: 180,
  nodeHeight: 60,
  verticalGap: 80,
  horizontalPadding: 50,
  headerHeight: 48,
};

// Default role colors
export const ROLE_COLORS: Record<RoleType, string> = {
  human: '#3b82f6',
  system: '#10b981',
  ai: '#a855f7',
  external: '#f59e0b',
};

// Sample process for MVP - Customer Refund Flow
export const SAMPLE_REFUND_PROCESS: ProcessMap = {
  id: 'refund-flow-001',
  name: 'Customer Refund Process',
  description: 'Standard workflow for processing customer refund requests',
  roles: [
    { id: 'customer', name: 'Customer', type: 'human', color: ROLE_COLORS.human },
    { id: 'support', name: 'Support Agent', type: 'human', color: '#06b6d4' },
    { id: 'system', name: 'Order System', type: 'system', color: ROLE_COLORS.system },
    { id: 'finance', name: 'Finance Team', type: 'human', color: '#ec4899' },
  ],
  steps: [
    { id: 'start', roleId: 'customer', type: 'start', name: 'Request Refund', position: { x: 0, y: 0 } },
    { id: 'submit-form', roleId: 'customer', type: 'task', name: 'Submit Refund Form', position: { x: 0, y: 1 } },
    { id: 'receive-confirmation', roleId: 'customer', type: 'task', name: 'Receive Confirmation', position: { x: 0, y: 6 } },
    { id: 'end-approved', roleId: 'customer', type: 'end', name: 'Refund Complete', position: { x: 0, y: 7 } },
    { id: 'review-request', roleId: 'support', type: 'task', name: 'Review Request', position: { x: 0, y: 2 } },
    { id: 'check-eligibility', roleId: 'support', type: 'decision', name: 'Eligible?', position: { x: 0, y: 3 } },
    { id: 'reject-request', roleId: 'support', type: 'task', name: 'Send Rejection', position: { x: 1, y: 4 } },
    { id: 'end-rejected', roleId: 'support', type: 'end', name: 'Request Closed', position: { x: 1, y: 5 } },
    { id: 'validate-order', roleId: 'system', type: 'task', name: 'Validate Order', position: { x: 0, y: 2.5 } },
    { id: 'check-policy', roleId: 'system', type: 'task', name: 'Check Return Policy', position: { x: 0, y: 3 } },
    { id: 'approve-refund', roleId: 'finance', type: 'task', name: 'Approve Refund', position: { x: 0, y: 4 } },
    { id: 'process-payment', roleId: 'finance', type: 'task', name: 'Process Payment', position: { x: 0, y: 5 } },
  ],
  connections: [
    { id: 'c1', sourceId: 'start', targetId: 'submit-form' },
    { id: 'c2', sourceId: 'submit-form', targetId: 'review-request' },
    { id: 'c3', sourceId: 'review-request', targetId: 'validate-order' },
    { id: 'c4', sourceId: 'validate-order', targetId: 'check-policy' },
    { id: 'c5', sourceId: 'check-policy', targetId: 'check-eligibility' },
    { id: 'c6', sourceId: 'check-eligibility', targetId: 'approve-refund', label: 'Yes' },
    { id: 'c7', sourceId: 'check-eligibility', targetId: 'reject-request', label: 'No' },
    { id: 'c8', sourceId: 'reject-request', targetId: 'end-rejected' },
    { id: 'c9', sourceId: 'approve-refund', targetId: 'process-payment' },
    { id: 'c10', sourceId: 'process-payment', targetId: 'receive-confirmation' },
    { id: 'c11', sourceId: 'receive-confirmation', targetId: 'end-approved' },
  ],
};

// Ralph Wiggum Loop Process Template - visualizes the AI coding loop
export const RALPH_LOOP_PROCESS: ProcessMap = {
  id: 'ralph-loop-001',
  name: 'Ralph Wiggum AI Coding Loop',
  description: 'Persistent AI coding workflow with iterative completion',
  roles: [
    { id: 'developer', name: 'Developer', type: 'human', color: ROLE_COLORS.human },
    { id: 'ai-agent', name: 'AI Agent', type: 'ai', color: ROLE_COLORS.ai },
    { id: 'system', name: 'Build System', type: 'system', color: ROLE_COLORS.system },
  ],
  steps: [
    { id: 'start', roleId: 'developer', type: 'start', name: 'Define Task', position: { x: 0, y: 0 } },
    { id: 'create-prompt', roleId: 'developer', type: 'task', name: 'Create PROMPT.md', position: { x: 0, y: 1 } },
    { id: 'create-plan', roleId: 'developer', type: 'task', name: 'Create plan.md', position: { x: 0, y: 2 } },
    { id: 'review-output', roleId: 'developer', type: 'task', name: 'Review Output', position: { x: 0, y: 7 } },
    { id: 'end-complete', roleId: 'developer', type: 'end', name: 'Task Complete', position: { x: 0, y: 8 } },
    
    { id: 'read-prompt', roleId: 'ai-agent', type: 'task', name: 'Read PROMPT.md', position: { x: 0, y: 3 } },
    { id: 'make-changes', roleId: 'ai-agent', type: 'task', name: 'Make Code Changes', position: { x: 0, y: 4 } },
    { id: 'check-criteria', roleId: 'ai-agent', type: 'decision', name: 'Criteria Met?', position: { x: 0, y: 5 } },
    { id: 'update-progress', roleId: 'ai-agent', type: 'task', name: 'Update progress.md', position: { x: 1, y: 5 } },
    
    { id: 'run-tests', roleId: 'system', type: 'task', name: 'Run Tests', position: { x: 0, y: 4.5 } },
    { id: 'restart-loop', roleId: 'system', type: 'subprocess', name: 'Restart Loop', position: { x: 1, y: 6 } },
  ],
  connections: [
    { id: 'c1', sourceId: 'start', targetId: 'create-prompt' },
    { id: 'c2', sourceId: 'create-prompt', targetId: 'create-plan' },
    { id: 'c3', sourceId: 'create-plan', targetId: 'read-prompt' },
    { id: 'c4', sourceId: 'read-prompt', targetId: 'make-changes' },
    { id: 'c5', sourceId: 'make-changes', targetId: 'run-tests' },
    { id: 'c6', sourceId: 'run-tests', targetId: 'check-criteria' },
    { id: 'c7', sourceId: 'check-criteria', targetId: 'review-output', label: 'Yes' },
    { id: 'c8', sourceId: 'check-criteria', targetId: 'update-progress', label: 'No' },
    { id: 'c9', sourceId: 'update-progress', targetId: 'restart-loop' },
    { id: 'c10', sourceId: 'restart-loop', targetId: 'read-prompt' },
    { id: 'c11', sourceId: 'review-output', targetId: 'end-complete' },
  ],
};
