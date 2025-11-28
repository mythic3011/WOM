import EnvironmentValidator from "#config/EnvironmentValidator.js";

const validator = new EnvironmentValidator();

export const maskSensitiveData = (data) => {
  if (typeof data === "string") {
    return maskSensitiveString(data);
  }
  
  if (typeof data === "object" && data !== null) {
    return maskSensitiveObject(data);
  }
  
  return data;
};

export const maskSensitiveString = (str) => {
  const sensitiveKeys = validator.schema.sensitive;
  let masked = str;
  
  for (const key of sensitiveKeys) {
    const value = process.env[key];
    if (value && value.length > 0) {
      const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      masked = masked.replace(regex, "***");
    }
  }
  
  return masked;
};

export const maskSensitiveObject = (obj) => {
  const sensitiveKeywords = ["password", "secret", "pass", "token", "key", "auth"];
  const masked = Array.isArray(obj) ? [...obj] : { ...obj };
  
  const maskRecursive = (target) => {
    for (const key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeywords.some((keyword) =>
          lowerKey.includes(keyword)
        );
        
        if (isSensitive && typeof target[key] === "string") {
          target[key] = "***";
        } else if (typeof target[key] === "object" && target[key] !== null) {
          maskRecursive(target[key]);
        }
      }
    }
  };
  
  maskRecursive(masked);
  return masked;
};

export const isSensitiveKey = (key) => {
  const sensitiveKeywords = ["password", "secret", "pass", "token", "key", "auth"];
  const lowerKey = key.toLowerCase();
  return sensitiveKeywords.some((keyword) =>
    lowerKey.includes(keyword)
  );
};

export default {
  maskSensitiveData,
  maskSensitiveString,
  maskSensitiveObject,
  isSensitiveKey
};
