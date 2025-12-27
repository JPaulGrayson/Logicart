export interface LogiGoManifest {
  version: '1.0';
  hash: string;
  generatedAt: number;
  
  files: {
    [path: string]: {
      checksum: string;
      functions: string[];
    }
  };
  
  nodes: FlowNode[];
  edges: FlowEdge[];
  
  checkpoints: {
    [nodeId: string]: CheckpointMetadata;
  };
  
  breakpointDefaults?: string[];
}

export interface FlowNode {
  id: string;
  type: 'default' | 'decision' | 'input' | 'output' | 'container';
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: 'statement' | 'decision' | 'loop' | 'function' | 'return';
    sourceFile: string;
    sourceLine: number;
    sourceColumn: number;
    code?: string;
  };
  style?: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'smoothstep' | 'straight' | 'step';
  label?: string;
  animated?: boolean;
}

export interface CheckpointMetadata {
  file: string;
  line: number;
  column: number;
  label: string;
  type: 'statement' | 'decision' | 'loop' | 'function' | 'return';
  parentFunction: string;
  capturedVariables: string[];
  isArrowImplicitReturn?: boolean;
  arrowBodyEnd?: number;
}

export interface LogiGoPluginOptions {
  include?: string[];
  exclude?: string[];
  manifestPath?: string;
  autoInstrument?: boolean;
  captureVariables?: boolean;
}

export interface InstrumentResult {
  code: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  checkpoints: Record<string, CheckpointMetadata>;
  functions: string[];
}
