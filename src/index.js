/**
 * LogiGo - Runtime Code Visualizer
 * Main entry point for the NPM package
 */

// Import core modules
import LogiGoOverlay from './overlay.js';
import ExecutionController from './runtime.js';
import LogiGoParser from './parser.js';
import LogiGoDiffer from './differ.js';
import LogiGoReporter from './reporter.js';

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

// Export everything
export {
    init,
    LogiGoOverlay,
    ExecutionController,
    LogiGoParser,
    LogiGoDiffer,
    LogiGoReporter
};

// Default export
export default {
    init,
    LogiGoOverlay,
    ExecutionController,
    LogiGoParser,
    LogiGoDiffer,
    LogiGoReporter
};
