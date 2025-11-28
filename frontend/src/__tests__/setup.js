import { vi } from "vitest";

global.fetch = vi.fn();

const localStorageData = {};
global.localStorage = {
  getItem: vi.fn((key) => localStorageData[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageData[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageData[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageData).forEach((key) => delete localStorageData[key]);
  }),
};

const sessionStorageData = {};
global.sessionStorage = {
  getItem: vi.fn((key) => sessionStorageData[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageData[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageData[key];
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStorageData).forEach((key) => delete sessionStorageData[key]);
  }),
};
