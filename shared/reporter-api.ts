/**
 * Reporter API Type Definitions
 * 
 * Protocol for communication between LogiGo Studio (static analyzer)
 * and logigo-core (runtime debugger) via window.postMessage
 * 
 * Based on Antigravity's "Handshake Protocol" specification
 */

// Message Types
export type ReporterMessage =
  | HandshakeMessage
  | CheckpointMessage
  | StateUpdateMessage
  | ExecutionCompleteMessage
  | ExecutionErrorMessage;

// Handshake Protocol
export interface HandshakeMessage {
  type: 'logigo:handshake';
  version: string;
  source: 'logigo-core';
  timestamp: number;
}

// Checkpoint Event (when checkpoint() is called in user code)
export interface CheckpointMessage {
  type: 'logigo:checkpoint';
  id: string;
  label?: string;
  data: {
    line?: number;
    column?: number;
    file?: string;
    functionName?: string;
    scope?: string;
    variables?: Record<string, any>;
    domElement?: string; // CSS selector for Visual Handshake
  };
  timestamp: number;
  sequence: number; // Execution order
}

// State Update (variable changes, loop iterations, etc.)
export interface StateUpdateMessage {
  type: 'logigo:state';
  variables: Record<string, VariableState>;
  callStack: CallFrame[];
  timestamp: number;
}

export interface VariableState {
  name: string;
  value: any;
  type: string;
  scope: 'global' | 'local' | 'closure';
  changed: boolean; // Highlights recent changes
}

export interface CallFrame {
  functionName: string;
  file?: string;
  line?: number;
  column?: number;
}

// Execution Complete
export interface ExecutionCompleteMessage {
  type: 'logigo:complete';
  totalCheckpoints: number;
  duration: number;
  timestamp: number;
}

// Execution Error
export interface ExecutionErrorMessage {
  type: 'logigo:error';
  error: {
    message: string;
    stack?: string;
    line?: number;
    column?: number;
  };
  timestamp: number;
}

// Studio Response Messages (Studio → logigo-core)
export type StudioMessage =
  | StudioReadyMessage
  | StudioPauseMessage
  | StudioResumeMessage;

export interface StudioReadyMessage {
  type: 'logigo-studio:ready';
  version: string;
  capabilities: string[];
}

export interface StudioPauseMessage {
  type: 'logigo-studio:pause';
}

export interface StudioResumeMessage {
  type: 'logigo-studio:resume';
}

// Runtime Mode State
export interface RuntimeState {
  isConnected: boolean;
  mode: 'static' | 'live';
  lastHeartbeat?: number;
  checkpointCount: number;
  currentCheckpoint?: CheckpointMessage;
}

// Message validator
export function isReporterMessage(message: any): message is ReporterMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    message.type.startsWith('logigo:')
  );
}

// Message type guards
export function isHandshake(message: ReporterMessage): message is HandshakeMessage {
  return message.type === 'logigo:handshake';
}

export function isCheckpoint(message: ReporterMessage): message is CheckpointMessage {
  return message.type === 'logigo:checkpoint';
}

export function isStateUpdate(message: ReporterMessage): message is StateUpdateMessage {
  return message.type === 'logigo:state';
}

export function isExecutionComplete(message: ReporterMessage): message is ExecutionCompleteMessage {
  return message.type === 'logigo:complete';
}

export function isExecutionError(message: ReporterMessage): message is ExecutionErrorMessage {
  return message.type === 'logigo:error';
}
