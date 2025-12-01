/**
 * Parser module - re-exports from @logigo/bridge
 * 
 * This module uses the shared bridge package for parsing,
 * ensuring consistency across Replit, VS Code, and Antigravity IDEs.
 * 
 * NOTE: In a production npm setup, this would be:
 * export * from '@logigo/bridge';
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
