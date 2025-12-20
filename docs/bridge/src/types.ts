
export interface SourceLocation {
    start: { line: number; column: number };
    end: { line: number; column: number };
}

// --- FlowNode Types ---

export interface FlowNode {
    id: string;
    type: 'input' | 'output' | 'default' | 'decision' | 'container';
    data: {
        label: string;
        userLabel?: string;         // User-defined label from // @logigo: comments
        sourceSnippet?: string;     // Actual source code snippet for tooltip display
        description?: string;
        sourceData?: SourceLocation;
        children?: string[];        // For container nodes: IDs of child nodes
        collapsed?: boolean;        // For container nodes: collapse state
        zoomLevel?: 'mile-high' | '1000ft' | '100ft'; // Visibility at different zoom levels
        isChildOfCollapsed?: boolean; // For nodes inside collapsed containers
    };
    position: { x: number; y: number };
    sourcePosition?: string;
    targetPosition?: string;
    className?: string;
    style?: Record<string, string | number | undefined>;
    parentNode?: string;           // For nodes inside containers
    extent?: 'parent';             // For React Flow - keep nodes inside parent
    hidden?: boolean;              // For React Flow - hide nodes (e.g., when parent collapsed)
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
    type?: 'smoothstep' | 'default';
    style?: any;
}

export interface FlowData {
    nodes: FlowNode[];
    edges: FlowEdge[];
    nodeMap: Map<string, string>;  // Maps "line:column" to nodeId
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

export function isCheckpoint(message: LogiGoMessage): message is LogiGoMessage<CheckpointPayload> & { type: 'LOGIGO_CHECKPOINT' } {
    return message.type === 'LOGIGO_CHECKPOINT';
}

export function isSessionStart(message: LogiGoMessage): message is LogiGoMessage<SessionStartPayload> & { type: 'LOGIGO_SESSION_START' } {
    return message.type === 'LOGIGO_SESSION_START';
}
