export interface LogicArtEmbedProps {
  code?: string;
  
  manifestUrl?: string;
  manifestHash?: string;
  
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  defaultOpen?: boolean;
  defaultSize?: { width: number; height: number };
  
  showVariables?: boolean;
  showControls?: boolean;
  showMinimap?: boolean;
  showHistory?: boolean;
  
  focusFile?: string;
  focusFunction?: string;
  
  theme?: 'dark' | 'light' | 'auto';
  
  onNodeClick?: (nodeId: string) => void;
  onCheckpoint?: (checkpoint: CheckpointPayload) => void;
  onManifestLoad?: (manifest: LogicArtManifest) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export type LogiGoEmbedProps = LogicArtEmbedProps;

export interface CheckpointPayload {
  id: string;
  timestamp: number;
  variables: Record<string, any>;
  manifestVersion?: string;
}

export interface LogicArtManifest {
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
}

export type LogiGoManifest = LogicArtManifest;

export interface FlowNode {
  id: string;
  type: 'default' | 'decision' | 'input' | 'output' | 'container';
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType?: string;
    sourceFile?: string;
    sourceLine?: number;
    sourceColumn?: number;
  };
  style?: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface CheckpointMetadata {
  file: string;
  line: number;
  column: number;
  label: string;
  type: string;
  parentFunction: string;
  capturedVariables: string[];
}

export interface EmbedState {
  isOpen: boolean;
  size: { width: number; height: number };
  activeNodeId: string | null;
  variables: Record<string, any>;
  checkpointHistory: CheckpointEntry[];
}

export interface CheckpointEntry {
  id: string;
  timestamp: number;
  variables: Record<string, any>;
}
