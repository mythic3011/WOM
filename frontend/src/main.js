import page from "page";
import { setupRouter } from "/src/router/index.js";
import { initSPALinks } from "/src/utils/core/navigation.js";
import { renderNavbar, initNavbar } from "/src/common/navbar.js";
import { renderFooter, initFooter } from "/src/common/footer.js";
import { initModalCloseHandlers } from "/src/components/Modal.js";
import { initializeApp } from "/src/utils/initApp.js";
import "/src/assets/fa-fontawesome-fixed.css";
import "/src/assets/fa-solid-fixed.css";
import "/src/assets/fa-brands-fixed.css";
import "/src/assets/style.css";
import "dayjs/locale/zh-hk";

$(document).ready(async function () {
  await initializeApp();

  $("#navbar").html(renderNavbar());
  $("#footer").html(renderFooter());

  initNavbar();
  initFooter();
  initSPALinks();
  initModalCloseHandlers();

  setupRouter();
  page.start();
});
