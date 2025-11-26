/**
 * Reporter API Type Definitions
 * 
 * Protocol for communication between LogiGo Studio (static analyzer)
 * and logigo-core (runtime debugger) via window.postMessage
 * 
 * Based on Antigravity's Reporter API Specification v1.0.0-beta.2
 */

// Message Envelope (all messages from logigo-core follow this structure)
export interface LogiGoMessage<T = any> {
  source: 'LOGIGO_CORE';
  type: string;
  payload: T;
}

// Event Types
export const LOGIGO_CHECKPOINT = 'LOGIGO_CHECKPOINT' as const;
export const LOGIGO_SESSION_START = 'LOGIGO_SESSION_START' as const;

// Checkpoint Event Payload
export interface CheckpointPayload {
  id: string;
  timestamp: number;
  timeSinceStart: number;
  variables: Record<string, any>;
  domElement?: string;
  metadata?: Record<string, any>;
}

// Session Start Event Payload
export interface SessionStartPayload {
  sessionId: string;
  startTime: number;
  url: string;
}

// Typed Message Types
export type CheckpointMessage = LogiGoMessage<CheckpointPayload> & {
  type: typeof LOGIGO_CHECKPOINT;
};

export type SessionStartMessage = LogiGoMessage<SessionStartPayload> & {
  type: typeof LOGIGO_SESSION_START;
};

export type ReporterMessage = CheckpointMessage | SessionStartMessage;

// Runtime Mode State (Studio internal state)
export interface RuntimeState {
  isConnected: boolean;
  mode: 'static' | 'live';
  lastHeartbeat?: number;
  checkpointCount: number;
  sessionId?: string;
  sessionStartTime?: number;
  currentCheckpoint?: CheckpointPayload;
}

// Message validator
export function isLogiGoMessage(message: any): message is LogiGoMessage {
  return (
    message &&
    typeof message === 'object' &&
    message.source === 'LOGIGO_CORE' &&
    typeof message.type === 'string' &&
    'payload' in message
  );
}

// Message type guards
export function isCheckpoint(message: LogiGoMessage): message is CheckpointMessage {
  return message.type === LOGIGO_CHECKPOINT;
}

export function isSessionStart(message: LogiGoMessage): message is SessionStartMessage {
  return message.type === LOGIGO_SESSION_START;
}
