
import { ROUTES } from "@config/routes.js";
import { login } from "@utils/core/auth.js";
import { navigate } from "@utils/core/navigation.js";
import { Toast } from "@components/Toast.js";

const REMEMBER_KEY = "wom_remembered_user";

export default {
  title: "Login | WOM",

  async render() {
    return `
      <main class="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
        <div class="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style="background-image: url('/img/loginBg2.jpg');">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/70 to-indigo-900/80"></div>
        </div>

        <div class="relative z-10 w-full max-w-md">
          <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4 shadow-lg">
                <i class="fas fa-music text-3xl text-white"></i>
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-2">
                Welcome to WOM
              </h2>
              <p class="text-gray-600">
                Sign in to book your orchestral experience
              </p>
            </div>

            <div id="loginAlert" class="hidden mb-4 p-4 rounded-lg border-l-4" role="alert">
              <div class="flex items-center gap-3">
                <i class="fas fa-exclamation-circle text-xl"></i>
                <div class="flex-1">
                  <p class="font-semibold text-sm" id="loginAlertTitle"></p>
                  <p class="text-sm mt-1" id="loginAlertMessage"></p>
                </div>
                <button type="button" id="closeAlert" class="text-current opacity-70 hover:opacity-100 transition-opacity">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <form id="loginForm" class="space-y-6">
              <div>
                <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">
                  Username or Email
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="fas fa-user text-gray-400"></i>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autocomplete="username"
                    class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Enter your username or email"
                  />
                </div>
              </div>

              <div>
                <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autocomplete="current-password"
                    class="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    id="togglePassword"
                    class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title="Toggle password visibility"
                  >
                    <i class="fas fa-eye" id="togglePasswordIcon"></i>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label for="remember" class="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>

                <a href="#" class="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                id="loginBtn"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <i class="fas fa-sign-in-alt"></i>
                <span>Sign In</span>
              </button>
            </form>

            <div class="mt-6 pt-6 border-t border-gray-200 text-center">
              <p class="text-sm text-gray-600">
                Don't have an account?
                <a href="/register" data-link class="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Create one now
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    const { getCurrentUser } = await import("@utils/core/auth.js");
    const currentUser = getCurrentUser();

    if (currentUser) {
      const { ROUTES } = await import("@config/routes.js");
      const { navigate } = await import("@utils/core/navigation.js");

      if (currentUser.role === "admin") {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(ROUTES.USER.DASHBOARD);
      }
      return;
    }

    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.href = "/img/loginBg2.jpg";
    preloadLink.fetchPriority = "high";
    if (!document.querySelector("link[href=\"/img/loginBg2.jpg\"]")) {
      document.head.appendChild(preloadLink);
    }

    const rememberedUser = localStorage.getItem(REMEMBER_KEY);
    if (rememberedUser) {
      $("#username").val(rememberedUser);
      $("#remember").prop("checked", true);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error === "unauthorized") {
      this.showAlert("Authentication Required", "Please login to continue", "warning");
    }

    $("#loginForm").on("submit", (e) => this.handleLogin(e));
    $("#togglePassword").on("click", () => this.togglePassword());
    $("#closeAlert").on("click", () => this.hideAlert());
  },

  showAlert(title, message, type = "error") {
    const $alert = $("#loginAlert");
    const $title = $("#loginAlertTitle");
    const $message = $("#loginAlertMessage");

    $title.text(title);
    $message.text(message);

    $alert.removeClass("hidden bg-red-50 border-red-500 text-red-800 bg-yellow-50 border-yellow-500 text-yellow-800 bg-blue-50 border-blue-500 text-blue-800");

    if (type === "error") {
      $alert.addClass("bg-red-50 border-red-500 text-red-800");
    } else if (type === "warning") {
      $alert.addClass("bg-yellow-50 border-yellow-500 text-yellow-800");
    } else if (type === "info") {
      $alert.addClass("bg-blue-50 border-blue-500 text-blue-800");
    }

    $alert.removeClass("hidden").hide().slideDown(300);

    Toast[type](message, title);
  },

  hideAlert() {
    $("#loginAlert").slideUp(300, function () {
      $(this).addClass("hidden");
    });
  },

  togglePassword() {
    const passwordInput = $("#password");
    const toggleIcon = $("#togglePasswordIcon");
    const currentType = passwordInput.attr("type");

    if (currentType === "password") {
      passwordInput.attr("type", "text");
      toggleIcon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      passwordInput.attr("type", "password");
      toggleIcon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  },

  async handleLogin(e) {
    e.preventDefault();

    const usernameOrEmail = $("#username").val().trim();
    const password = $("#password").val();
    const remember = $("#remember").is(":checked");

    if (!usernameOrEmail || !password) {
      notify.warning("Please fill in all fields");
      return;
    }

    const $btn = $("#loginBtn");
    const originalHTML = $btn.html();
    $btn.prop("disabled", true).html(`
      <i class="fas fa-spinner fa-spin"></i>
      <span>Signing in...</span>
    `);

    try {
      this.hideAlert();

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, usernameOrEmail);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const user = await login(usernameOrEmail, password);

      Toast.success(`Welcome back, ${user.name}!`, "Login Successful");

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");

      setTimeout(() => {
        if (redirect) {
          navigate(redirect);
        } else if (user.role === "admin") {
          navigate(ROUTES.ADMIN.DASHBOARD);
        } else {
          navigate(ROUTES.USER.DASHBOARD);
        }
      }, 500);

    } catch (error) {
      $btn.prop("disabled", false).html(originalHTML);

      let errorTitle = "Login Failed";
      let errorMessage = "Please check your credentials and try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status >= 500) {
        errorTitle = "Server Error";
        errorMessage = "Our servers are experiencing issues. Please try again later.";
      } else if (error.status === 401) {
        errorMessage = "Invalid username/email or password. Please try again.";
      }

      // Show alert in UI
      this.showAlert(errorTitle, errorMessage, "error");

      console.error("Login error:", error);
    }
  },
};
