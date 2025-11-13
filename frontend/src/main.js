import page from "page";
import { setupRouter, updateNavigation } from "/src/router/index.js";
import { initSPALinks } from "/src/utils/core/navigation.js";
import { initModalCloseHandlers } from "/src/components/Modal.js";
import { initializeScrollbars } from "/src/utils/ui/scrollbar.js";
import { healthCheck } from "/src/utils/healthCheck.js";
import "/src/assets/fa-fontawesome-fixed.css";
import "/src/assets/fa-solid-fixed.css";
import "/src/assets/fa-brands-fixed.css";
import "/src/assets/style.css";
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
