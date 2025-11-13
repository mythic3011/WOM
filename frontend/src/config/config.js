export const APP_CONFIG = {
  name: "Western Orchestral Music Performance",
  version: "1.0.0",
  apiBaseUrl: "/api",
  environment: import.meta.env.MODE || "development",
};

export const COMPANY_INFO = {
  name: "Western Orchestral Music",
  fullName: "Western Orchestral Music Performance",
  address: {
    line1: "123 Concert Hall Avenue",
    line2: "",
    city: "Hong Kong",
    country: "Hong Kong SAR",
  },
  contact: {
    phone: "+852 2333 0600",
    email: "info@wom.hk",
    website: "www.wom.hk",
  },
  business: {
    registrationNumber: "BR-123456789",
    taxId: "TAX-987654321",
  },
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};
