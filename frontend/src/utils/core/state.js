export function createState(initialState = {}) {
  const state = { ...initialState };
  const listeners = {};

  const handler = {
    get(target, property) {
      return target[property];
    },
    
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;
      
      if (listeners[property]) {
        listeners[property].forEach(callback => {
          callback(value, oldValue);
        });
      }
      
      return true;
    }
  };

  const proxy = new Proxy(state, handler);

  proxy.subscribe = function(property, callback) {
    if (!listeners[property]) {
      listeners[property] = [];
    }
    listeners[property].push(callback);
    
    return function unsubscribe() {
      const index = listeners[property].indexOf(callback);
      if (index > -1) {
        listeners[property].splice(index, 1);
      }
    };
  };

  proxy.getState = function() {
    return { ...state };
  };

  proxy.setState = function(updates) {
    Object.keys(updates).forEach(key => {
      proxy[key] = updates[key];
    });
  };

  return proxy;
}

export function useState(key, initialValue) {
  if (!window.__appState) {
    window.__appState = {};
  }
  
  if (window.__appState[key] === undefined) {
    window.__appState[key] = initialValue;
  }
  
  return {
    get value() {
      return window.__appState[key];
    },
    set value(newValue) {
      window.__appState[key] = newValue;
    },
    getValue() {
      return window.__appState[key];
    },
    setValue(newValue) {
      window.__appState[key] = newValue;
    }
  };
}


