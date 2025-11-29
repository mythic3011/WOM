
import "core-js/stable";
import "regenerator-runtime/runtime";
import $ from "jquery";
import page from "page";

import "@/assets/fa-fontawesome-fixed.css";
import "@/assets/fa-solid-fixed.css";
import "@/assets/fa-brands-fixed.css";

import { setupRouter, updateNavigation } from "@/router/index.js";
import { initModalCloseHandlers } from "@components/index.js";
import { initSPALinks } from "@utils/core/navigation.js";
import { healthCheck } from "@utils/healthCheck.js";
import { initializeScrollbars } from "@utils/ui/scrollbar.js";
import { checkSession, getCurrentUser, clearUser } from "@utils/core/auth.js";
import { notify } from "@utils/ui/notification.js";
import { ROUTES } from "@config/routes.js";

window.$ = window.jQuery = $;

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;
const AUTH_PAGES = [ROUTES.AUTH.LOGIN, ROUTES.AUTH.REGISTER];

class SessionManager {
  constructor() {
    this.intervalId = null;
  }

  isAuthPage() {
    return AUTH_PAGES.includes(window.location.pathname);
  }

  async validate() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return true;
    }

    try {
      const validUser = await checkSession();
      
      if (!validUser) {
        this.handleInvalidSession("Your session has expired. Please login again.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      this.handleInvalidSession("Session validation failed. Please login again.");
      return false;
    }
  }

  handleInvalidSession(message) {
    clearUser();
    
    if (!this.isAuthPage()) {
      notify.warning(message);
      setTimeout(() => {
        window.location.href = ROUTES.AUTH.LOGIN;
      }, 1500);
    }
  }

  startMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.validate();
    }, SESSION_CHECK_INTERVAL);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

class App {
  constructor() {
    this.sessionManager = new SessionManager();
  }

  async initializeAuth() {
    return await this.sessionManager.validate();
  }

  initializeUI() {
    updateNavigation();
    initSPALinks();
    initModalCloseHandlers();
    initializeScrollbars();
  }

  initializeDevelopmentTools() {
    if (import.meta.env.MODE === "development") {
      healthCheck.startMonitoring();
    }
  }

  initializeRouter() {
    setupRouter();
    page.start();
  }

  async start() {
    await this.initializeAuth();
    this.initializeUI();
    this.initializeDevelopmentTools();
    this.sessionManager.startMonitoring();
    this.initializeRouter();
  }
}

$(async function () {
  const app = new App();
  await app.start();
});
