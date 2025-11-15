export const lazyLoadComponent = async (importFn, fallback = "Loading...") => {
  try {
    const module = await importFn();
    return module.default || module;
  } catch (error) {
    console.error("Failed to load component:", error);
    return {
      render: () => `<div class="text-red-600">Failed to load component</div>`,
    };
  }
};

export const loadComponentWhenVisible = (element, importFn) => {
  const observer = new IntersectionObserver(
    async (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const component = await lazyLoadComponent(importFn);
          if (component.render) {
            element.innerHTML = component.render();
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "50px" }
  );

  observer.observe(element);
  return observer;
};

export const preloadComponent = (importFn) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => importFn());
  } else {
    setTimeout(() => importFn(), 1);
  }
};
