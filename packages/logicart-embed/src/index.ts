export { LogicArtEmbed, default } from './LogicArtEmbed';
export { LogicArtEmbed as LogiGoEmbed } from './LogicArtEmbed';
export type { 
  LogicArtEmbedProps,
  LogicArtEmbedProps as LogiGoEmbedProps,
  EmbedState, 
  CheckpointEntry,
  CheckpointPayload,
  LogicArtManifest,
  LogicArtManifest as LogiGoManifest,
  FlowNode,
  FlowEdge,
  CheckpointMetadata
} from './types';

declare global {
  interface Window {
    LogicArtEmbed?: {
      init: (options: import('./types').LogicArtEmbedProps & { container?: string }) => void;
    };
    LogiGoEmbed?: {
      init: (options: import('./types').LogicArtEmbedProps & { container?: string }) => void;
    };
  }
}

if (typeof window !== 'undefined') {
  const initFn = (options: import('./types').LogicArtEmbedProps & { container?: string }) => {
    console.log('[LogicArt] Initialized with options:', options);
  };
  window.LogicArtEmbed = { init: initFn };
  window.LogiGoEmbed = { init: initFn };
}
