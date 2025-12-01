/**
 * Reporter API Type Definitions
 * 
 * Protocol for communication between LogiGo Studio (static analyzer)
 * and logigo-core (runtime debugger) via window.postMessage
 * 
 * Based on @logigo/bridge types - synchronized with Antigravity's spec
 */

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

// --- Reporter API (Runtime -> Studio) ---

export type LogiGoMessageType =
  | 'LOGIGO_SESSION_START'
  | 'LOGIGO_CHECKPOINT'
  | 'LOGIGO_ERROR';

export interface LogiGoMessage<T = any> {
  source: 'LOGIGO_CORE';
  type: LogiGoMessageType;
  payload: T;
}

export interface SessionStartPayload {
  sessionId: string;
  startTime: number;
  url: string;
}

export interface CheckpointPayload {
  id: string;
  timestamp: number;
  timeSinceStart: number;
  variables: Record<string, any>;
  domElement?: string;
  metadata?: Record<string, any>;
  location?: SourceLocation;
}

// Event Type Constants
export const LOGIGO_CHECKPOINT = 'LOGIGO_CHECKPOINT' as const;
export const LOGIGO_SESSION_START = 'LOGIGO_SESSION_START' as const;
export const LOGIGO_ERROR = 'LOGIGO_ERROR' as const;

// Typed Message Types
export type CheckpointMessage = LogiGoMessage<CheckpointPayload> & {
  type: typeof LOGIGO_CHECKPOINT;
};

export type SessionStartMessage = LogiGoMessage<SessionStartPayload> & {
  type: typeof LOGIGO_SESSION_START;
};

export type ReporterMessage = CheckpointMessage | SessionStartMessage;

// --- Control API (Studio -> Runtime/IDE) ---

export type ControlMessageType =
  | 'LOGIGO_JUMP_TO_LINE'
  | 'LOGIGO_WRITE_FILE'
  | 'LOGIGO_REQUEST_FILE';

export interface ControlMessage<T = any> {
  source: 'LOGIGO_STUDIO';
  type: ControlMessageType;
  payload: T;
}

export interface JumpToLinePayload {
  path: string;
  line: number;
  column?: number;
}

export interface WriteFilePayload {
  path: string;
  content: string;
}

export interface RequestFilePayload {
  path?: string;
}

// Control Message Constants
export const LOGIGO_JUMP_TO_LINE = 'LOGIGO_JUMP_TO_LINE' as const;
export const LOGIGO_WRITE_FILE = 'LOGIGO_WRITE_FILE' as const;
export const LOGIGO_REQUEST_FILE = 'LOGIGO_REQUEST_FILE' as const;

// --- Runtime State (Studio internal state) ---

export interface RuntimeState {
  isConnected: boolean;
  mode: 'static' | 'live';
  lastHeartbeat?: number;
  checkpointCount: number;
  sessionId?: string;
  sessionStartTime?: number;
  currentCheckpoint?: CheckpointPayload;
}

// --- Message Validators ---

export function isLogiGoMessage(message: any): message is LogiGoMessage {
  return (
    message &&
    typeof message === 'object' &&
    message.source === 'LOGIGO_CORE' &&
    typeof message.type === 'string' &&
    'payload' in message
  );
}

export function isCheckpoint(message: LogiGoMessage): message is CheckpointMessage {
  return message.type === LOGIGO_CHECKPOINT;
}

export function isSessionStart(message: LogiGoMessage): message is SessionStartMessage {
  return message.type === LOGIGO_SESSION_START;
}

export function isControlMessage(message: any): message is ControlMessage {
  return (
    message &&
    typeof message === 'object' &&
    message.source === 'LOGIGO_STUDIO' &&
    typeof message.type === 'string' &&
    'payload' in message
  );
}

// --- Helper Functions ---

export function createJumpToLineMessage(path: string, line: number, column?: number): ControlMessage<JumpToLinePayload> {
  return {
    source: 'LOGIGO_STUDIO',
    type: 'LOGIGO_JUMP_TO_LINE',
    payload: { path, line, column }
  };
}

export function createWriteFileMessage(path: string, content: string): ControlMessage<WriteFilePayload> {
  return {
    source: 'LOGIGO_STUDIO',
    type: 'LOGIGO_WRITE_FILE',
    payload: { path, content }
  };
}

export function createRequestFileMessage(path?: string): ControlMessage<RequestFilePayload> {
  return {
    source: 'LOGIGO_STUDIO',
    type: 'LOGIGO_REQUEST_FILE',
    payload: { path }
  };
}
