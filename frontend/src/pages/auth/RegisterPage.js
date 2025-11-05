import { notify } from "/src/utils/ui/notification.js";
import { navigate } from "/src/utils/core/navigation.js";
import { formValidator } from "/src/utils/forms/formValidator.js";
import { userService } from "/src/services/userService.js";
import { phoneUtils } from "/src/utils/forms/phoneFormat.js";
import {
  createImageUpload,
  initImageUpload,
  getImageDataURL,
} from "/src/components/ImageUpload.js";

export default {
  title: "Register | WOM",

  async render() {
    return `
      <main class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Already have an account?
              <a href="/login" data-link class="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </div>
          <form id="registerForm" class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700">
                  Username <span class="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autocomplete="username"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="johndoe"
                />
                <p class="mt-1 text-xs text-gray-500">3-20 characters, letters, numbers, underscore, or hyphen</p>
              </div>
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">
                  Password <span class="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autocomplete="new-password"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <p class="mt-1 text-xs text-gray-500">At least 8 characters, include uppercase, lowercase, and number</p>
              </div>
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                  Confirm Password <span class="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autocomplete="new-password"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div class="grid grid-cols-4 gap-2">
                <div class="col-span-1">
                  <label for="title" class="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <select
                    id="title"
                    name="title"
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label for="name" class="block text-sm font-medium text-gray-700">
                    Full Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autocomplete="name"
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  Email <span class="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label for="gender" class="block text-sm font-medium text-gray-700">
                  Gender <span class="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label for="birthday" class="block text-sm font-medium text-gray-700">
                  Birthday <span class="text-red-500">*</span>
                </label>
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
                  required
                  autocomplete="bday"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p class="mt-1 text-xs text-gray-500">You must be at least 13 years old</p>
              </div>
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700">
                  Phone Number (Hong Kong)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputmode="numeric"
                  maxlength="9"
                  autocomplete="tel"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., 9123 4567"
                />
                <p class="mt-1 text-xs text-gray-500">8 digits, starts with 2-9 (optional)</p>
              </div>
              <div id="profileImageUpload"></div>
            </div>

            <div class="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="terms" class="ml-2 block text-sm text-gray-900">
                I agree to the Terms and Conditions
              </label>
            </div>

            <div>
              <button
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i class="fas fa-user-plus text-indigo-500 group-hover:text-indigo-400"></i>
                </span>
                Create Account
              </button>
            </div>
          </form>
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

    if (!userService.validateUsername(username)) {
      notify.error(
        "Username must be 3-20 characters, letters, numbers, underscore, or hyphen only"
      );
      return;
    }

    if (userService.checkDuplicateUsername(username)) {
      notify.error(
        "This username is already taken. Please choose another one."
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

    if (userService.checkDuplicateEmail(email)) {
      notify.error(
        "This email is already registered. Please use another email or login."
      );
      return;
    }

    if (!userService.validateAge(birthday)) {
      notify.error("You must be at least 13 years old to register");
      return;
    }

    if (phone && !userService.validatePhone(phone)) {
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
      };

      const result = await userService.registerUser(userData);

      if (result.success) {
        notify.success(`Registration successful! Welcome to WOM, ${name}!`);

        setTimeout(() => {
          navigate("/user/dashboard");
        }, 1000);
      } else {
        notify.error(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      notify.error("Registration failed. Please try again.");
    }
  },
};
