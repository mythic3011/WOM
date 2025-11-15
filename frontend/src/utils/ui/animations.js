import anime from "animejs";

export const animations = {
  fadeIn(element, duration = 300) {
    return anime({
      targets: element,
      opacity: [0, 1],
      duration,
      easing: "easeOutQuad",
    }).finished;
  },

  fadeOut(element, duration = 300) {
    return anime({
      targets: element,
      opacity: [1, 0],
      duration,
      easing: "easeOutQuad",
    }).finished;
  },

  slideIn(element, direction = "right", duration = 300) {
    const transforms = {
      right: ["100%", "0%"],
      left: ["-100%", "0%"],
      top: ["0%", "-100%"],
      bottom: ["0%", "100%"],
    };

    const axis = direction === "left" || direction === "right" ? "X" : "Y";

    return anime({
      targets: element,
      [`translate${axis}`]: transforms[direction],
      duration,
      easing: "easeOutCubic",
    }).finished;
  },

  slideOut(element, direction = "right", duration = 300) {
    const transforms = {
      right: ["0%", "100%"],
      left: ["0%", "-100%"],
      top: ["-100%", "0%"],
      bottom: ["100%", "0%"],
    };

    const axis = direction === "left" || direction === "right" ? "X" : "Y";

    return anime({
      targets: element,
      [`translate${axis}`]: transforms[direction],
      duration,
      easing: "easeInCubic",
    }).finished;
  },

  scale(element, from = 0, to = 1, duration = 300) {
    return anime({
      targets: element,
      scale: [from, to],
      duration,
      easing: "easeOutElastic(1, .6)",
    }).finished;
  },

  bounce(element, iterations = 3) {
    return anime({
      targets: element,
      translateY: [
        { value: -20, duration: 250 },
        { value: 0, duration: 250 },
      ],
      loop: iterations,
      easing: "easeInOutQuad",
    }).finished;
  },

  shake(element) {
    return anime({
      targets: element,
      translateX: [
        { value: -10, duration: 50 },
        { value: 10, duration: 50 },
        { value: -10, duration: 50 },
        { value: 10, duration: 50 },
        { value: 0, duration: 50 },
      ],
      easing: "easeInOutSine",
    }).finished;
  },

  pulse(element, duration = 1000) {
    const animation = anime({
      targets: element,
      opacity: [1, 0.5, 1],
      duration,
      loop: true,
      easing: "easeInOutSine",
    });

    return {
      stop: () => {
        animation.pause();
        anime({ targets: element, opacity: 1, duration: 200 });
      },
    };
  },

  ripple(element, x, y) {
    const $el = $(element);
    const rect = $el[0].getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const left = x - rect.left - size / 2;
    const top = y - rect.top - size / 2;

    const rippleEl = document.createElement("span");
    Object.assign(rippleEl.style, {
      position: "absolute",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.6)",
      width: `${size}px`,
      height: `${size}px`,
      left: `${left}px`,
      top: `${top}px`,
      transform: "scale(0)",
      opacity: "1",
      pointerEvents: "none",
    });

    $el.css({ position: "relative", overflow: "hidden" }).append(rippleEl);

    anime({
      targets: rippleEl,
      scale: [0, 4],
      opacity: [1, 0],
      duration: 600,
      easing: "easeOutQuad",
      complete: () => rippleEl.remove(),
    });
  },

  staggeredFadeIn(elements, delay = 100) {
    return anime({
      targets: elements,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      delay: anime.stagger(delay),
      easing: "easeOutQuad",
    }).finished;
  },

  parallax(element, speed = 0.5) {
    const $el = $(element);
    const $window = $(window);

    const handleScroll = () => {
      const scrollY = $window.scrollTop();
      const rect = $el[0].getBoundingClientRect();
      const elementY = rect.top + scrollY;
      const distance = scrollY - elementY;

      anime({
        targets: element,
        translateY: distance * speed,
        duration: 0,
      });
    };

    $window.on("scroll", handleScroll);

    return {
      destroy: () => $window.off("scroll", handleScroll),
    };
  },

  countUp(element, start = 0, end = 100, duration = 1000) {
    const obj = { count: start };
    const $el = $(element);

    anime({
      targets: obj,
      count: end,
      duration,
      easing: "easeOutQuart",
      round: 1,
      update: () => $el.text(Math.round(obj.count)),
    });
  },

  typewriter(element, text, speed = 50) {
    const $el = $(element);
    $el.text("");

    return new Promise((resolve) => {
      let i = 0;
      const type = () => {
        if (i < text.length) {
          $el.text($el.text() + text.charAt(i));
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
    const obj = { value: from };
    const $el = $(element);
    const isInteger = Number.isInteger(to);

    anime({
      targets: obj,
      value: to,
      duration,
      easing: "easeInOutCubic",
      update: () => {
        $el.text(isInteger ? Math.round(obj.value) : obj.value.toFixed(2));
      },
    });
  },

  highlightElement(element, duration = 2000) {
    anime
      .timeline({
        targets: element,
      })
      .add({
        backgroundColor: "#fef3c7",
        duration: 300,
        easing: "easeOutQuad",
      })
      .add({
        backgroundColor: "rgba(255, 255, 255, 0)",
        duration: 300,
        delay: duration - 600,
        easing: "easeOutQuad",
      });
  },

  spin(element, duration = 1000) {
    const animation = anime({
      targets: element,
      rotate: "1turn",
      duration,
      loop: true,
      easing: "linear",
    });

    return {
      stop: () => animation.pause(),
    };
  },

  zoomIn(element, duration = 300) {
    return anime({
      targets: element,
      scale: [0, 1],
      opacity: [0, 1],
      duration,
      easing: "easeOutBack",
    }).finished;
  },

  zoomOut(element, duration = 300) {
    return anime({
      targets: element,
      scale: [1, 0],
      opacity: [1, 0],
      duration,
      easing: "easeInBack",
    }).finished;
  },

  rotate(element, angle = 360, duration = 500) {
    return anime({
      targets: element,
      rotate: angle,
      duration,
      easing: "easeInOutQuad",
    }).finished;
  },

  flip(element, axis = "Y", duration = 600) {
    return anime({
      targets: element,
      [`rotate${axis}`]: [0, 180],
      duration,
      easing: "easeInOutQuad",
    }).finished;
  },

  elastic(element, direction = "X", duration = 800) {
    return anime({
      targets: element,
      [`scale${direction}`]: [1, 1.2, 0.9, 1.05, 0.95, 1],
      duration,
      easing: "easeOutElastic(1, .5)",
    }).finished;
  },
};
