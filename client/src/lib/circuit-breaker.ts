import { CONFIG } from './config';

export enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Requests are blocked
  HALF_OPEN // Tentative state, allowing limited requests
}

interface CircuitBreakerOptions {
  failureThreshold?: number;     // Number of failures before opening
  recoveryTime?: number;         // Time to wait before trying again
  timeout?: number;              // Request timeout
}

export class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 3,
      recoveryTime: options.recoveryTime || 30000,     // 30 seconds
      timeout: options.timeout || 5000                 // 5 seconds
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn - Function to execute
   * @returns Promise with the result or throws an error
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    this.checkState();

    // If circuit is open, immediately reject
    if (this.state === CircuitState.OPEN) {
      CONFIG.log.error('Circuit is OPEN. Request blocked.');
      throw new Error('Service temporarily unavailable');
    }

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), this.options.timeout)
      );

      // Race between actual request and timeout
      const result = await Promise.race([fn(), timeoutPromise]);

      // Reset failure count on success
      this.reset();

      return result;
    } catch (error) {
      // Record and handle failure
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Check and update circuit state
   */
  private checkState() {
    // If in OPEN state, check if recovery time has passed
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceLastFailure >= this.options.recoveryTime) {
        // Move to HALF_OPEN state to test recovery
        this.state = CircuitState.HALF_OPEN;
        CONFIG.log.debug('Circuit moved to HALF_OPEN state');
      }
    }
  }

  /**
   * Record a failure and potentially open the circuit
   * @param error - Error that occurred
   */
  private recordFailure(error: unknown) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    CONFIG.log.error('Circuit Breaker Failure', {
      failureCount: this.failureCount,
      error
    });

    // Open circuit if failure threshold is reached
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      CONFIG.log.error('Circuit OPENED due to repeated failures');
    }
  }

  /**
   * Reset circuit state
   */
  private reset() {
    if (this.state === CircuitState.HALF_OPEN) {
      CONFIG.log.debug('Circuit successfully recovered');
    }

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
}

// Utility function to create a circuit breaker with default or custom options
export function createCircuitBreaker<T>(options?: CircuitBreakerOptions): CircuitBreaker<T> {
  return new CircuitBreaker<T>(options);
} 