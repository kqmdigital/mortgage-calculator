// Application monitoring and health check utilities
import { supabase } from './supabase';
import { AuditLogger } from './security';

// Performance monitoring
export class PerformanceMonitor {
  static metrics = new Map();
  static observers = [];

  // Start performance timing
  static startTiming(label) {
    const startTime = performance.now();
    this.metrics.set(label, { startTime, endTime: null, duration: null });
    return startTime;
  }

  // End performance timing
  static endTiming(label) {
    const metric = this.metrics.get(label);
    if (!metric) {
      console.warn(`Performance metric "${label}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    
    this.metrics.set(label, metric);
    
    // Log slow operations
    if (duration > 2000) { // > 2 seconds
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      AuditLogger.log('SLOW_OPERATION', null, { label, duration });
    }

    return duration;
  }

  // Get all metrics
  static getMetrics() {
    const result = {};
    for (const [label, metric] of this.metrics.entries()) {
      result[label] = {
        duration: metric.duration,
        startTime: metric.startTime,
        endTime: metric.endTime
      };
    }
    return result;
  }

  // Clear metrics
  static clearMetrics() {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  static initWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordVital('LCP', entry.value);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.recordVital('FID', entry.processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordVital('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  static recordVital(name, value) {
    const threshold = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100ms
      CLS: 0.1   // 0.1
    };

    const status = value <= threshold[name] ? 'good' : 'needs-improvement';
    
    console.log(`Core Web Vital - ${name}: ${value.toFixed(2)} (${status})`);
    
    if (status !== 'good') {
      AuditLogger.log('POOR_WEB_VITAL', null, { name, value, threshold: threshold[name] });
    }
  }
}

// Application health checker
export class HealthChecker {
  static async performHealthCheck() {
    const checks = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.REACT_APP_VERSION || 'unknown',
      checks: {}
    };

    // Database connectivity
    checks.checks.database = await this.checkDatabase();
    
    // Local storage availability
    checks.checks.localStorage = this.checkLocalStorage();
    
    // Session storage availability
    checks.checks.sessionStorage = this.checkSessionStorage();
    
    // Browser compatibility
    checks.checks.browserCompatibility = this.checkBrowserCompatibility();
    
    // Network connectivity
    checks.checks.network = this.checkNetworkConnection();
    
    // Memory usage
    checks.checks.memory = this.checkMemoryUsage();

    // Overall status
    const failedChecks = Object.values(checks.checks).filter(check => !check.status);
    checks.overall = {
      status: failedChecks.length === 0 ? 'healthy' : 'degraded',
      failedChecks: failedChecks.length,
      totalChecks: Object.keys(checks.checks).length
    };

    return checks;
  }

  static async checkDatabase() {
    try {
      PerformanceMonitor.startTiming('database_health_check');
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      const duration = PerformanceMonitor.endTiming('database_health_check');
      
      if (error) throw error;
      
      return {
        status: true,
        message: 'Database connection successful',
        responseTime: duration,
        details: { recordCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        status: false,
        message: 'Database connection failed',
        error: error.message,
        details: { code: error.code }
      };
    }
  }

  static checkLocalStorage() {
    try {
      const testKey = 'health_check_test';
      const testValue = 'test_value';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return {
        status: retrieved === testValue,
        message: retrieved === testValue ? 'Local storage working' : 'Local storage failed',
        details: { supported: typeof(Storage) !== 'undefined' }
      };
    } catch (error) {
      return {
        status: false,
        message: 'Local storage not available',
        error: error.message
      };
    }
  }

  static checkSessionStorage() {
    try {
      const testKey = 'health_check_session_test';
      const testValue = 'session_test_value';
      
      sessionStorage.setItem(testKey, testValue);
      const retrieved = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      return {
        status: retrieved === testValue,
        message: retrieved === testValue ? 'Session storage working' : 'Session storage failed',
        details: { supported: typeof(Storage) !== 'undefined' }
      };
    } catch (error) {
      return {
        status: false,
        message: 'Session storage not available',
        error: error.message
      };
    }
  }

  static checkBrowserCompatibility() {
    const features = {
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      webCrypto: 'crypto' in window && 'subtle' in window.crypto,
      modules: typeof Symbol !== 'undefined',
      arrow_functions: (() => true)(),
      async_await: (async () => true)() instanceof Promise
    };

    const unsupported = Object.entries(features)
      .filter(([key, supported]) => !supported)
      .map(([key]) => key);

    return {
      status: unsupported.length === 0,
      message: unsupported.length === 0 ? 'Browser fully compatible' : `Unsupported features: ${unsupported.join(', ')}`,
      details: { features, unsupported }
    };
  }

  static checkNetworkConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      status: navigator.onLine,
      message: navigator.onLine ? 'Network connection available' : 'No network connection',
      details: {
        onLine: navigator.onLine,
        connectionType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 'unknown',
        rtt: connection?.rtt || 'unknown'
      }
    };
  }

  static checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      return {
        status: usedPercent < 80, // Alert if using more than 80% of available heap
        message: `Memory usage: ${usedPercent.toFixed(1)}%`,
        details: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usedPercent: usedPercent
        }
      };
    }
    
    return {
      status: true,
      message: 'Memory monitoring not available',
      details: { supported: false }
    };
  }
}

// Error boundary monitoring
export class ErrorMonitor {
  static errors = [];
  static maxErrors = 100;

  static init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // React error boundary integration
    this.initReactErrorBoundary();
  }

  static logError(errorInfo) {
    // Add to local error log
    this.errors.push(errorInfo);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to audit system
    AuditLogger.log('APPLICATION_ERROR', null, errorInfo);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorInfo);
    }

    // In production, send to monitoring service
    this.sendToMonitoringService(errorInfo);
  }

  static getErrors() {
    return [...this.errors];
  }

  static clearErrors() {
    this.errors = [];
  }

  static sendToMonitoringService(errorInfo) {
    // In production, integrate with services like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external monitoring service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo)
      }).catch(() => {
        // Silently fail - don't create error loops
      });
    }
  }

  static initReactErrorBoundary() {
    // This would be used in a React Error Boundary component
    window.reportReactError = (error, errorInfo) => {
      this.logError({
        type: 'react_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    };
  }
}

// Application diagnostics
export class DiagnosticsCollector {
  static async collectDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      connection: this.getConnectionInfo(),
      performance: this.getPerformanceInfo(),
      memory: this.getMemoryInfo(),
      errors: ErrorMonitor.getErrors(),
      healthCheck: await HealthChecker.performHealthCheck(),
      auditLogs: AuditLogger.getLogs(),
      localStorage: this.getStorageInfo(),
      features: this.getFeatureSupport()
    };

    return diagnostics;
  }

  static getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  static getPerformanceInfo() {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      metrics: PerformanceMonitor.getMetrics()
    };
  }

  static getMemoryInfo() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return { supported: false };
  }

  static getStorageInfo() {
    try {
      return {
        localStorage: {
          supported: typeof localStorage !== 'undefined',
          used: JSON.stringify(localStorage).length,
          keys: Object.keys(localStorage).length
        },
        sessionStorage: {
          supported: typeof sessionStorage !== 'undefined',
          used: JSON.stringify(sessionStorage).length,
          keys: Object.keys(sessionStorage).length
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  static getFeatureSupport() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      webGL: this.checkWebGLSupport(),
      webAssembly: 'WebAssembly' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window
    };
  }

  static checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  // Export diagnostics for support
  static async exportDiagnostics() {
    const diagnostics = await this.collectDiagnostics();
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyquest-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return diagnostics;
  }
}

// Initialize monitoring on app start
export const initializeMonitoring = () => {
  try {
    PerformanceMonitor.initWebVitals();
    ErrorMonitor.init();
    
    // Log initialization
    AuditLogger.log('MONITORING_INITIALIZED', null, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    console.log('🔍 Application monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize monitoring:', error);
  }
};
