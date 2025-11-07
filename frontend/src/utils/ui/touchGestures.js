import Hammer from "hammerjs";

export class TouchGestureManager {
  constructor() {
    this.instances = new Map();
  }

  enable(element, options = {}) {
    if (this.instances.has(element)) {
      return this.instances.get(element);
    }

    const hammer = new Hammer(element, {
      touchAction: "auto",
      ...options,
    });

    this.instances.set(element, hammer);
    return hammer;
  }

  onSwipe(element, callback, direction = "all") {
    const hammer = this.enable(element);
    const directions = {
      left: Hammer.DIRECTION_LEFT,
      right: Hammer.DIRECTION_RIGHT,
      up: Hammer.DIRECTION_UP,
      down: Hammer.DIRECTION_DOWN,
      all: Hammer.DIRECTION_ALL,
    };

    hammer.get("swipe").set({ direction: directions[direction] });
    hammer.on("swipe", callback);

    return hammer;
  }

  onPinch(element, callback) {
    const hammer = this.enable(element, {
      recognizers: [[Hammer.Pinch, { enable: true }]],
    });

    hammer.on("pinch", callback);
    return hammer;
  }

  onRotate(element, callback) {
    const hammer = this.enable(element, {
      recognizers: [[Hammer.Rotate, { enable: true }]],
    });

    hammer.on("rotate", callback);
    return hammer;
  }

  onTap(element, callback, taps = 1) {
    const hammer = this.enable(element);
    hammer.get("tap").set({ taps });
    hammer.on("tap", callback);
    return hammer;
  }

  onPress(element, callback) {
    const hammer = this.enable(element);
    hammer.on("press", callback);
    return hammer;
  }

  onPan(element, callback) {
    const hammer = this.enable(element);
    hammer.on("pan", callback);
    return hammer;
  }

  destroy(element) {
    const hammer = this.instances.get(element);
    if (hammer) {
      hammer.destroy();
      this.instances.delete(element);
    }
  }

  destroyAll() {
    this.instances.forEach((hammer) => hammer.destroy());
    this.instances.clear();
  }
}

export const touchGestures = new TouchGestureManager();
