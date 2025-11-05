export class TouchGestureManager {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      threshold: options.threshold || 50,
      timeout: options.timeout || 300,
      swipe: options.swipe !== false,
      tap: options.tap !== false,
      doubleTap: options.doubleTap !== false,
      longPress: options.longPress !== false,
      pinch: options.pinch !== false,
      ...options,
    };

    this.touchStart = { x: 0, y: 0, time: 0 };
    this.touchEnd = { x: 0, y: 0, time: 0 };
    this.lastTap = 0;
    this.longPressTimer = null;
    this.initialPinchDistance = 0;

    this.init();
  }

  init() {
    this.element.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      {
        passive: false,
      }
    );
    this.element.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
      {
        passive: false,
      }
    );
    this.element.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    if (e.touches.length === 2 && this.options.pinch) {
      this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
    }

    if (this.options.longPress) {
      this.longPressTimer = setTimeout(() => {
        this.onLongPress(e);
      }, 500);
    }
  }

  handleTouchMove(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (e.touches.length === 2 && this.options.pinch) {
      e.preventDefault();
      const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / this.initialPinchDistance;
      this.onPinch(scale, e);
    }
  }

  handleTouchEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = e.changedTouches[0];
    this.touchEnd = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaY = this.touchEnd.y - this.touchStart.y;
    const deltaTime = this.touchEnd.time - this.touchStart.time;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    if (distance < 10 && deltaTime < this.options.timeout) {
      this.handleTap(e);
    } else if (
      this.options.swipe &&
      distance > this.options.threshold &&
      deltaTime < this.options.timeout
    ) {
      this.handleSwipe(deltaX, deltaY, e);
    }
  }

  handleTap(e) {
    const now = Date.now();
    const timeSinceLastTap = now - this.lastTap;

    if (this.options.doubleTap && timeSinceLastTap < 300) {
      this.onDoubleTap(e);
      this.lastTap = 0;
    } else {
      this.lastTap = now;
      setTimeout(() => {
        if (this.lastTap === now && this.options.tap) {
          this.onTap(e);
        }
      }, 300);
    }
  }

  handleSwipe(deltaX, deltaY, e) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      if (deltaX > 0) {
        this.onSwipeRight(e);
      } else {
        this.onSwipeLeft(e);
      }
    } else {
      if (deltaY > 0) {
        this.onSwipeDown(e);
      } else {
        this.onSwipeUp(e);
      }
    }
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  onTap(e) {
    if (this.options.onTap) this.options.onTap(e);
  }

  onDoubleTap(e) {
    if (this.options.onDoubleTap) this.options.onDoubleTap(e);
  }

  onLongPress(e) {
    if (this.options.onLongPress) this.options.onLongPress(e);
  }

  onSwipeLeft(e) {
    if (this.options.onSwipeLeft) this.options.onSwipeLeft(e);
  }

  onSwipeRight(e) {
    if (this.options.onSwipeRight) this.options.onSwipeRight(e);
  }

  onSwipeUp(e) {
    if (this.options.onSwipeUp) this.options.onSwipeUp(e);
  }

  onSwipeDown(e) {
    if (this.options.onSwipeDown) this.options.onSwipeDown(e);
  }

  onPinch(scale, e) {
    if (this.options.onPinch) this.options.onPinch(scale, e);
  }

  destroy() {
    this.element.removeEventListener("touchstart", this.handleTouchStart);
    this.element.removeEventListener("touchmove", this.handleTouchMove);
    this.element.removeEventListener("touchend", this.handleTouchEnd);
  }
}

export class SwipeCarousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.currentIndex = 0;
    this.items = [];
    this.options = {
      autoPlay: options.autoPlay || false,
      interval: options.interval || 3000,
      loop: options.loop !== false,
      ...options,
    };

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.items = Array.from(this.container.children);

    const gestureManager = new TouchGestureManager(this.container, {
      onSwipeLeft: () => this.next(),
      onSwipeRight: () => this.prev(),
    });

    if (this.options.autoPlay) {
      this.startAutoPlay();
    }
  }

  next() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
    } else if (this.options.loop) {
      this.currentIndex = 0;
    }
    this.render();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.options.loop) {
      this.currentIndex = this.items.length - 1;
    }
    this.render();
  }

  goTo(index) {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.render();
    }
  }

  render() {
    const offset = -this.currentIndex * 100;
    this.container.style.transform = `translateX(${offset}%)`;
    this.container.style.transition = "transform 0.3s ease";
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, this.options.interval);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  destroy() {
    this.stopAutoPlay();
  }
}

export const mobileOptimizations = {
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  isTouch() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  },

  preventZoom() {
    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.scale !== 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );
  },

  addTouchRipple(selector) {
    document.querySelectorAll(selector).forEach((element) => {
      element.addEventListener("touchstart", function (e) {
        const ripple = document.createElement("span");
        ripple.className = "touch-ripple";

        const touch = e.touches[0];
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = touch.clientX - rect.left - size / 2;
        const y = touch.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        `;

        this.style.position = "relative";
        this.style.overflow = "hidden";
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });
  },

  makeTouchFriendly(element) {
    element.style.touchAction = "manipulation";
    element.style.userSelect = "none";
    element.style.webkitTapHighlightColor = "transparent";

    const minTouchSize = 44;
    const currentSize = Math.min(element.offsetWidth, element.offsetHeight);

    if (currentSize < minTouchSize) {
      element.style.minWidth = `${minTouchSize}px`;
      element.style.minHeight = `${minTouchSize}px`;
    }
  },

  enablePullToRefresh(onRefresh) {
    let startY = 0;
    let currentY = 0;
    let pulling = false;

    document.addEventListener("touchstart", (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    });

    document.addEventListener("touchmove", (e) => {
      if (window.scrollY === 0) {
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;

        if (pullDistance > 0) {
          pulling = true;
          e.preventDefault();
        }
      }
    });

    document.addEventListener("touchend", () => {
      if (pulling && currentY - startY > 80) {
        onRefresh();
      }
      pulling = false;
      startY = 0;
      currentY = 0;
    });
  },

  optimizeScrolling() {
    const style = document.createElement("style");
    style.textContent = `
      * {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      @supports (-webkit-overflow-scrolling: touch) {
        .scroll-container {
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    document.head.appendChild(style);
  },

  addSwipeNavigation(pages, onPageChange) {
    const container = document.createElement("div");
    container.className = "swipe-navigation";
    container.style.cssText = `
      display: flex;
      overflow-x: hidden;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    `;

    pages.forEach((page) => {
      const pageElement = document.createElement("div");
      pageElement.style.cssText = `
        min-width: 100%;
        scroll-snap-align: start;
      `;
      pageElement.innerHTML = page;
      container.appendChild(pageElement);
    });

    const gestureManager = new TouchGestureManager(container, {
      onSwipeLeft: () => {
        const currentPage = Math.floor(
          container.scrollLeft / container.offsetWidth
        );
        if (currentPage < pages.length - 1) {
          container.scrollTo({
            left: (currentPage + 1) * container.offsetWidth,
            behavior: "smooth",
          });
          if (onPageChange) onPageChange(currentPage + 1);
        }
      },
      onSwipeRight: () => {
        const currentPage = Math.floor(
          container.scrollLeft / container.offsetWidth
        );
        if (currentPage > 0) {
          container.scrollTo({
            left: (currentPage - 1) * container.offsetWidth,
            behavior: "smooth",
          });
          if (onPageChange) onPageChange(currentPage - 1);
        }
      },
    });

    return container;
  },
};
