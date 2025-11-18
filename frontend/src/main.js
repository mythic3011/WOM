import "core-js/stable";
import "regenerator-runtime/runtime";
import $ from "jquery";
import page from "page";
import { setupRouter, updateNavigation } from "@/router/index.js";
import { initSPALinks } from "@utils/core/navigation.js";
import { initModalCloseHandlers } from "@components/index.js";
import { initializeScrollbars } from "@utils/ui/scrollbar.js";
import { healthCheck } from "@utils/healthCheck.js";
import "@/assets/fa-fontawesome-fixed.css";
import "@/assets/fa-solid-fixed.css";
import "@/assets/fa-brands-fixed.css";
import "@/assets/style.css";

window.$ = window.jQuery = $;
import "dayjs/locale/zh-hk";

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
