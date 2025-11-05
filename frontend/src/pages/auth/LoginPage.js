import { notify } from "/src/utils/ui/notification.js";
import { navigate } from "/src/utils/core/navigation.js";
import { userService } from "/src/services/userService.js";

export default {
  title: "Login | WOM",

  async render() {
    return `
      <main class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Or
              <a href="/register" data-link class="font-medium text-indigo-600 hover:text-indigo-500">
                create a new account
              </a>
            </p>
          </div>
          <form id="loginForm" class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm -space-y-px">
              <div>
                <label for="username" class="sr-only">Username or Email</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autocomplete="username"
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Username or Email"
                />
              </div>
              <div>
                <label for="password" class="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autocomplete="current-password"
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="remember" class="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div class="text-sm">
                <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i class="fas fa-lock text-indigo-500 group-hover:text-indigo-400"></i>
                </span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </main>
    `;
  },

  async afterRender() {
    const rememberedUserId = userService.getRememberedUserId();
    if (rememberedUserId) {
      $("#username").val(rememberedUserId);
      $("#remember").prop("checked", true);
    }

    $("#loginForm").on("submit", (e) => this.handleLogin(e));
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

    if (remember) {
      userService.rememberUserId(usernameOrEmail);
    } else {
      userService.forgetUserId();
    }

    const result = await userService.loginUser(usernameOrEmail, password);

    if (result.success) {
      notify.success(`Welcome back, ${result.user.name}!`);

      setTimeout(() => {
        if (result.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }, 500);
    } else {
      notify.error(result.error || "Login failed. Please try again.");
    }
  },
};
