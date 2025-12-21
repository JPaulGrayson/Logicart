export { LogiGoEmbed, default } from './LogiGoEmbed';
export type { 
  LogiGoEmbedProps, 
  EmbedState, 
  CheckpointEntry,
  CheckpointPayload,
  LogiGoManifest,
  FlowNode,
  FlowEdge,
  CheckpointMetadata
} from './types';

declare global {
  interface Window {
    LogiGoEmbed?: {
      init: (options: import('./types').LogiGoEmbedProps & { container?: string }) => void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.LogiGoEmbed = {
    init: (options) => {
      console.log('[LogiGo] Initialized with options:', options);
    }
  };
}
