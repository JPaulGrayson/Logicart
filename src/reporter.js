/**
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
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogiGoReporter;
}

// Browser global
if (typeof window !== 'undefined') {
    window.LogiGoReporter = LogiGoReporter;
}

// ES Module export
export default LogiGoReporter;
