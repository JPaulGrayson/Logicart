export interface CheckpointData {
  id: string;
  rawVariables: Record<string, any>;
  variables?: Record<string, any>;
  timestamp: number;
  manifestVersion: string;
}

export interface RuntimeOptions {
  manifestHash?: string;
  bufferSize?: number;
  enableBreakpoints?: boolean;
}

export interface Breakpoint {
  id: string;
  enabled: boolean;
  condition?: string;
}

export interface LogiGoMessage {
  source: 'LOGIGO_CORE';
  type: 'LOGIGO_CHECKPOINT' | 'LOGIGO_SESSION_START' | 'LOGIGO_SESSION_END' | 'LOGIGO_MANIFEST_READY';
  payload: any;
}
