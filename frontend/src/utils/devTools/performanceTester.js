import { DEV_TOOLS_CONFIG } from "./devToolsConfig.js";

export class PerformanceTester {
  static async runTest() {
    const start = performance.now();
    const iterations = DEV_TOOLS_CONFIG.performance.testIterations;

    for (let i = 0; i < iterations; i++) {
      const data = { id: i, value: Math.random() };
      JSON.stringify(data);
    }

    const end = performance.now();
    const duration = (end - start).toFixed(2);

    return {
      iterations,
      duration,
      average: (duration / iterations).toFixed(4),
    };
  }

  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2),
      };
    }
    return null;
  }

  static async clearCache() {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      return true;
    }
    return false;
  }

  static getNavigationTiming() {
    if (performance.timing) {
      const timing = performance.timing;
      return {
        domLoading: timing.domLoading - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    }
    return null;
  }
}
