
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

window.$ = window.jQuery = $;

$(document).ready(async function () {
  updateNavigation();
  initSPALinks();
  initModalCloseHandlers();
  initializeScrollbars();

  if (import.meta.env.MODE === "development") {
    healthCheck.startMonitoring();
  }

  setupRouter();
  page.start();
});
