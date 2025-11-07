import page from "page";
import { setupRouter, updateNavigation } from "/src/router/index.js";
import { initSPALinks } from "/src/utils/core/navigation.js";
import { initModalCloseHandlers } from "/src/components/Modal.js";
import { initializeApp } from "/src/utils/initApp.js";
import { initializeScrollbars } from "/src/utils/ui/scrollbar.js";
import "/src/assets/fa-fontawesome-fixed.css";
import "/src/assets/fa-solid-fixed.css";
import "/src/assets/fa-brands-fixed.css";
import "/src/assets/style.css";
import "dayjs/locale/zh-hk";

$(document).ready(async function () {
  await initializeApp();

  updateNavigation();
  initSPALinks();
  initModalCloseHandlers();
  initializeScrollbars();

  setupRouter();
  page.start();
});
