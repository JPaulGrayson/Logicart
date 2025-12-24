/**
 * LogiGo Visual Handshake - Control Channel Types
 * 
 * Bidirectional WebSocket messages between Studio and remote apps.
 */

export type ControlMessageType = 
  | 'HIGHLIGHT_ELEMENT'
  | 'CONFIRM_HIGHLIGHT'
  | 'REMOTE_FOCUS'
  | 'PING'
  | 'PONG';

export interface HighlightElementMessage {
  type: 'HIGHLIGHT_ELEMENT';
  checkpointId: string;
  nodeId?: string;
  line?: number;
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
  | PingMessage
  | PongMessage;

export type StudioToRemoteMessage = HighlightElementMessage | PingMessage;
export type RemoteToStudioMessage = ConfirmHighlightMessage | RemoteFocusMessage | PongMessage;
