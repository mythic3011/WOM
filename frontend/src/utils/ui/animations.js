export const animations = {
  fadeIn(element, duration = 300) {
    element.style.opacity = "0";
    element.style.transition = `opacity ${duration}ms ease-in`;

    requestAnimationFrame(() => {
      element.style.opacity = "1";
    });

    return new Promise((resolve) => setTimeout(resolve, duration));
  },

  fadeOut(element, duration = 300) {
    element.style.opacity = "1";
    element.style.transition = `opacity ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      element.style.opacity = "0";
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.display = "none";
        resolve();
      }, duration);
    });
  },

  slideIn(element, direction = "right", duration = 300) {
    const transforms = {
      right: "translateX(100%)",
      left: "translateX(-100%)",
      top: "translateY(-100%)",
      bottom: "translateY(100%)",
    };

    element.style.transform = transforms[direction];
    element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    requestAnimationFrame(() => {
      element.style.transform = "translate(0, 0)";
    });

    return new Promise((resolve) => setTimeout(resolve, duration));
  },

  slideOut(element, direction = "right", duration = 300) {
    const transforms = {
      right: "translateX(100%)",
      left: "translateX(-100%)",
      top: "translateY(-100%)",
      bottom: "translateY(100%)",
    };

    element.style.transform = "translate(0, 0)";
    element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    requestAnimationFrame(() => {
      element.style.transform = transforms[direction];
    });

    return new Promise((resolve) => setTimeout(resolve, duration));
  },

  scale(element, from = 0, to = 1, duration = 300) {
    element.style.transform = `scale(${from})`;
    element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;

    requestAnimationFrame(() => {
      element.style.transform = `scale(${to})`;
    });

    return new Promise((resolve) => setTimeout(resolve, duration));
  },

  bounce(element, iterations = 3) {
    element.style.animation = `bounce 0.5s ease ${iterations}`;

    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.animation = "";
        resolve();
      }, 500 * iterations);
    });
  },

  shake(element) {
    element.style.animation = "shake 0.5s ease";

    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.animation = "";
        resolve();
      }, 500);
    });
  },

  pulse(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease-in-out infinite`;

    return {
      stop: () => {
        element.style.animation = "";
      },
    };
  },

  ripple(element, x, y) {
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    `;

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const left = x - rect.left - size / 2;
    const top = y - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${left}px`;
    ripple.style.top = `${top}px`;

    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  },

  staggeredFadeIn(elements, delay = 100) {
    const promises = [];

    elements.forEach((element, index) => {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          this.fadeIn(element, 300).then(resolve);
        }, index * delay);
      });
      promises.push(promise);
    });

    return Promise.all(promises);
  },

  parallax(element, speed = 0.5) {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const rect = element.getBoundingClientRect();
      const elementY = rect.top + scrollY;
      const distance = scrollY - elementY;

      element.style.transform = `translateY(${distance * speed}px)`;
    };

    window.addEventListener("scroll", handleScroll);

    return {
      destroy: () => window.removeEventListener("scroll", handleScroll),
    };
  },

  countUp(element, start = 0, end = 100, duration = 1000) {
    const startTime = performance.now();
    const range = end - start;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = start + range * easeOutQuart;

      element.textContent = Math.round(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  typewriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = "";

    return new Promise((resolve) => {
      const type = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      };
      type();
    });
  },

  morphNumber(element, from, to, duration = 1000) {
    const startTime = performance.now();
    const range = to - from;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeInOutCubic =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const current = from + range * easeInOutCubic;
      element.textContent = Number.isInteger(to)
        ? Math.round(current)
        : current.toFixed(2);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  highlightElement(element, duration = 2000) {
    const originalBg = element.style.backgroundColor;
    element.style.transition = `background-color 300ms ease`;
    element.style.backgroundColor = "#fef3c7";

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, duration);
  },
};

export const createAnimatedCSS = () => {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    @keyframes slideInLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    
    @keyframes slideInUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    
    @keyframes slideInDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
      20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes ripple-animation {
      to { transform: scale(4); opacity: 0; }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    
    .animate-fadeIn { animation: fadeIn 0.3s ease-in; }
    .animate-fadeOut { animation: fadeOut 0.3s ease-out; }
    .animate-slideInRight { animation: slideInRight 0.3s ease; }
    .animate-slideInLeft { animation: slideInLeft 0.3s ease; }
    .animate-slideInUp { animation: slideInUp 0.3s ease; }
    .animate-slideInDown { animation: slideInDown 0.3s ease; }
    .animate-bounce { animation: bounce 0.5s ease; }
    .animate-shake { animation: shake 0.5s ease; }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
    .animate-spin { animation: spin 1s linear infinite; }
    .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
    
    .transition-all {
      transition: all 0.3s ease;
    }
    
    .transition-colors {
      transition-property: background-color, border-color, color, fill, stroke;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
    
    .transition-transform {
      transition-property: transform;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
  `;

  document.head.appendChild(style);
};

createAnimatedCSS();
