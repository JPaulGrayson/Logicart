export interface LogiGoEmbedProps {
  code: string;
  
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  defaultOpen?: boolean;
  defaultSize?: { width: number; height: number };
  
  showVariables?: boolean;
  showControls?: boolean;
  showMinimap?: boolean;
  
  theme?: 'dark' | 'light' | 'auto';
  
  onNodeClick?: (nodeId: string) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
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
