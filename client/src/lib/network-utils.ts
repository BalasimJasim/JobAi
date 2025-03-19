import { CONFIG } from './config';
import { CircuitBreaker, createCircuitBreaker, CircuitState } from './circuit-breaker';

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export const NetworkUtils = {
  /**
   * Check network connectivity to a specific endpoint
   * @param url - The URL to check connectivity
   * @param timeout - Timeout in milliseconds (default: 5000)
   */
  async checkConnectivity(url: string, timeout = 5000): Promise<boolean> {
    const circuitBreaker = createCircuitBreaker<boolean>();

    try {
      return await circuitBreaker.execute(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          clearTimeout(timeoutId);

          CONFIG.log.debug('Network Connectivity Check', {
            url,
            status: response.status,
            ok: response.ok
          });

          return response.ok;
        } catch (error) {
          CONFIG.log.error('Connectivity Check Error', error);
          
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new NetworkError(`Connectivity check to ${url} timed out`);
          }

          return false;
        }
      });
    } catch (error) {
      CONFIG.log.error('Connectivity Check Failed', error);
      return false;
    }
  },

  /**
   * Retry a network request with circuit breaker and exponential backoff
   * @param fn - The async function to retry
   * @param maxRetries - Maximum number of retries
   * @param baseDelay - Base delay between retries in milliseconds
   */
  async retryRequest<T>(
    fn: () => Promise<T>, 
    maxRetries = 3, 
    baseDelay = 1000
  ): Promise<T> {
    const circuitBreaker = createCircuitBreaker<T>({
      failureThreshold: maxRetries,
      recoveryTime: baseDelay * Math.pow(2, maxRetries)
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        CONFIG.log.debug(`Network Request Attempt ${attempt + 1}`);
        
        return await circuitBreaker.execute(fn);
      } catch (error) {
        lastError = error as Error;
        const delay = baseDelay * Math.pow(2, attempt);
        
        CONFIG.log.error(`Request failed (Attempt ${attempt + 1})`, error);
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, delay));

        // Check circuit breaker state
        if (circuitBreaker.getState() === CircuitState.OPEN) {
          CONFIG.log.error('Circuit is OPEN. Stopping retries.');
          break;
        }
      }
    }

    CONFIG.log.error('All retry attempts failed', lastError);
    throw lastError || new Error('Request failed after multiple attempts');
  }
}; 