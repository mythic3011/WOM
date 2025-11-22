

import page from "page";

import {
  HomePage,
  PerformancesListPage,
  PerformanceDetailPage,
  NotFoundPage,
  Admin,
  User,
  Auth,
} from "@/pages/index.js";
import { renderNavbar, initNavbar, renderFooter, initFooter } from "@components/index.js";
import { ROUTES } from "@config/routes.js";
import { storage } from "@services/storageService.js";
import { SEO } from "@utils/seo.js";
import { notify } from "@utils/ui/notification.js";

const LOADING_HTML = `
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
  </div>
`;

const ERROR_HTML = (message) => `
  <div class="container mx-auto px-4 py-16 text-center">
    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Error Loading Page</h1>
    <p class="text-gray-600 mb-6">${message || "An error occurred"}</p>
    <button
      onclick="window.location.reload()"
      class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
    >
      <i class="fas fa-redo mr-2"></i>Reload Page
    </button>
  </div>
`;

function checkAuth(ctx, next) {
  const user = storage.getUser();
  if (!user) {
    notify.warning("Please login to continue");
    page.redirect(ROUTES.AUTH.LOGIN);
    return;
  }
  ctx.user = user;
  next();
}

function checkAdminAuth(ctx, next) {
  const user = storage.getUser();
  if (!user || user.role !== "admin") {
    notify.error("Access denied. Admin privileges required.");
    page.redirect(ROUTES.AUTH.LOGIN);
    return;
  }
  ctx.user = user;
  next();
}



export function updateNavigation() {
  $("#navbar").html(renderNavbar());
  initNavbar();
  $("#footer").html(renderFooter());
  initFooter();
}

async function loadPage(PageModule, params = {}, seoUpdate = null) {
  const $app = $("#app");

  $app.html(LOADING_HTML);

  try {
    if (seoUpdate) {
      seoUpdate();
    }

    const html = await PageModule.render(params);
    $app.html(html).addClass("page-transition");

    updateNavigation();

    if (PageModule.afterRender) {
      await PageModule.afterRender(params);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    document.title = PageModule.title || "Western Orchestral Music Performance";
  } catch (error) {
    console.error("Page load error:", error);
    $app.html(ERROR_HTML(error.message));
    updateNavigation();
  }
}

export function setupRouter() {
  page(ROUTES.HOME, () => loadPage(HomePage, {}, () => SEO.setHomePage()));

  page(ROUTES.PUBLIC.PERFORMANCES, () =>
    loadPage(PerformancesListPage, {}, () => SEO.setPerformancesPage())
  );

  page(ROUTES.PUBLIC.PERFORMANCE_DETAIL, (ctx) =>
    loadPage(PerformanceDetailPage, { id: ctx.params.id })
  );

  page(ROUTES.AUTH.LOGIN, () => loadPage(Auth.LoginPage));
  page(ROUTES.AUTH.REGISTER, () => loadPage(Auth.RegisterPage));

  page(ROUTES.USER.DASHBOARD, checkAuth, () =>
    loadPage(User.DashboardPage, {}, () => SEO.setUserDashboard())
  );

  page(ROUTES.USER.BOOKINGS, checkAuth, () => loadPage(User.BookingsPage));

  page(ROUTES.USER.BOOKING, (ctx) => {
    const urlParams = new URLSearchParams(ctx.querystring);
    loadPage(User.BookingPage, {
      performance: urlParams.get("performance") || urlParams.get("p"),
      showtime: urlParams.get("showtime"),
    });
  });

  page(ROUTES.USER.BOOKING_DETAIL, (ctx) =>
    loadPage(User.BookingPage, { id: ctx.params.id })
  );

  page(ROUTES.USER.PROFILE, checkAuth, () => loadPage(User.ProfilePage));

  page(ROUTES.USER.CONFIRMATION, checkAuth, () =>
    loadPage(User.ConfirmationPage)
  );

  page(ROUTES.ADMIN.DASHBOARD, checkAdminAuth, () =>
    loadPage(Admin.DashboardPage, {}, () => SEO.setAdminDashboard())
  );

  page(ROUTES.ADMIN.PERFORMANCES, checkAdminAuth, () =>
    loadPage(Admin.PerformancesPage)
  );

  page("/admin/venues", checkAdminAuth, () => loadPage(Admin.VenuesPage));
  page("/admin/venues/form", checkAdminAuth, () => loadPage(Admin.VenueFormPage));

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
