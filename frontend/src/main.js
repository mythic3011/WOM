
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

window.$ = window.jQuery = $;

let sessionCheckInterval = null;

async function validateSession() {
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    try {
      const validUser = await checkSession();
      
      if (!validUser) {
        clearUser();
        notify.warning("Your session has expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return false;
      }
    } catch (error) {
      console.error("Session validation error:", error);
      clearUser();
      notify.error("Session validation failed. Please login again.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return false;
    }
  }
  
  return true;
}

function startSessionMonitoring() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
  
  sessionCheckInterval = setInterval(async () => {
    await validateSession();
  }, 5 * 60 * 1000);
}

$(async function () {
  await validateSession();
  
  updateNavigation();
  initSPALinks();
  initModalCloseHandlers();
  initializeScrollbars();

  if (import.meta.env.MODE === "development") {
    healthCheck.startMonitoring();
  }

  startSessionMonitoring();

  setupRouter();
  page.start();
});
