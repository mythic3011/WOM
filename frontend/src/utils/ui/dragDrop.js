import Sortable from "sortablejs";

export class DragDropManager {
  constructor(options = {}) {
    this.instances = new Map();
    this.defaultOptions = {
      animation: 150,
      ghostClass: "opacity-50",
      dragClass: "opacity-75",
      ...options,
    };
  }

  makeElementDraggable(element, options = {}) {
    const sortable = Sortable.create(element, {
      ...this.defaultOptions,
      ...options,
      onStart: (evt) => {
        if (options.onDragStart) options.onDragStart(evt);
      },
      onMove: (evt) => {
        if (options.onDrag) options.onDrag(evt);
      },
      onEnd: (evt) => {
        if (options.onDragEnd) options.onDragEnd(evt);
      },
    });

    this.instances.set(element, sortable);
    return sortable;
  }

  makeSortable(element, options = {}) {
    return this.makeElementDraggable(element, {
      handle: options.handle,
      group: options.group,
      sort: options.sort !== false,
      disabled: options.disabled || false,
      ...options,
    });
  }

  destroy(element) {
    const sortable = this.instances.get(element);
    if (sortable) {
      sortable.destroy();
      this.instances.delete(element);
    }
  }

  destroyAll() {
    this.instances.forEach((sortable) => sortable.destroy());
    this.instances.clear();
  }
}

export const dragDrop = new DragDropManager();
