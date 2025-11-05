export function loadComponent(selector, path, callback) {
  $(selector).load(path, function (response, status) {
    if (status === "error") {
      console.error(`Failed to load component: ${path}`);
    }
    if (callback && typeof callback === "function") {
      callback(status === "success");
    }
  });
}

export function loadCommonComponents(callback) {
  let loaded = 0;
  const total = 2;

  const checkComplete = () => {
    loaded++;
    if (loaded === total && callback) {
      callback();
    }
  };

  loadComponent("#navbar", "/src/common/navbar.html", checkComplete);
  loadComponent("#footer", "/src/common/footer.html", checkComplete);
}

export function setPageTitle(title) {
  document.title = `${title} | Hong Kong Book Fair`;
}

export function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return Promise.resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(err);
    }
  }
}

export function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

export function updateQueryParams(params) {
  const url = new URL(window.location);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  window.history.pushState({}, "", url);
}
