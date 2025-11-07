export const performanceOptimizer = {
  cache: new Map(),
  memoizedFunctions: new Map(),

  memoize(fn, keyGenerator) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const result = fn(...args);
      this.cache.set(key, result);

      return result;
    };
  },

  clearCache(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  },

  debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  throttle(fn, limit = 300) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  batchUpdates(updates, delay = 50) {
    const batched = [];
    let timeoutId;

    return function (update) {
      batched.push(update);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updates(batched.slice());
        batched.length = 0;
      }, delay);
    };
  },

  lazyLoad(loadFn) {
    let loaded = false;
    let result;

    return async () => {
      if (!loaded) {
        result = await loadFn();
        loaded = true;
      }
      return result;
    };
  },

  createVirtualScroller(container, items, renderItem, itemHeight = 50) {
    const $container = $(container);
    const totalHeight = items.length * itemHeight;
    const visibleItems = Math.ceil($container.height() / itemHeight) + 2;

    let scrollTop = $container.scrollTop();
    let startIndex = Math.floor(scrollTop / itemHeight);

    const render = () => {
      const endIndex = Math.min(startIndex + visibleItems, items.length);
      const visibleData = items.slice(startIndex, endIndex);

      const offsetY = startIndex * itemHeight;
      const html = visibleData
        .map((item, i) => renderItem(item, startIndex + i))
        .join("");

      $container.html(`
        <div style="height: ${totalHeight}px; position: relative;">
          <div style="transform: translateY(${offsetY}px);">
            ${html}
          </div>
        </div>
      `);
    };

    $container.on(
      "scroll",
      this.throttle(() => {
        scrollTop = $container.scrollTop();
        startIndex = Math.floor(scrollTop / itemHeight);
        render();
      }, 100)
    );

    render();

    return {
      update: (newItems) => {
        items = newItems;
        render();
      },
    };
  },

  requestIdleCallback(fn, options = {}) {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      return window.requestIdleCallback(fn, options);
    }

    return setTimeout(
      () => fn({ didTimeout: false, timeRemaining: () => 50 }),
      1
    );
  },

  cancelIdleCallback(id) {
    if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
      return window.cancelIdleCallback(id);
    }

    return clearTimeout(id);
  },

  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);

    return result;
  },

  async measureAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);

    return result;
  },

  createBatcher(batchFn, { maxSize = 50, maxWait = 100 } = {}) {
    let batch = [];
    let timer;

    const flush = () => {
      if (batch.length > 0) {
        batchFn(batch.slice());
        batch = [];
      }
      timer = null;
    };

    return (item) => {
      batch.push(item);

      if (batch.length >= maxSize) {
        flush();
      } else if (!timer) {
        timer = setTimeout(flush, maxWait);
      }
    };
  },

  eventDelegation(container, selector, event, handler) {
    $(container).on(event, selector, function (e) {
      handler.call(this, e);
    });
  },

  optimizeImages(selector) {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const $img = $(entry.target);
            const dataSrc = $img.data("src");
            if (dataSrc) {
              $img.attr("src", dataSrc);
              $img.removeData("src");
              imageObserver.unobserve(entry.target);
            }
          }
        });
      });

      $(selector).each((_, img) => {
        imageObserver.observe(img);
      });

      return imageObserver;
    }
  },

  prefetch(urls) {
    urls.forEach((url) => {
      $("<link>").attr("rel", "prefetch").attr("href", url).appendTo("head");
    });
  },

  webWorker(fn) {
    const blob = new Blob([`(${fn.toString()})()`], {
      type: "application/javascript",
    });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
  },

  computeHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  },
};

export const createOptimizedRender = (renderFn, dependencies = []) => {
  let lastDeps = [];
  let lastResult;

  return (...args) => {
    const depsChanged = dependencies.some((dep, i) => dep !== lastDeps[i]);

    if (!lastResult || depsChanged) {
      lastResult = renderFn(...args);
      lastDeps = [...dependencies];
    }

    return lastResult;
  };
};

export const batchDOMUpdates = (updates) => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};
