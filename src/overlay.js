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
  async checkpoint(nodeId, options = {}) {
    if (this.options.debug) {
      console.log(`[LogiGo] Checkpoint: ${nodeId}`, options);
    }

    this.activeNodeId = nodeId;
    this.updateStatus(`At: ${nodeId}`);

    // Visual Handshake: Highlight DOM element if specified
    if (options.domElement) {
      this.highlightElement(options.domElement, {
        duration: options.duration || 2000,
        color: options.color || 'gold',
        intensity: options.intensity || 'medium'
      });
    } else {
      // Fallback: Try to highlight element with matching ID
      this.highlightElement(nodeId);
    }

    // Delegate to ExecutionController for timing
    await this.executionController.checkpoint(nodeId, options);

    // Remove highlight (optional, usually handled by timeout)
    // this.removeHighlight(nodeId);
  }

  /**
   * Highlight a DOM element (Visual Handshake)
   */
  highlightElement(selector, options = {}) {
    // Ensure styles are injected
    this.injectStyles();

    let element;
    if (typeof selector === 'string') {
      // If selector doesn't start with # or ., assume it's an ID
      if (!selector.startsWith('#') && !selector.startsWith('.')) {
        element = document.getElementById(selector);
      } else {
        element = document.querySelector(selector);
      }
    } else {
      element = selector; // Assume it's an HTMLElement
    }

    if (!element) return;

    // Default options
    const duration = options.duration || 2000;
    const color = options.color || 'gold';
    const intensity = options.intensity || 'medium';

    // Map intensity to shadow size
    const shadowMap = {
      low: '0 0 10px 2px',
      medium: '0 0 20px 4px',
      high: '0 0 30px 6px'
    };
    const shadowSize = shadowMap[intensity] || shadowMap.medium;

    // Store original styles to restore later
    const originalTransition = element.style.transition;
    const originalBoxShadow = element.style.boxShadow;
    const originalOutline = element.style.outline;

    // Apply highlight styles
    element.style.transition = 'all 0.3s ease';
    element.style.boxShadow = `${shadowSize} ${color}`;
    element.style.outline = `3px solid ${color}`;
    element.classList.add('logigo-highlight-pulse');

    // Remove highlight after duration
    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      element.style.outline = originalOutline;
      element.style.transition = originalTransition;
      element.classList.remove('logigo-highlight-pulse');
    }, duration);
  }

  /**
   * Inject CSS styles for animations
   */
  injectStyles() {
    if (document.getElementById('logigo-styles')) return;

    const style = document.createElement('style');
    style.id = 'logigo-styles';
    style.textContent = `
      @keyframes logigo-highlight-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      
      .logigo-highlight-pulse {
        animation: logigo-highlight-pulse 1s ease-in-out;
        z-index: 10000;
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Remove highlight from an element
   */
  removeHighlight(nodeId) {
    const element = document.getElementById(nodeId);
    if (element) {
      element.classList.remove('logigo-highlight-pulse');
      element.style.boxShadow = '';
      element.style.outline = '';
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

// ES Module export
export default LogiGoOverlay;
