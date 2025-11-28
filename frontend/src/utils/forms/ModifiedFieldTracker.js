export class ModifiedFieldTracker {
  constructor(initialData = {}) {
    this.originalData = this.deepClone(initialData);
    this.modifiedFields = new Set();
  }

  deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item));
    }
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  markModified(fieldName) {
    this.modifiedFields.add(fieldName);
  }

  isModified(fieldName) {
    return this.modifiedFields.has(fieldName);
  }

  getModifiedFields() {
    return Array.from(this.modifiedFields);
  }

  getPayload(currentData) {
    if (this.modifiedFields.size === 0) {
      return {};
    }

    const payload = {};
    for (const fieldName of this.modifiedFields) {
      if (Object.prototype.hasOwnProperty.call(currentData, fieldName)) {
        payload[fieldName] = currentData[fieldName];
      }
    }
    return payload;
  }

  reset(newInitialData = null) {
    if (newInitialData !== null) {
      this.originalData = this.deepClone(newInitialData);
    }
    this.modifiedFields.clear();
  }

  hasChanges() {
    return this.modifiedFields.size > 0;
  }

  getOriginalValue(fieldName) {
    return this.originalData[fieldName];
  }

  checkAndMarkModified(fieldName, currentValue) {
    const originalValue = this.originalData[fieldName];
    const isChanged = !this.valuesEqual(originalValue, currentValue);

    if (isChanged) {
      this.modifiedFields.add(fieldName);
    } else {
      this.modifiedFields.delete(fieldName);
    }

    return isChanged;
  }

  valuesEqual(val1, val2) {
    if (val1 === val2) {
      return true;
    }
    if (val1 === null || val1 === undefined) {
      return val2 === null || val2 === undefined || val2 === "";
    }
    if (val2 === null || val2 === undefined) {
      return val1 === null || val1 === undefined || val1 === "";
    }
    if (typeof val1 !== typeof val2) {
      return String(val1) === String(val2);
    }
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) {
        return false;
      }
      return val1.every((item, index) => this.valuesEqual(item, val2[index]));
    }
    if (typeof val1 === "object" && typeof val2 === "object") {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);
      if (keys1.length !== keys2.length) {
        return false;
      }
      return keys1.every((key) => this.valuesEqual(val1[key], val2[key]));
    }
    return false;
  }
}
