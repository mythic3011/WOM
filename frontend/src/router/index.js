import page from "page";
import { storage } from "/src/services/storageService.js";
import { notify } from "/src/utils/ui/notification.js";
import { renderNavbar, initNavbar } from "/src/common/navbar.js";
import { renderFooter, initFooter } from "/src/common/footer.js";
import { ROUTES } from "/src/config/routes.js";
import { SEO } from "/src/utils/seo.js";

import {
  HomePage,
  PerformancesListPage,
  PerformanceDetailPage,
  DevToolsPage,
  NotFoundPage,
  Admin,
  User,
  Auth,
} from "/src/pages/index.js";

function checkAuth(ctx, next) {
  const user = storage.getUser();
  if (!user) {
    notify.warning("Please login to continue");
    page.redirect(ROUTES.AUTH.LOGIN);
    return;
  }
  next();
}

function checkAdminAuth(ctx, next) {
  const user = storage.getUser();
  if (!user || user.role !== "admin") {
    notify.error("Access denied. Admin privileges required.");
    page.redirect(ROUTES.AUTH.LOGIN);
    return;
  }
  next();
}

async function loadPage(PageModule, params = {}) {
  const $app = $("#app");

  $app.html(`
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>
  `);

  try {
    const html = await PageModule.render(params);
    $app.html(html).addClass("page-transition");

    $("#navbar").html(renderNavbar());
    initNavbar();

    $("#footer").html(renderFooter());
    initFooter();

    if (PageModule.afterRender) {
      await PageModule.afterRender(params);
    }

    window.scrollTo(0, 0);

    document.title = PageModule.title || "Western Orchestral Music Performance";
  } catch (error) {
    console.error("Page load error:", error);
    $app.html(`
      <div class="container mx-auto px-4 py-8 text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Error Loading Page</h1>
        <p class="text-gray-600">${error.message || "An error occurred"}</p>
        <button onclick="window.location.reload()" class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg">
          Reload Page
        </button>
      </div>
    `);
  }
}

export function setupRouter() {
  page(ROUTES.HOME, () => {
    SEO.setHomePage();
    loadPage(HomePage);
  });
  page(ROUTES.PUBLIC.PERFORMANCES, () => {
    SEO.setPerformancesPage();
    loadPage(PerformancesListPage);
  });
  page(ROUTES.PUBLIC.PERFORMANCE_DETAIL, (ctx) => {
    loadPage(PerformanceDetailPage, { id: ctx.params.id });
  });

  page(ROUTES.PUBLIC.DEV_TOOLS, () => loadPage(DevToolsPage));
  page(ROUTES.AUTH.LOGIN, () => loadPage(Auth.LoginPage));
  page(ROUTES.AUTH.REGISTER, () => loadPage(Auth.RegisterPage));

  page(ROUTES.USER.DASHBOARD, checkAuth, () => {
    SEO.setUserDashboard();
    loadPage(User.DashboardPage);
  });
  page(ROUTES.USER.BOOKINGS, checkAuth, () => loadPage(User.BookingsPage));
  page(ROUTES.USER.BOOKING, (ctx) => {
    const urlParams = new URLSearchParams(ctx.querystring);
    const performance = urlParams.get("performance");
    const showtime = urlParams.get("showtime");
    loadPage(User.BookingPage, { performance, showtime });
  });
  page(ROUTES.USER.BOOKING_DETAIL, (ctx) =>
    loadPage(User.BookingPage, { id: ctx.params.id })
  );
  page(ROUTES.USER.PROFILE, checkAuth, () => loadPage(User.ProfilePage));
  page(ROUTES.USER.PAYMENT, checkAuth, () => loadPage(User.PaymentPage));
  page(ROUTES.USER.CONFIRMATION, checkAuth, () =>
    loadPage(User.ConfirmationPage)
  );

  page(ROUTES.ADMIN.DASHBOARD, checkAdminAuth, () => {
    SEO.setAdminDashboard();
    loadPage(Admin.DashboardPage);
  });
  page(ROUTES.ADMIN.PERFORMANCES, checkAdminAuth, () =>
    loadPage(Admin.PerformancesPage)
  );
  page(ROUTES.ADMIN.VENUES, checkAdminAuth, () => loadPage(Admin.VenuesPage));
  page(ROUTES.ADMIN.BOOKINGS, checkAdminAuth, () =>
    loadPage(Admin.BookingsPage)
  );
  page(ROUTES.ADMIN.USERS, checkAdminAuth, () => loadPage(Admin.UsersPage));
  page(ROUTES.ADMIN.SEAT_MANAGEMENT, checkAdminAuth, () =>
    loadPage(Admin.SeatsManagementPage)
  );
  page(ROUTES.ADMIN.SETTINGS, checkAdminAuth, () =>
    loadPage(Admin.SettingsPage)
  );

  page("*", () => loadPage(NotFoundPage));
}
