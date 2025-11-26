/**
 * LogiGo Runtime - Execution Controller
 * 
 * Manages code execution flow with pause/step/speed control
 */

class ExecutionController {
    constructor(options = {}) {
        this.options = {
            speed: options.speed || 1.0,
            debug: options.debug || false,
            reporter: options.reporter || null, // Allow passing external reporter
            ...options
        };

        this.isPaused = false;
        this.isWaitingForStep = false;
        this.currentSpeed = this.options.speed;
        this.stepResolvers = [];
        this.executionHistory = [];

        // Initialize reporter if not provided but requested or default
        // We check for global LogiGoReporter if not passed in options
        if (!this.options.reporter && typeof LogiGoReporter !== 'undefined') {
            this.reporter = new LogiGoReporter({ debug: this.options.debug });
        } else {
            this.reporter = this.options.reporter;
        }
    }

    /**
     * Checkpoint - Pause execution at a specific point
     * Returns a Promise that resolves based on speed/pause state
     * 
     * @param {string} nodeId - Unique identifier for this checkpoint
     * @param {Object} metadata - Optional metadata (variables, domElement, etc.)
     * @returns {Promise<void>}
     */
    async checkpoint(nodeId, metadata = {}) {
        if (this.options.debug) {
            console.log(`[ExecutionController] Checkpoint: ${nodeId}`, metadata);
        }

        // Record this checkpoint in history
        this.executionHistory.push({
            nodeId,
            timestamp: Date.now(),
            speed: this.currentSpeed,
            metadata
        });

        // Report to external tools via Reporter API
        if (this.reporter) {
            this.reporter.recordCheckpoint({
                nodeId,
                metadata,
                domElement: metadata.domElement
            });
        }

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
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExecutionController;
}

// Browser global
if (typeof window !== 'undefined') {
    window.ExecutionController = ExecutionController;
}

// ES Module export
export default ExecutionController;
