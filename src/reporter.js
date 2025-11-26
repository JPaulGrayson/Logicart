/**
 * LogiGo Reporter - Checkpoint Data Capture System
 * 
 * Captures and reports checkpoint execution data for AI agent analysis
 */

class LogiGoReporter {
  constructor(options = {}) {
    this.options = {
      debug: options.debug || false,
      ...options
    };

    this.checkpoints = [];
    this.listeners = [];
    this.startTime = Date.now();
    this.stats = {
      totalCheckpoints: 0,
      totalTime: 0,
      averageInterval: 0
    };

    if (this.options.debug) {
      console.log('[LogiGoReporter] Initialized');
    }
  }

  /**
   * Report a checkpoint execution
   * @param {Object} data - Checkpoint data
   */
  reportCheckpoint(data) {
    const timestamp = Date.now();
    const timeSinceStart = timestamp - this.startTime;

    const checkpointData = {
      id: data.id || data.nodeId || `checkpoint_${this.checkpoints.length}`,
      timestamp,
      timeSinceStart,
      domElement: data.domElement || null,
      variables: data.variables || {},
      metadata: data.metadata || {}
    };

    this.checkpoints.push(checkpointData);
    this.updateStats();

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(checkpointData);
      } catch (error) {
        console.error('[LogiGoReporter] Listener error:', error);
      }
    });

    if (this.options.debug) {
      console.log('[LogiGoReporter] Checkpoint reported:', checkpointData);
    }

    return checkpointData;
  }

  /**
   * Subscribe to checkpoint events
   * @param {Function} callback - Event listener
   * @returns {Function} Unsubscribe function
   */
  onCheckpoint(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update statistics
   */
  updateStats() {
    this.stats.totalCheckpoints = this.checkpoints.length;
    
    if (this.checkpoints.length > 1) {
      const intervals = [];
      for (let i = 1; i < this.checkpoints.length; i++) {
        intervals.push(
          this.checkpoints[i].timestamp - this.checkpoints[i - 1].timestamp
        );
      }
      this.stats.averageInterval = 
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    if (lastCheckpoint) {
      this.stats.totalTime = lastCheckpoint.timeSinceStart;
    }
  }

  /**
   * Export full report as JSON
   * @returns {Object} Complete report with checkpoints and stats
   */
  exportReport() {
    return {
      metadata: {
        exportTime: Date.now(),
        startTime: this.startTime,
        totalDuration: Date.now() - this.startTime
      },
      stats: { ...this.stats },
      checkpoints: [...this.checkpoints]
    };
  }

  /**
   * Get current statistics
   * @returns {Object} Current stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Clear all checkpoint data
   */
  clear() {
    this.checkpoints = [];
    this.startTime = Date.now();
    this.stats = {
      totalCheckpoints: 0,
      totalTime: 0,
      averageInterval: 0
    };

    if (this.options.debug) {
      console.log('[LogiGoReporter] Cleared all data');
    }
  }

  /**
   * Get checkpoint history
   * @returns {Array} Array of checkpoint data
   */
  getCheckpoints() {
    return [...this.checkpoints];
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogiGoReporter;
}

// Export for ES modules
if (typeof window !== 'undefined') {
  window.LogiGoReporter = LogiGoReporter;
}

export default LogiGoReporter;
