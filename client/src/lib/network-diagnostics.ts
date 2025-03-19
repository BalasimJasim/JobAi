import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export class NetworkDiagnostics {
  private static logFile = path.join(process.cwd(), 'logs', 'network-diagnostics.log');

  private static writeLog(message: string, data?: any) {
    // Ensure logs directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;

    fs.appendFileSync(this.logFile, logEntry);
    console.log(`[NETWORK_DIAGNOSTICS] ${message}`, data || '');
  }

  /**
   * Get detailed network interface information
   */
  static getNetworkInterfaces(): Record<string, any[]> {
    const interfaces = os.networkInterfaces();
    const networkInfo: Record<string, any[]> = {};

    Object.keys(interfaces).forEach(interfaceName => {
      const interfaceDetails = interfaces[interfaceName];
      if (interfaceDetails) {
        networkInfo[interfaceName] = interfaceDetails
          .filter(details => !details.internal)
          .map(details => ({
            address: details.address,
            netmask: details.netmask,
            family: details.family,
            mac: details.mac
          }));
      }
    });

    this.writeLog('Network Interfaces Retrieved', networkInfo);
    return networkInfo;
  }

  /**
   * Check connectivity to a specific URL
   */
  static async checkUrlConnectivity(url: string, timeout: number = 5000): Promise<{
    success: boolean;
    error?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      this.writeLog('URL Connectivity Check', {
        url,
        status: response.status,
        responseTime,
        headers: Object.fromEntries(response.headers)
      });

      return {
        success: response.ok,
        responseTime
      };
    } catch (error) {
      this.writeLog('URL Connectivity Error', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Comprehensive network connectivity test
   */
  static async runDiagnostics() {
    this.writeLog('Starting Network Diagnostics');

    const networkInterfaces = this.getNetworkInterfaces();

    const tests = [
      { url: 'http://localhost:3000', name: 'Local Frontend' },
      { url: 'http://localhost:5000/api/health', name: 'Backend API' },
      { url: 'https://www.google.com', name: 'Internet Connectivity' }
    ];

    const results = await Promise.all(
      tests.map(async (test) => {
        const result = await this.checkUrlConnectivity(test.url);
        return {
          ...test,
          ...result
        };
      })
    );

    this.writeLog('Network Diagnostics Complete', { 
      networkInterfaces, 
      connectivityTests: results 
    });

    return {
      networkInterfaces,
      connectivityTests: results
    };
  }
} 