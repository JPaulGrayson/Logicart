/**
 * LogicArt Bidirectional Control Channel Types
 * 
 * WebSocket messages between Studio and remote apps for:
 * - Visual Handshake (highlight DOM elements)
 * - Remote Pause/Resume (breakpoints)
 * - Connection management
 */

export type ControlMessageType = 
  | 'HIGHLIGHT_ELEMENT'
  | 'CONFIRM_HIGHLIGHT'
  | 'REMOTE_FOCUS'
  | 'SET_BREAKPOINT'
  | 'REMOVE_BREAKPOINT'
  | 'CLEAR_BREAKPOINTS'
  | 'PAUSE'
  | 'RESUME'
  | 'STEP'
  | 'PAUSED_AT'
  | 'RESUMED'
  | 'BREAKPOINTS_UPDATED'
  | 'PING'
  | 'PONG';

// Visual Handshake Messages
export interface HighlightElementMessage {
  type: 'HIGHLIGHT_ELEMENT';
  checkpointId: string;
  nodeId?: string;
  line?: number;
  domSelector?: string;
}

export interface ConfirmHighlightMessage {
  type: 'CONFIRM_HIGHLIGHT';
  checkpointId: string;
  success: boolean;
  elementSelector?: string;
}

export interface RemoteFocusMessage {
  type: 'REMOTE_FOCUS';
  checkpointId: string;
  line?: number;
}

// Breakpoint Control Messages (Studio → Remote)
export interface SetBreakpointMessage {
  type: 'SET_BREAKPOINT';
  checkpointId: string;
}

export interface RemoveBreakpointMessage {
  type: 'REMOVE_BREAKPOINT';
  checkpointId: string;
}

export interface ClearBreakpointsMessage {
  type: 'CLEAR_BREAKPOINTS';
}

export interface PauseMessage {
  type: 'PAUSE';
}

export interface ResumeMessage {
  type: 'RESUME';
}

export interface StepMessage {
  type: 'STEP';
}

// Execution State Messages (Remote → Studio)
export interface PausedAtMessage {
  type: 'PAUSED_AT';
  checkpointId: string;
  variables: Record<string, any>;
}

export interface ResumedMessage {
  type: 'RESUMED';
}

export interface BreakpointsUpdatedMessage {
  type: 'BREAKPOINTS_UPDATED';
  breakpoints: string[];
}

// Connection Messages
export interface PingMessage {
  type: 'PING';
  timestamp: number;
}

export interface PongMessage {
  type: 'PONG';
  timestamp: number;
}

export type ControlMessage = 
  | HighlightElementMessage
  | ConfirmHighlightMessage
  | RemoteFocusMessage
  | SetBreakpointMessage
  | RemoveBreakpointMessage
  | ClearBreakpointsMessage
  | PauseMessage
  | ResumeMessage
  | StepMessage
  | PausedAtMessage
  | ResumedMessage
  | BreakpointsUpdatedMessage
  | PingMessage
  | PongMessage;

export type StudioToRemoteMessage = 
  | HighlightElementMessage 
  | SetBreakpointMessage 
  | RemoveBreakpointMessage 
  | ClearBreakpointsMessage
  | PauseMessage
  | ResumeMessage 
  | StepMessage
  | PingMessage;

export type RemoteToStudioMessage = 
  | ConfirmHighlightMessage 
  | RemoteFocusMessage 
  | PausedAtMessage
  | ResumedMessage
  | BreakpointsUpdatedMessage
  | PongMessage;
