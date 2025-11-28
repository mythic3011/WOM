import { vi } from "vitest";

// Mock jQuery globally
global.$ = vi.fn(() => ({
    html: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    trigger: vi.fn(),
    addClass: vi.fn(),
    removeClass: vi.fn(),
    toggleClass: vi.fn(),
    closest: vi.fn(),
}));

global.jQuery = global.$;
