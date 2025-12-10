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
=======
 * LogiGo Reporter - Checkpoint Reporting & Analytics
 * 
 * Captures checkpoint data and exposes it to external tools (like Browser Agents)
 */

class LogiGoReporter {
    constructor(options = {}) {
        this.options = {
            debug: options.debug || false,
            maxLogSize: options.maxLogSize || 1000,
            ...options
        };

        this.checkpointLog = [];
        this.listeners = [];
        this.startTime = Date.now();
    }

    /**
     * Record a checkpoint execution
     * Called automatically by ExecutionController
     * 
     * @param {Object} data - Checkpoint data
     */
    recordCheckpoint(data) {
        const entry = {
            id: data.nodeId,
            timestamp: Date.now(),
            metadata: data.metadata || {},
            domElement: data.domElement || null,
            // Capture variables if provided in metadata
            variables: data.metadata?.variables || {},
            // Calculate time since start
            timeSinceStart: Date.now() - this.startTime
        };

        // Add to log (respecting max size)
        this.checkpointLog.push(entry);
        if (this.checkpointLog.length > this.options.maxLogSize) {
            this.checkpointLog.shift();
        }

        if (this.options.debug) {
            console.log('[LogiGoReporter] Recorded:', entry);
        }

        // Notify listeners
        this.notifyListeners(entry);
    }

    /**
     * Subscribe to checkpoint events
     * 
     * @param {Function} callback - Function to call on new checkpoint
     * @returns {Function} Unsubscribe function
     */
    onCheckpoint(callback) {
        this.listeners.push(callback);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of a new checkpoint
     * @param {Object} entry 
     */
    notifyListeners(entry) {
        this.listeners.forEach(callback => {
            try {
                callback(entry);
            } catch (err) {
                console.error('[LogiGoReporter] Listener error:', err);
            }
        });
    }

    /**
     * Get the full checkpoint log
     * @returns {Array}
     */
    getCheckpointLog() {
        return [...this.checkpointLog];
    }

    /**
     * Clear the log
     */
    clearLog() {
        this.checkpointLog = [];
        this.startTime = Date.now();
    }

    /**
     * Export a full report with statistics
     * @returns {Object}
     */
    exportReport() {
        return {
            summary: this.generateSummary(),
            timeline: this.checkpointLog,
            statistics: this.calculateStats(),
            metadata: {
                generatedAt: new Date().toISOString(),
                totalCheckpoints: this.checkpointLog.length,
                duration: Date.now() - this.startTime
            }
        };
    }

    /**
     * Generate a human-readable summary
     * @returns {string}
     */
    generateSummary() {
        if (this.checkpointLog.length === 0) {
            return "No checkpoints recorded.";
        }

        const uniqueNodes = new Set(this.checkpointLog.map(e => e.id)).size;
        const duration = (Date.now() - this.startTime) / 1000;

        return `Executed ${this.checkpointLog.length} checkpoints across ${uniqueNodes} unique nodes in ${duration.toFixed(2)}s.`;
    }

    /**
     * Calculate execution statistics
     * @returns {Object}
     */
    calculateStats() {
        const nodeCounts = {};
        this.checkpointLog.forEach(entry => {
            nodeCounts[entry.id] = (nodeCounts[entry.id] || 0) + 1;
        });

        return {
            nodeCounts,
            mostFrequentNode: Object.entries(nodeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
        };
    }
>>>>>>> 960385177cf48a5f94466be0890e9f652728d1d9
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
<<<<<<< HEAD
  module.exports = LogiGoReporter;
}

// Export for ES modules
if (typeof window !== 'undefined') {
  window.LogiGoReporter = LogiGoReporter;
}

=======
    module.exports = LogiGoReporter;
}

// Browser global
if (typeof window !== 'undefined') {
    window.LogiGoReporter = LogiGoReporter;
}

// ES Module export
>>>>>>> 960385177cf48a5f94466be0890e9f652728d1d9
export default LogiGoReporter;
