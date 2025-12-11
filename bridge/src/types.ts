
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
