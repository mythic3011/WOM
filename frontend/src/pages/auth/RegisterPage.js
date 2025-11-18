import { notify } from "@utils/ui/notification.js";
import { navigate } from "@utils/core/navigation.js";
import { formValidator } from "@utils/forms/formValidator.js";
import { phoneUtils } from "@utils/forms/phoneFormat.js";
import { authAPI, handleApiError } from "@services/apiClient.js";
import { setUser } from "@utils/core/auth.js";
import {
  createImageUpload,
  initImageUpload,
  getImageDataURL,
} from "@components/ImageUpload.js";

export default {
  title: "Register | WOM",

  async render() {
    return `
      <main class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-5xl mx-auto">
          <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                  <i class="fas fa-user-plus text-3xl text-white"></i>
                </div>
                <h2 class="text-3xl font-bold text-white mb-2">
                  Create Your Account
                </h2>
                <p class="text-indigo-100">
                  Join us and start booking your favorite performances
                </p>
              </div>
            </div>

            <form id="registerForm" class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="md:col-span-2">
                  <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
                    <i class="fas fa-info-circle text-indigo-600 text-lg mt-0.5"></i>
                    <div class="text-sm text-indigo-900">
                      <p class="font-semibold mb-1">Account Requirements</p>
                      <ul class="list-disc list-inside text-indigo-800 space-y-1">
                        <li>Choose a unique username (3-20 characters)</li>
                        <li>Password must be at least 8 characters with uppercase, lowercase, and number</li>
                        <li>You must be at least 13 years old</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div class="md:col-span-2">
                  <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-key text-indigo-600"></i>
                    Account Credentials
                  </h3>
                </div>

                <div>
                  <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">
                    Username <span class="text-red-500">*</span>
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
                      placeholder="johndoe"
                    />
                  </div>
                  <p class="mt-1.5 text-xs text-gray-500">3-20 characters, letters, numbers, underscore, or hyphen</p>
                </div>

                <div>
                  <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i class="fas fa-envelope text-gray-400"></i>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autocomplete="email"
                      class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span class="text-red-500">*</span>
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
                      autocomplete="new-password"
                      class="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
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
                  <p class="mt-1.5 text-xs text-gray-500">At least 8 characters, include uppercase, lowercase, and number</p>
                </div>

                <div>
                  <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i class="fas fa-lock text-gray-400"></i>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      autocomplete="new-password"
                      class="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      id="toggleConfirmPassword"
                      class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                      title="Toggle password visibility"
                    >
                      <i class="fas fa-eye" id="toggleConfirmPasswordIcon"></i>
                    </button>
                  </div>
                </div>

                <div class="md:col-span-2 mt-4">
                  <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-id-card text-indigo-600"></i>
                    Personal Information
                  </h3>
                </div>

                <div class="md:col-span-2 grid grid-cols-4 gap-4">
                  <div class="col-span-1">
                    <label for="title" class="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <select
                      id="title"
                      name="title"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                    >
                      <option value="">--</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Miss">Miss</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                    </select>
                  </div>
                  <div class="col-span-3">
                    <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autocomplete="name"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label for="gender" class="block text-sm font-semibold text-gray-700 mb-2">
                    Gender <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label for="birthday" class="block text-sm font-semibold text-gray-700 mb-2">
                    Birthday <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i class="fas fa-calendar text-gray-400"></i>
                    </div>
                    <input
                      id="birthday"
                      name="birthday"
                      type="date"
                      required
                      autocomplete="bday"
                      class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                    />
                  </div>
                  <p class="mt-1.5 text-xs text-gray-500">You must be at least 13 years old</p>
                </div>

                <div>
                  <label for="phone" class="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number (Hong Kong)
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i class="fas fa-phone text-gray-400"></i>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputmode="numeric"
                      maxlength="9"
                      autocomplete="tel"
                      class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="9123 4567"
                    />
                  </div>
                  <p class="mt-1.5 text-xs text-gray-500">8 digits, starts with 2-9 (optional)</p>
                </div>

                <div class="md:col-span-2" id="profileImageUpload"></div>
              </div>

              <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <div class="flex items-start gap-3">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label for="terms" class="text-sm text-gray-700 cursor-pointer select-none">
                    I agree to the <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Terms and Conditions</a> and <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                id="registerBtn"
                class="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <i class="fas fa-user-plus"></i>
                <span>Create Account</span>
              </button>

              <div class="mt-6 pt-6 border-t border-gray-200 text-center">
                <p class="text-sm text-gray-600">
                  Already have an account?
                  <a href="/login" data-link class="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Sign in instead
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    $("#profileImageUpload").html(
      createImageUpload({
        id: "profileImage",
        label: "Profile Image (Optional)",
        preview: true,
        previewSize: "24",
        required: false,
      })
    );

    initImageUpload("profileImageInput", "profileImagePreview", {
      maxSize: 5,
      shape: "rounded-full",
      previewSize: "24",
    });

    $("#phone").on("input", function () {
      const value = $(this).val();
      const cleaned = phoneUtils.cleanPhone(value);
      const formatted = phoneUtils.formatHKPhone(cleaned);
      $(this).val(formatted);
    });

    $("#registerForm").on("submit", (e) => this.handleRegister(e));

    $("#togglePassword").on("click", () =>
      this.togglePasswordVisibility("password", "togglePasswordIcon")
    );
    $("#toggleConfirmPassword").on("click", () =>
      this.togglePasswordVisibility(
        "confirmPassword",
        "toggleConfirmPasswordIcon"
      )
    );
  },

  togglePasswordVisibility(inputId, iconId) {
    const passwordInput = $(`#${inputId}`);
    const toggleIcon = $(`#${iconId}`);
    const currentType = passwordInput.attr("type");

    if (currentType === "password") {
      passwordInput.attr("type", "text");
      toggleIcon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      passwordInput.attr("type", "password");
      toggleIcon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  },

  async handleRegister(e) {
    e.preventDefault();

    const username = $("#username").val().trim();
    const password = $("#password").val();
    const confirmPassword = $("#confirmPassword").val();
    const title = $("#title").val();
    const name = $("#name").val().trim();
    const email = $("#email").val().trim();
    const gender = $("#gender").val();
    const birthday = $("#birthday").val();
    const phone = phoneUtils.cleanPhone($("#phone").val());
    const terms = $("#terms").is(":checked");

    if (
      !username ||
      !password ||
      !confirmPassword ||
      !name ||
      !email ||
      !gender ||
      !birthday
    ) {
      notify.warning("Please fill in all required fields");
      return;
    }

    if (username.length < 3 || username.length > 30) {
      notify.error("Username must be 3-30 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      notify.error(
        "Username can only contain letters, numbers, underscore, or hyphen"
      );
      return;
    }

    const passwordValidation = formValidator.validatePassword(password);
    if (!passwordValidation.valid) {
      notify.error(passwordValidation.error);
      return;
    }

    if (password !== confirmPassword) {
      notify.error("Passwords do not match");
      return;
    }

    const emailValidation = formValidator.validateEmail(email);
    if (!emailValidation.valid) {
      notify.error(emailValidation.error);
      return;
    }

    const birthDate = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      notify.error("You must be at least 13 years old to register");
      return;
    }

    if (phone && (phone.length !== 8 || !/^[2-9]/.test(phone))) {
      notify.error(
        "Invalid Hong Kong phone number. Must be 8 digits starting with 2-9"
      );
      return;
    }

    if (!terms) {
      notify.warning("Please accept the terms and conditions");
      return;
    }

    try {
      const $btn = $("#registerBtn");
      const originalHTML = $btn.html();
      $btn.prop("disabled", true).html(`
        <i class="fas fa-spinner fa-spin"></i>
        <span>Creating your account...</span>
      `);

      const profileImageData = await getImageDataURL("profileImageInput");

      const userData = {
        username,
        password,
        title,
        name,
        email,
        gender,
        birthday,
        phone,
        profileImage: profileImageData,
        role: "user",
        status: "active",
      };

      const response = await authAPI.register(userData);

      setUser(response.user);

      notify.success(`Registration successful! Welcome to WOM, ${name}!`);

      setTimeout(() => {
        navigate("/user/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      $("#registerBtn").prop("disabled", false).html(`
        <i class="fas fa-user-plus"></i>
        <span>Create Account</span>
      `);
      handleApiError(error, "Registration failed. Please try again.");
    }
  },
};
