/**
 * Debug Logger Utility
 * 
 * This utility provides a centralized way to handle debug logging
 * that can be easily toggled on/off for production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = isDevelopment || process.env.REACT_APP_DEBUG === 'true';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

class DebugLogger {
  private static instance: DebugLogger;
  private logLevel: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  private logGroups: Set<string> = new Set();

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  enableGroup(group: string): void {
    this.logGroups.add(group);
  }

  disableGroup(group: string): void {
    this.logGroups.delete(group);
  }

  private shouldLog(level: LogLevel, group?: string): boolean {
    if (!isDebugEnabled) return false;
    if (level > this.logLevel) return false;
    if (group && this.logGroups.size > 0 && !this.logGroups.has(group)) return false;
    return true;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  }

  debug(message: string, group?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG, group)) {
      console.log(`🐛 ${group ? `[${group}] ` : ''}${message}`, ...args);
    }
  }

  verbose(message: string, group?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.VERBOSE, group)) {
      console.log(`📝 ${group ? `[${group}] ` : ''}${message}`, ...args);
    }
  }

  group(label: string): void {
    if (isDebugEnabled) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (isDebugEnabled) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (isDebugEnabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (isDebugEnabled) {
      console.timeEnd(label);
    }
  }

  table(data: any): void {
    if (isDebugEnabled && this.shouldLog(LogLevel.DEBUG)) {
      console.table(data);
    }
  }

  // Performance logging
  measure(name: string, fn: () => void): void {
    if (!isDebugEnabled) {
      fn();
      return;
    }

    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    if (duration > 16) {
      this.warn(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    } else {
      this.verbose(`Performance: ${name} took ${duration.toFixed(2)}ms`, 'performance');
    }
  }

  // Network logging
  logRequest(method: string, url: string, data?: any): void {
    this.debug(`🌐 ${method} ${url}`, 'network', data);
  }

  logResponse(url: string, status: number, data?: any): void {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    this.debug(`${emoji} Response from ${url}: ${status}`, 'network', data);
  }

  // State logging
  logStateChange(stateName: string, oldValue: any, newValue: any): void {
    this.debug(`State change: ${stateName}`, 'state', {
      old: oldValue,
      new: newValue,
      diff: this.getDiff(oldValue, newValue),
    });
  }

  private getDiff(oldValue: any, newValue: any): any {
    if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
      return { changed: oldValue !== newValue };
    }

    const diff: any = {};
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    for (const key of allKeys) {
      if (oldValue?.[key] !== newValue?.[key]) {
        diff[key] = {
          old: oldValue?.[key],
          new: newValue?.[key],
        };
      }
    }

    return diff;
  }

  // Clean up all console.log statements
  static cleanupConsoleLogs(code: string): string {
    // Remove console.log statements
    let cleanedCode = code.replace(/console\.(log|debug|info|warn|error)\([^)]*\);?\n?/g, '');
    
    // Remove debug comments
    cleanedCode = cleanedCode.replace(/\/\/\s*(TODO|FIXME|DEBUG|HACK|XXX|NOTE):.*/g, '');
    
    // Remove multi-line debug comments
    cleanedCode = cleanedCode.replace(/\/\*[\s\S]*?(DEBUG|TODO|FIXME)[\s\S]*?\*\//g, '');
    
    // Remove empty lines created by removal
    cleanedCode = cleanedCode.replace(/^\s*[\r\n]/gm, '');
    
    return cleanedCode;
  }
}

// Export singleton instance
export const logger = DebugLogger.getInstance();

// Export convenience functions
export const log = {
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  debug: (message: string, group?: string, ...args: any[]) => logger.debug(message, group, ...args),
  verbose: (message: string, group?: string, ...args: any[]) => logger.verbose(message, group, ...args),
  measure: (name: string, fn: () => void) => logger.measure(name, fn),
  request: (method: string, url: string, data?: any) => logger.logRequest(method, url, data),
  response: (url: string, status: number, data?: any) => logger.logResponse(url, status, data),
  state: (name: string, oldValue: any, newValue: any) => logger.logStateChange(name, oldValue, newValue),
  group: (label: string) => logger.group(label),
  groupEnd: () => logger.groupEnd(),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
  table: (data: any) => logger.table(data),
};

// Development-only assertions
export const assert = (condition: boolean, message: string): void => {
  if (isDevelopment && !condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

// Development-only invariant checks
export const invariant = (condition: boolean, message: string): void => {
  if (!condition) {
    if (isDevelopment) {
      throw new Error(`Invariant violation: ${message}`);
    } else {
      logger.error(`Invariant violation: ${message}`);
    }
  }
};

export default logger;