/**
 * LogicArt Execution Controller - Premium Feature
 * 
 * Provides checkpoint-based execution control with speed governor.
 * This adds fine-grained control over code execution beyond basic step-through.
 */

export interface ExecutionControllerOptions {
  speed?: number;
  debug?: boolean;
}

export interface ExecutionState {
  isPaused: boolean;
  isWaitingForStep: boolean;
  currentSpeed: number;
  historyLength: number;
  waitingCheckpoints: number;
}

export interface CheckpointHistoryEntry {
  nodeId: string;
  timestamp: number;
  speed: number;
}

export class ExecutionController {
  private options: Required<ExecutionControllerOptions>;
  private isPaused: boolean = false;
  private isWaitingForStep: boolean = false;
  private currentSpeed: number;
  private stepResolvers: Array<() => void> = [];
  private executionHistory: CheckpointHistoryEntry[] = [];

  constructor(options: ExecutionControllerOptions = {}) {
    this.options = {
      speed: options.speed || 1.0,
      debug: options.debug || false,
    };

    this.currentSpeed = this.options.speed;
  }

  /**
   * Checkpoint - Pause execution at a specific point
   * Returns a Promise that resolves based on speed/pause state
   */
  async checkpoint(nodeId: string): Promise<void> {
    if (this.options.debug) {
      console.log(`[ExecutionController] Checkpoint: ${nodeId}`);
    }

    // Record this checkpoint in history
    this.executionHistory.push({
      nodeId,
      timestamp: Date.now(),
      speed: this.currentSpeed,
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
   */
  private waitForStep(): Promise<void> {
    return new Promise((resolve) => {
      this.stepResolvers.push(resolve);
      this.isWaitingForStep = true;
    });
  }

  /**
   * Execute a single step (resolve one waiting checkpoint)
   */
  step(): void {
    if (this.stepResolvers.length > 0) {
      const resolve = this.stepResolvers.shift();
      resolve!();
      this.isWaitingForStep = this.stepResolvers.length > 0;

      if (this.options.debug) {
        console.log(`[ExecutionController] Stepped (${this.stepResolvers.length} waiting)`);
      }
    }
  }

  /**
   * Resume execution (resolve all waiting checkpoints)
   */
  play(): void {
    this.isPaused = false;

    // Resolve all waiting step promises
    while (this.stepResolvers.length > 0) {
      const resolve = this.stepResolvers.shift();
      resolve!();
    }

    this.isWaitingForStep = false;

    if (this.options.debug) {
      console.log('[ExecutionController] Playing');
    }
  }

  /**
   * Pause execution
   */
  pause(): void {
    this.isPaused = true;

    if (this.options.debug) {
      console.log('[ExecutionController] Paused');
    }
  }

  /**
   * Reset execution state
   */
  reset(): void {
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
   */
  setSpeed(speed: number): void {
    this.currentSpeed = Math.max(0.1, Math.min(10.0, speed));

    if (this.options.debug) {
      console.log(`[ExecutionController] Speed set to ${this.currentSpeed}x`);
    }
  }

  /**
   * Get the step delay in milliseconds based on current speed
   * Base delay is 800ms (to match existing free tier timing)
   */
  getStepDelay(): number {
    const baseDelay = 800;
    return baseDelay / this.currentSpeed;
  }

  /**
   * Get current execution state
   */
  getState(): ExecutionState {
    return {
      isPaused: this.isPaused,
      isWaitingForStep: this.isWaitingForStep,
      currentSpeed: this.currentSpeed,
      historyLength: this.executionHistory.length,
      waitingCheckpoints: this.stepResolvers.length,
    };
  }

  /**
   * Get execution history
   */
  getHistory(): CheckpointHistoryEntry[] {
    return [...this.executionHistory];
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
