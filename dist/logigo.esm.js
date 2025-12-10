/**
 * LogiGo Overlay - The Injectable Flowchart Visualizer
 * 
 * This is the core UI injection layer that creates a floating toolbar
 * in any web application to visualize code execution flow.
 */

class LogiGoOverlay {
  constructor(options = {}) {
    this.options = {
      speed: options.speed || 1.0,
      debug: options.debug || false,
      position: options.position || 'bottom-right',
      ...options
    };

    this.isPlaying = false;
    this.currentSpeed = this.options.speed;
    this.overlayElement = null;
    this.nodes = [];
    this.activeNodeId = null;

    // Initialize ExecutionController
    this.executionController = new ExecutionController({
      speed: this.options.speed,
      debug: this.options.debug
    });
  }

  /**
   * Initialize the overlay and inject it into the page
   */
  init() {
    if (this.options.debug) {
      console.log('[LogiGo] Initializing overlay...', this.options);
    }

    this.createOverlay();
    this.attachEventListeners();

    // Expose global API
    window.LogiGo = {
      checkpoint: this.checkpoint.bind(this),
      setSpeed: this.setSpeed.bind(this),
      play: this.play.bind(this),
      pause: this.pause.bind(this),
      reset: this.reset.bind(this)
    };

    if (this.options.debug) {
      console.log('[LogiGo] Overlay initialized. Use window.LogiGo to control.');
    }

    return this;
  }

  /**
   * Create the overlay DOM structure
   */
  createOverlay() {
    // Create container
    const overlay = document.createElement('div');
    overlay.id = 'logigo-overlay';
    overlay.style.cssText = `
      position: fixed;
      ${this.getPositionStyles()}
      z-index: 9999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-width: 280px;
      backdrop-filter: blur(10px);
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style="color: white; font-weight: 600; font-size: 14px;">LogiGo</span>
      </div>
      <button id="logigo-close" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;

    // Create controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    `;
    controls.innerHTML = `
      <button id="logigo-play" style="${this.getButtonStyles()}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
      <button id="logigo-pause" style="${this.getButtonStyles()}" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      </button>
      <button id="logigo-step" style="${this.getButtonStyles()}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
      <button id="logigo-reset" style="${this.getButtonStyles()}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>
    `;

    // Create speed slider
    const speedControl = document.createElement('div');
    speedControl.style.cssText = `
      margin-top: 12px;
    `;
    speedControl.innerHTML = `
      <label style="color: white; font-size: 12px; display: block; margin-bottom: 4px;">
        Speed: <span id="logigo-speed-value">${this.currentSpeed.toFixed(1)}x</span>
      </label>
      <input 
        type="range" 
        id="logigo-speed" 
        min="0.1" 
        max="2.0" 
        step="0.1" 
        value="${this.currentSpeed}"
        style="width: 100%; cursor: pointer;"
      />
    `;

    // Create status display
    const status = document.createElement('div');
    status.id = 'logigo-status';
    status.style.cssText = `
      margin-top: 12px;
      padding: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      color: white;
      font-size: 12px;
      text-align: center;
    `;
    status.textContent = 'Ready';

    // Assemble overlay
    overlay.appendChild(header);
    overlay.appendChild(controls);
    overlay.appendChild(speedControl);
    overlay.appendChild(status);

    document.body.appendChild(overlay);
    this.overlayElement = overlay;
  }

  /**
   * Get position styles based on config
   */
  getPositionStyles() {
    const positions = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    return positions[this.options.position] || positions['bottom-right'];
  }

  /**
   * Get button styles
   */
  getButtonStyles() {
    return `
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex: 1;
    `;
  }

  /**
   * Attach event listeners to controls
   */
  attachEventListeners() {
    // Play button
    document.getElementById('logigo-play')?.addEventListener('click', () => {
      this.play();
    });

    // Pause button
    document.getElementById('logigo-pause')?.addEventListener('click', () => {
      this.pause();
    });

    // Step button
    document.getElementById('logigo-step')?.addEventListener('click', () => {
      this.step();
    });

    // Reset button
    document.getElementById('logigo-reset')?.addEventListener('click', () => {
      this.reset();
    });

    // Speed slider
    document.getElementById('logigo-speed')?.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.setSpeed(speed);
      document.getElementById('logigo-speed-value').textContent = `${speed.toFixed(1)}x`;
    });

    // Close button
    document.getElementById('logigo-close')?.addEventListener('click', () => {
      this.destroy();
    });
  }

  /**
   * Checkpoint - Called by user code to pause execution
   */
  async checkpoint(nodeId) {
    if (this.options.debug) {
      console.log(`[LogiGo] Checkpoint: ${nodeId}`);
    }

    this.activeNodeId = nodeId;
    this.updateStatus(`At: ${nodeId}`);

    // Highlight corresponding DOM element if it exists
    this.highlightElement(nodeId);

    // Delegate to ExecutionController for timing
    await this.executionController.checkpoint(nodeId);

    // Remove highlight
    this.removeHighlight(nodeId);
  }

  /**
   * Highlight a DOM element
   */
  highlightElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.boxShadow = '0 0 10px 2px gold';
      element.style.transition = 'box-shadow 0.3s';
    }
  }

  /**
   * Remove highlight from element
   */
  removeHighlight(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.boxShadow = '';
    }
  }

  /**
   * Play execution
   */
  play() {
    this.isPlaying = true;
    this.executionController.play();
    this.updateStatus('Playing...');
    document.getElementById('logigo-play').disabled = true;
    document.getElementById('logigo-pause').disabled = false;
  }

  /**
   * Pause execution
   */
  pause() {
    this.isPlaying = false;
    this.executionController.pause();
    this.updateStatus('Paused');
    document.getElementById('logigo-play').disabled = false;
    document.getElementById('logigo-pause').disabled = true;
  }

  /**
   * Step through one checkpoint
   */
  step() {
    this.executionController.step();
    this.updateStatus('Stepped');
  }

  /**
   * Reset execution
   */
  reset() {
    this.isPlaying = false;
    this.activeNodeId = null;
    this.executionController.reset();
    this.updateStatus('Reset');
    document.getElementById('logigo-play').disabled = false;
    document.getElementById('logigo-pause').disabled = true;
  }

  /**
   * Set execution speed
   */
  setSpeed(speed) {
    this.currentSpeed = speed;
    this.executionController.setSpeed(speed);
    if (this.options.debug) {
      console.log(`[LogiGo] Speed set to ${speed}x`);
    }
  }

  /**
   * Update status display
   */
  updateStatus(message) {
    const statusEl = document.getElementById('logigo-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Destroy the overlay
   */
  destroy() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
    delete window.LogiGo;
    if (this.options.debug) {
      console.log('[LogiGo] Overlay destroyed');
    }
  }
}

// Auto-initialize if config is provided
if (typeof window !== 'undefined') {
  window.LogiGoOverlay = LogiGoOverlay;

  // Check for auto-init config
  if (window.logigoConfig) {
    new LogiGoOverlay(window.logigoConfig).init();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiGoOverlay;
}

/**
 * LogiGo Runtime - Execution Controller
 * 
 * Manages code execution flow with pause/step/speed control
 */

let ExecutionController$1 = class ExecutionController {
    constructor(options = {}) {
        this.options = {
            speed: options.speed || 1.0,
            debug: options.debug || false,
            ...options
        };

        this.isPaused = false;
        this.isWaitingForStep = false;
        this.currentSpeed = this.options.speed;
        this.stepResolvers = [];
        this.executionHistory = [];
    }

    /**
     * Checkpoint - Pause execution at a specific point
     * Returns a Promise that resolves based on speed/pause state
     * 
     * @param {string} nodeId - Unique identifier for this checkpoint
     * @returns {Promise<void>}
     */
    async checkpoint(nodeId) {
        if (this.options.debug) {
            console.log(`[ExecutionController] Checkpoint: ${nodeId}`);
        }

        // Record this checkpoint in history
        this.executionHistory.push({
            nodeId,
            timestamp: Date.now(),
            speed: this.currentSpeed
        });

        // If paused, wait for step or play
        if (this.isPaused) {
            if (this.options.debug) {
                console.log(`[ExecutionController] Paused at ${nodeId}, waiting for step/play`);
            }

            await this.waitForStep();
        }

        // Calculate delay based on speed
        // Speed 1.0 = 1000ms, Speed 2.0 = 500ms, Speed 0.5 = 2000ms
        const baseDelay = 1000; // 1 second base
        const delay = baseDelay / this.currentSpeed;

        if (this.options.debug) {
            console.log(`[ExecutionController] Waiting ${delay}ms at ${nodeId} (speed: ${this.currentSpeed}x)`);
        }

        // Wait for the calculated delay
        await this.sleep(delay);
    }

    /**
     * Wait for user to click "Step" or "Play"
     * @returns {Promise<void>}
     */
    waitForStep() {
        return new Promise((resolve) => {
            this.stepResolvers.push(resolve);
            this.isWaitingForStep = true;
        });
    }

    /**
     * Execute a single step (resolve one waiting checkpoint)
     */
    step() {
        if (this.stepResolvers.length > 0) {
            const resolve = this.stepResolvers.shift();
            resolve();
            this.isWaitingForStep = this.stepResolvers.length > 0;

            if (this.options.debug) {
                console.log(`[ExecutionController] Stepped (${this.stepResolvers.length} waiting)`);
            }
        }
    }

    /**
     * Resume execution (resolve all waiting checkpoints)
     */
    play() {
        this.isPaused = false;

        // Resolve all waiting step promises
        while (this.stepResolvers.length > 0) {
            const resolve = this.stepResolvers.shift();
            resolve();
        }

        this.isWaitingForStep = false;

        if (this.options.debug) {
            console.log('[ExecutionController] Playing');
        }
    }

    /**
     * Pause execution
     */
    pause() {
        this.isPaused = true;

        if (this.options.debug) {
            console.log('[ExecutionController] Paused');
        }
    }

    /**
     * Reset execution state
     */
    reset() {
        this.isPaused = false;
        this.isWaitingForStep = false;
        this.stepResolvers = [];
        this.executionHistory = [];

        if (this.options.debug) {
            console.log('[ExecutionController] Reset');
        }
    }

    /**
     * Set execution speed
     * @param {number} speed - Speed multiplier (0.1 to 2.0)
     */
    setSpeed(speed) {
        this.currentSpeed = Math.max(0.1, Math.min(2.0, speed));

        if (this.options.debug) {
            console.log(`[ExecutionController] Speed set to ${this.currentSpeed}x`);
        }
    }

    /**
     * Get current execution state
     * @returns {Object}
     */
    getState() {
        return {
            isPaused: this.isPaused,
            isWaitingForStep: this.isWaitingForStep,
            currentSpeed: this.currentSpeed,
            historyLength: this.executionHistory.length,
            waitingCheckpoints: this.stepResolvers.length
        };
    }

    /**
     * Get execution history
     * @returns {Array}
     */
    getHistory() {
        return [...this.executionHistory];
    }

    /**
     * Sleep for a specified duration
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExecutionController$1;
}

// Browser global
if (typeof window !== 'undefined') {
    window.ExecutionController = ExecutionController$1;
}

/**
 * LogiGo Parser - Lightweight AST Parser
 * 
 * Converts JavaScript code into a simplified flowchart structure
 */

class LogiGoParser {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            ...options
        };
    }

    /**
     * Parse JavaScript code into flowchart nodes
     * @param {string} code - Raw JavaScript code
     * @returns {Array} Array of flowchart nodes
     */
    parse(code) {
        if (this.options.debug) {
            console.log('[LogiGo Parser] Parsing code...');
        }

        // This is a stub implementation
        // In production, this would use acorn or @babel/parser
        const nodes = [];

        // Simple regex-based parsing for demo purposes
        const lines = code.split('\n');
        let nodeId = 0;

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//')) {
                return; // Skip empty lines and comments
            }

            // Detect function declarations
            if (trimmed.match(/^function\s+(\w+)/)) {
                const match = trimmed.match(/^function\s+(\w+)/);
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'function',
                    label: `Function: ${match[1]}`,
                    code_ref: match[1],
                    line: index + 1,
                    code: trimmed
                });
            }
            // Detect if statements
            else if (trimmed.match(/^if\s*\(/)) {
                const condition = trimmed.match(/if\s*\((.*?)\)/)?.[1] || 'condition';
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'branch',
                    label: `If: ${condition}`,
                    code_ref: `if_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
            // Detect loops
            else if (trimmed.match(/^(for|while)\s*\(/)) {
                const loopType = trimmed.match(/^(for|while)/)[1];
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'loop',
                    label: `${loopType.toUpperCase()} Loop`,
                    code_ref: `${loopType}_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
            // Detect return statements
            else if (trimmed.match(/^return\s/)) {
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'return',
                    label: 'Return',
                    code_ref: `return_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
            // Generic statement
            else if (trimmed.length > 0) {
                nodes.push({
                    id: `node_${nodeId++}`,
                    type: 'statement',
                    label: trimmed.substring(0, 30) + (trimmed.length > 30 ? '...' : ''),
                    code_ref: `stmt_${index}`,
                    line: index + 1,
                    code: trimmed
                });
            }
        });

        if (this.options.debug) {
            console.log(`[LogiGo Parser] Parsed ${nodes.length} nodes`);
        }

        return nodes;
    }

    /**
     * Parse code and return a tree structure with edges
     * @param {string} code - Raw JavaScript code
     * @returns {Object} { nodes, edges }
     */
    parseToGraph(code) {
        const nodes = this.parse(code);
        const edges = [];

        // Create simple sequential edges
        for (let i = 0; i < nodes.length - 1; i++) {
            edges.push({
                id: `edge_${i}`,
                source: nodes[i].id,
                target: nodes[i + 1].id,
                type: 'default'
            });
        }

        return { nodes, edges };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogiGoParser;
}

// Browser global
if (typeof window !== 'undefined') {
    window.LogiGoParser = LogiGoParser;
}

/**
 * LogiGo Differ - Ghost Diff Engine
 * 
 * Compares two code trees and identifies added, removed, and modified nodes
 */

class LogiGoDiffer {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            matchBy: options.matchBy || 'id', // 'id' or 'signature'
            ...options
        };
    }

    /**
     * Compare two trees and return diff information
     * @param {Array} oldTree - Previous version of the code tree
     * @param {Array} newTree - Current version of the code tree
     * @returns {Object} { nodes, stats }
     */
    diffTrees(oldTree, newTree) {
        if (this.options.debug) {
            console.log('[LogiGoDiffer] Comparing trees...', {
                oldNodes: oldTree.length,
                newNodes: newTree.length
            });
        }

        const result = {
            nodes: [],
            stats: {
                added: 0,
                removed: 0,
                modified: 0,
                unchanged: 0
            }
        };

        // Create maps for quick lookup
        const oldMap = new Map(oldTree.map(node => [this.getNodeKey(node), node]));
        const newMap = new Map(newTree.map(node => [this.getNodeKey(node), node]));

        // Process all nodes from new tree (added or modified)
        newTree.forEach(newNode => {
            const key = this.getNodeKey(newNode);
            const oldNode = oldMap.get(key);

            if (!oldNode) {
                // Node is new (added)
                result.nodes.push({
                    ...newNode,
                    diffStatus: 'added',
                    className: 'node-added'
                });
                result.stats.added++;
            } else if (this.nodesAreDifferent(oldNode, newNode)) {
                // Node exists but was modified
                result.nodes.push({
                    ...newNode,
                    diffStatus: 'modified',
                    className: 'node-modified',
                    oldValue: oldNode
                });
                result.stats.modified++;
            } else {
                // Node is unchanged
                result.nodes.push({
                    ...newNode,
                    diffStatus: 'unchanged',
                    className: 'node-unchanged'
                });
                result.stats.unchanged++;
            }
        });

        // Process nodes from old tree that are missing in new tree (deleted)
        oldTree.forEach(oldNode => {
            const key = this.getNodeKey(oldNode);
            if (!newMap.has(key)) {
                // Node was deleted (ghost)
                result.nodes.push({
                    ...oldNode,
                    diffStatus: 'deleted',
                    className: 'node-deleted'
                });
                result.stats.removed++;
            }
        });

        if (this.options.debug) {
            console.log('[LogiGoDiffer] Diff complete:', result.stats);
        }

        return result;
    }

    /**
     * Get a unique key for a node based on match strategy
     * @param {Object} node - The node to get a key for
     * @returns {string}
     */
    getNodeKey(node) {
        if (this.options.matchBy === 'signature') {
            // Match by function signature or code structure
            return this.getNodeSignature(node);
        }
        // Default: match by ID or code_ref
        return node.id || node.code_ref || node.label;
    }

    /**
     * Generate a signature for a node based on its structure
     * @param {Object} node - The node to generate a signature for
     * @returns {string}
     */
    getNodeSignature(node) {
        // Create a signature from type + label + line (if available)
        const parts = [
            node.type,
            node.label?.toLowerCase().replace(/\s+/g, '_'),
            node.line
        ].filter(Boolean);

        return parts.join('::');
    }

    /**
     * Check if two nodes are different
     * @param {Object} oldNode - Previous version of the node
     * @param {Object} newNode - Current version of the node
     * @returns {boolean}
     */
    nodesAreDifferent(oldNode, newNode) {
        // Compare relevant fields
        const fields = ['label', 'code', 'type', 'line'];

        for (const field of fields) {
            if (oldNode[field] !== newNode[field]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Apply diff classes to nodes for rendering
     * @param {Array} nodes - Nodes with diff status
     * @returns {Array} Nodes with CSS classes applied
     */
    applyDiffStyles(nodes) {
        return nodes.map(node => {
            const styles = this.getStylesForStatus(node.diffStatus);
            return {
                ...node,
                style: styles
            };
        });
    }

    /**
     * Get CSS styles for a diff status
     * @param {string} status - 'added', 'deleted', 'modified', 'unchanged'
     * @returns {Object}
     */
    getStylesForStatus(status) {
        const styleMap = {
            added: {
                border: '2px solid #28a745',
                backgroundColor: '#d4edda',
                animation: 'pulse 1s ease-in-out'
            },
            deleted: {
                border: '2px solid #dc3545',
                backgroundColor: '#f8d7da',
                opacity: '0.5'
            },
            modified: {
                border: '2px solid #ffc107',
                backgroundColor: '#fff3cd'
            },
            unchanged: {
                border: '1px solid #dee2e6',
                backgroundColor: '#f8f9fa'
            }
        };

        return styleMap[status] || styleMap.unchanged;
    }

    /**
     * Generate a summary of changes
     * @param {Object} diffResult - Result from diffTrees()
     * @returns {string}
     */
    getSummary(diffResult) {
        const { stats } = diffResult;
        const total = stats.added + stats.removed + stats.modified + stats.unchanged;

        const parts = [];
        if (stats.added > 0) parts.push(`${stats.added} added`);
        if (stats.removed > 0) parts.push(`${stats.removed} removed`);
        if (stats.modified > 0) parts.push(`${stats.modified} modified`);
        if (stats.unchanged > 0) parts.push(`${stats.unchanged} unchanged`);

        return `${total} nodes: ${parts.join(', ')}`;
    }

    /**
     * Filter nodes by diff status
     * @param {Array} nodes - Nodes with diff status
     * @param {string} status - Status to filter by
     * @returns {Array}
     */
    filterByStatus(nodes, status) {
        return nodes.filter(node => node.diffStatus === status);
    }

    /**
     * Get all changes (added + modified + deleted)
     * @param {Array} nodes - Nodes with diff status
     * @returns {Array}
     */
    getChanges(nodes) {
        return nodes.filter(node =>
            node.diffStatus === 'added' ||
            node.diffStatus === 'modified' ||
            node.diffStatus === 'deleted'
        );
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogiGoDiffer;
}

// Browser global
if (typeof window !== 'undefined') {
    window.LogiGoDiffer = LogiGoDiffer;
}

/**
 * LogiGo - Runtime Code Visualizer
 * Main entry point for the NPM package
 */


/**
 * Initialize LogiGo with options
 * @param {Object} options - Configuration options
 * @returns {Object} LogiGo API
 */
function init(options = {}) {
    const overlay = new LogiGoOverlay(options);
    overlay.init();

    return {
        overlay,
        checkpoint: overlay.checkpoint.bind(overlay),
        play: overlay.play.bind(overlay),
        pause: overlay.pause.bind(overlay),
        step: overlay.step.bind(overlay),
        reset: overlay.reset.bind(overlay),
        setSpeed: overlay.setSpeed.bind(overlay),
        destroy: overlay.destroy.bind(overlay)
    };
}

// Default export
var index = {
    init,
    LogiGoOverlay,
    ExecutionController: ExecutionController$1,
    LogiGoParser,
    LogiGoDiffer
};

export { ExecutionController$1 as ExecutionController, LogiGoDiffer, LogiGoOverlay, LogiGoParser, index as default, init };
//# sourceMappingURL=logigo.esm.js.map
