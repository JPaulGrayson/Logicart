import type { Plugin, ResolvedConfig } from 'vite';
import { instrumentFile } from './instrumenter';
import { generateFileChecksum, generateManifestHash } from './hash';
import type { LogiGoManifest, LogiGoPluginOptions, FlowNode, FlowEdge, CheckpointMetadata } from './types';

export type { LogiGoManifest, LogiGoPluginOptions, FlowNode, FlowEdge, CheckpointMetadata };

interface FileData {
  checksum: string;
  functions: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  checkpoints: Record<string, CheckpointMetadata>;
}

export function logigoPlugin(options: LogiGoPluginOptions = {}): Plugin {
  const {
    include = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    exclude = ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
    manifestPath = 'logigo-manifest.json',
    autoInstrument = true,
    captureVariables = true
  } = options;
  
  const fileDataMap = new Map<string, FileData>();
  let config: ResolvedConfig;
  let manifestHash = '';
  
  function shouldInstrument(id: string): boolean {
    if (exclude.some(pattern => minimatch(id, pattern))) {
      return false;
    }
    return include.some(pattern => minimatch(id, pattern));
  }
  
  return {
    name: 'logigo-vite-plugin',
    
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    
    transform(code: string, id: string) {
      if (!autoInstrument) return null;
      if (!shouldInstrument(id)) return null;
      if (id.includes('logigo-')) return null;
      
      const relativePath = id.replace(config.root + '/', '');
      
      try {
        const result = instrumentFile(code, relativePath);
        
        if (result.nodes.length > 0) {
          fileDataMap.set(relativePath, {
            checksum: generateFileChecksum(code),
            functions: result.functions,
            nodes: result.nodes,
            edges: result.edges,
            checkpoints: result.checkpoints
          });
        }
        
        return {
          code: result.code,
          map: null
        };
      } catch (error) {
        console.warn(`[LogiGo] Failed to instrument ${relativePath}:`, error);
        return null;
      }
    },
    
    generateBundle() {
      const allNodes: FlowNode[] = [];
      const allEdges: FlowEdge[] = [];
      const allCheckpoints: Record<string, CheckpointMetadata> = {};
      const files: Record<string, { checksum: string; functions: string[] }> = {};
      const checksums: string[] = [];
      
      for (const [path, data] of fileDataMap) {
        files[path] = {
          checksum: data.checksum,
          functions: data.functions
        };
        checksums.push(data.checksum);
        
        allNodes.push(...data.nodes);
        allEdges.push(...data.edges);
        Object.assign(allCheckpoints, data.checkpoints);
      }
      
      manifestHash = generateManifestHash(checksums);
      
      const manifest: LogiGoManifest = {
        version: '1.0',
        hash: manifestHash,
        generatedAt: Date.now(),
        files,
        nodes: allNodes,
        edges: allEdges,
        checkpoints: allCheckpoints
      };
      
      this.emitFile({
        type: 'asset',
        fileName: manifestPath,
        source: JSON.stringify(manifest, null, 2)
      });
      
      const runtimeInit = `
;(function() {
  var MANIFEST_HASH = '${manifestHash}';
  var MANIFEST_URL = '/${manifestPath}';
  
  window.__LOGIGO_MANIFEST_HASH__ = MANIFEST_HASH;
  window.__LOGIGO_MANIFEST_URL__ = MANIFEST_URL;
  
  function generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  function safeSerialize(obj) {
    var result = {};
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      try {
        var value = obj[key];
        if (value === undefined) {
          result[key] = undefined;
        } else if (value === null) {
          result[key] = null;
        } else if (typeof value === 'function') {
          result[key] = '[Function]';
        } else if (typeof value === 'symbol') {
          result[key] = value.toString();
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            result[key] = value.slice(0, 100).map(function(v) {
              return typeof v === 'object' ? '[Object]' : v;
            });
          } else {
            result[key] = '[Object]';
          }
        } else {
          result[key] = value;
        }
      } catch (e) {
        result[key] = '[Error serializing]';
      }
    }
    return result;
  }
  
  var LogiGoRuntime = {
    _queue: [],
    _flushScheduled: false,
    _sessionId: generateSessionId(),
    _manifestHash: MANIFEST_HASH,
    _breakpoints: {},
    _started: false,
    _pauseResolve: null,
    
    start: function() {
      if (this._started) return;
      this._started = true;
      this._postMessage('LOGIGO_SESSION_START', {
        sessionId: this._sessionId,
        manifestHash: this._manifestHash,
        timestamp: Date.now()
      });
    },
    
    end: function() {
      if (!this._started) return;
      this._flush();
      this._postMessage('LOGIGO_SESSION_END', {
        sessionId: this._sessionId,
        timestamp: Date.now()
      });
      this._started = false;
    },
    
    checkpoint: function(id, variables) {
      if (!this._started) this.start();
      
      this._queue.push({
        id: id,
        variables: variables ? safeSerialize(variables) : {},
        timestamp: Date.now(),
        manifestVersion: this._manifestHash
      });
      
      if (!this._flushScheduled) {
        this._flushScheduled = true;
        queueMicrotask(this._flush.bind(this));
      }
    },
    
    checkpointAsync: function(id, variables) {
      var self = this;
      this.checkpoint(id, variables);
      
      var bp = this._breakpoints[id];
      if (bp && bp.enabled) {
        return new Promise(function(resolve) {
          self._pauseResolve = resolve;
        });
      }
      return Promise.resolve();
    },
    
    setBreakpoint: function(id, enabled, condition) {
      this._breakpoints[id] = { id: id, enabled: enabled !== false, condition: condition };
    },
    
    removeBreakpoint: function(id) {
      delete this._breakpoints[id];
    },
    
    clearBreakpoints: function() {
      this._breakpoints = {};
    },
    
    resume: function() {
      if (this._pauseResolve) {
        this._pauseResolve();
        this._pauseResolve = null;
      }
    },
    
    _flush: function() {
      var batch = this._queue.splice(0);
      this._flushScheduled = false;
      var self = this;
      
      batch.forEach(function(data) {
        self._postMessage('LOGIGO_CHECKPOINT', data);
      });
    },
    
    _postMessage: function(type, payload) {
      if (typeof window !== 'undefined') {
        window.postMessage({
          source: 'LOGIGO_CORE',
          type: type,
          payload: payload
        }, '*');
      }
    }
  };
  
  window.LogiGo = LogiGoRuntime;
  
  LogiGoRuntime._postMessage('LOGIGO_MANIFEST_READY', {
    manifestUrl: MANIFEST_URL + '?v=' + MANIFEST_HASH,
    manifestHash: MANIFEST_HASH,
    sessionId: LogiGoRuntime._sessionId
  });
})();
`;
      
      this.emitFile({
        type: 'asset',
        fileName: 'logigo-runtime.js',
        source: runtimeInit
      });
      
      console.log(`[LogiGo] Generated manifest with ${allNodes.length} nodes from ${fileDataMap.size} files`);
    },
    
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { src: '/logigo-runtime.js' },
            injectTo: 'head'
          }
        ]
      };
    }
  };
}

function minimatch(path: string, pattern: string): boolean {
  if (pattern.startsWith('**/')) {
    const suffix = pattern.slice(3);
    if (suffix.startsWith('*.')) {
      const ext = suffix.slice(1);
      return path.endsWith(ext);
    }
    return path.includes(suffix.replace('**/', ''));
  }
  
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
    );
    return regex.test(path);
  }
  
  return path === pattern || path.endsWith(pattern);
}

export default logigoPlugin;
