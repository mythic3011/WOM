
import dayjs from "dayjs";
import Swal from "sweetalert2";

import { Avatar } from "@components/common/Avatar.js";
import { FormComponents } from "@components/FormComponents.js";
import { ResponseExtractor, userAPI, handleApiError, userService } from "@services/index.js";
import { SwalColors } from "@utils/colors.js";
import { getCurrentUser, logout } from "@utils/core/auth.js";
import { phoneUtils } from "@utils/forms/phoneFormat.js";
import { notify } from "@utils/ui/notification.js";

export default {
  title: "Profile | User",
  fullUserData: null,

  parseBirthdayValue(birthday) {
    if (!birthday) {
      return "";
    }

    try {
      const date = dayjs(birthday);
      if (!date.isValid()) {
        console.warn("Invalid birthday format received:", birthday);
        return "";
      }
      return date.format("YYYY-MM-DD");
    } catch (error) {
      console.error("Error parsing birthday:", error, birthday);
      return "";
    }
  },

  parseGenderValue(gender) {
    if (!gender) {
      return "";
    }

    const validGenders = ["male", "female", "other", "prefer_not_to_say"];
    const normalizedGender = String(gender).toLowerCase().trim();

    if (!validGenders.includes(normalizedGender)) {
      console.warn("Invalid gender value received:", gender);
      return "";
    }

    return normalizedGender;
  },

  async render() {
    const user = getCurrentUser();

    try {
      const response = await userAPI.getById(user.id);
      this.fullUserData =
        ResponseExtractor.extractSingle(response, "user") || user;
    } catch (error) {
      this.fullUserData = user;
    }

    const fullUserData = this.fullUserData;

    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          ${FormComponents.pageHeader({
      title: "Profile Settings",
      subtitle: "Manage your personal information and account settings",
      icon: "fa-user-circle",
    })}

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1">
              <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-6">
                <div class="text-center">
                  <div class="flex justify-center mb-4">
                    ${Avatar.render({
      src: fullUserData?.profileImage || user?.profileImage,
      name: user?.name || "User",
      size: "2xl",
      editable: true,
      userId: user?.id,
    })}
                  </div>
                  <h3 class="mt-4 text-lg font-bold text-gray-900">${user?.name || "User"
      }</h3>
                  <p class="text-sm text-gray-500">${user?.email || ""}</p>
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    ${FormComponents.badge({
        text: user?.role === "admin" ? "Administrator" : "User",
        color: user?.role === "admin" ? "purple" : "blue",
        icon:
          user?.role === "admin" ? "fa-shield-alt" : "fa-user",
      })}
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-gray-600">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">User ID:</span>
                      <span class="font-mono font-semibold">#${fullUserData?.userId || user?.userId || ""
      }</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">Username:</span>
                      <span class="font-mono font-medium">${fullUserData?.username || user?.username || ""
      }</span>
                    </div>
                    ${fullUserData?.gender
        ? `
                      <div class="flex items-center justify-between">
                        <span class="text-gray-500">Gender:</span>
                        <span class="font-medium capitalize">${fullUserData.gender.replace(
          /_/g,
          " "
        )}</span>
                      </div>
                    `
        : ""
      }
                    ${fullUserData?.birthday && dayjs(fullUserData.birthday).isValid()
        ? `
                      <div class="flex items-center justify-between">
                        <span class="text-gray-500">Birthday:</span>
                        <span class="font-medium">${dayjs(
          fullUserData.birthday
        ).format("MMM D, YYYY")}</span>
                      </div>
                    `
        : ""
      }
                    ${fullUserData?.createdAt
        ? `
                      <div class="flex items-center justify-between">
                        <span class="text-gray-500">Member since:</span>
                        <span class="font-medium">${dayjs(
          fullUserData.createdAt
        ).format("MMM YYYY")}</span>
                      </div>
                    `
        : ""
      }
                  </div>

                  <div class="mt-6 pt-4 border-t border-gray-200">
                    <div class="space-y-2">
                      ${user?.role === "admin"
        ? `
                        <a href="/admin/dashboard" data-link class="block w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium">
                          <i class="fas fa-tachometer-alt mr-2"></i>
                          Admin Dashboard
                        </a>
                        <a href="/admin/settings" data-link class="block w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium">
                          <i class="fas fa-cog mr-2"></i>
                          System Settings
                        </a>
                      `
        : `
                        <a href="/user/dashboard" data-link class="block w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium">
                          <i class="fas fa-home mr-2"></i>
                          My Dashboard
                        </a>
                        <a href="/user/bookings" data-link class="block w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                          <i class="fas fa-ticket-alt mr-2"></i>
                          My Bookings
                        </a>
                        <a href="/performances" data-link class="block w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                          <i class="fas fa-music mr-2"></i>
                          Browse Shows
                        </a>
                      `
      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-2 space-y-6">
              <form id="profileForm">
                <div class="bg-white rounded-lg shadow-md border border-gray-200">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-bold text-gray-900 flex items-center">
                      <i class="fas fa-user text-indigo-600 mr-2"></i>
                      Personal Information
                    </h2>
                  </div>
                  <div class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        ${FormComponents.input({
        id: "displayUserId",
        type: "text",
        label: "User ID",
        value: `#${fullUserData?.userId || user?.userId || ""
          }`,
        disabled: true,
        readonly: true,
      })}
                        <p class="mt-1 text-xs text-gray-500">
                          <i class="fas fa-info-circle text-gray-400"></i>
                          Sequential user identifier
                        </p>
                      </div>

                      <div>
                        ${FormComponents.input({
        id: "username",
        type: "text",
        label: "Username",
        value: fullUserData?.username || user?.username || "",
        disabled: true,
        readonly: true,
      })}
                        <p class="mt-1 text-xs text-gray-500">
                          <i class="fas fa-info-circle text-gray-400"></i>
                          Username cannot be changed
                        </p>
                      </div>
                    </div>

                    <div class="grid grid-cols-4 gap-4">
                      <div class="col-span-1">
                        ${FormComponents.select({
        id: "title",
        label: "Title",
        value: fullUserData?.title || "",
        options: [
          { value: "", label: "--" },
          { value: "Mr.", label: "Mr." },
          { value: "Mrs.", label: "Mrs." },
          { value: "Ms.", label: "Ms." },
          { value: "Miss", label: "Miss" },
          { value: "Dr.", label: "Dr." },
          { value: "Prof.", label: "Prof." },
        ],
      })}
                      </div>
                      <div class="col-span-3">
                        ${FormComponents.input({
        id: "name",
        type: "text",
        label: "Full Name",
        value: fullUserData?.name || user?.name || "",
        placeholder: "Enter your full name",
        required: true,
      })}
                      </div>
                    </div>

                    <div>
                      ${FormComponents.input({
        id: "email",
        type: "email",
        label: "Email Address",
        value: fullUserData?.email || user?.email || "",
        placeholder: "your.email@example.com",
        required: true,
      })}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        ${FormComponents.select({
        id: "gender",
        label: "Gender",
        value: this.parseGenderValue(fullUserData?.gender),
        options: [
          { value: "", label: "Select gender" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          {
            value: "prefer_not_to_say",
            label: "Prefer not to say",
          },
        ],
        required: true,
      })}
                      </div>
                      <div>
                        ${FormComponents.input({
        id: "birthday",
        type: "date",
        label: "Birthday",
        value: this.parseBirthdayValue(fullUserData?.birthday),
        required: true,
      })}
                      </div>
                    </div>

                    <div>
                      ${FormComponents.input({
        id: "phone",
        type: "tel",
        label: "Phone Number (Hong Kong)",
        value: fullUserData?.phone
          ? phoneUtils.formatHKPhone(fullUserData.phone)
          : "",
        placeholder: "e.g., 9123 4567",
      })}
                      <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-phone text-gray-400"></i>
                        8 digits, starts with 2-9 (optional)
                      </p>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow-md border border-gray-200 mt-6">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-bold text-gray-900 flex items-center">
                      <i class="fas fa-key text-indigo-600 mr-2"></i>
                      Change Password
                    </h2>
                  </div>
                  <div class="p-6 space-y-4">
                    ${FormComponents.infoBox({
        title: "Password Security",
        message:
          "Leave the fields blank if you don't want to change your password",
        type: "info",
      })}

                    <div>
                      ${FormComponents.input({
        id: "currentPassword",
        type: "password",
        label: "Current Password",
        placeholder: "Enter your current password",
      })}
                    </div>

                    <div>
                      ${FormComponents.input({
        id: "newPassword",
        type: "password",
        label: "New Password",
        placeholder: "Enter new password",
      })}
                      <p class="mt-2 text-xs text-gray-500">
                        <i class="fas fa-shield-alt text-indigo-500"></i>
                        At least 8 characters with uppercase, lowercase, and numbers
                      </p>
                    </div>

                    <div>
                      ${FormComponents.input({
        id: "confirmPassword",
        type: "password",
        label: "Confirm New Password",
        placeholder: "Re-enter new password",
      })}
                    </div>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 mt-6">
                  ${FormComponents.button({
        type: "submit",
        text: "Save Changes",
        icon: "fa-save",
        color: "indigo",
        size: "lg",
        className: "flex-1",
      })}
                  ${FormComponents.button({
        id: "cancelBtn",
        type: "button",
        text: "Cancel",
        icon: "fa-times",
        color: "gray",
        size: "lg",
      })}
                </div>
              </form>

              <div class="bg-white rounded-lg shadow-md border-2 border-red-200 mt-6">
                <div class="px-6 py-4 bg-red-50 border-b border-red-200">
                  <h2 class="text-lg font-bold text-red-900 flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                    Danger Zone
                  </h2>
                </div>
                <div class="p-6">
                  ${FormComponents.infoBox({
        title: "Delete Account",
        message:
          "Once you delete your account, there is no going back. Please be certain.",
        type: "error",
      })}

                  <div class="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p class="text-sm font-medium text-gray-900">Permanently delete this account</p>
                      <p class="text-xs text-gray-500 mt-1">This action cannot be undone</p>
                    </div>
                    <button
                      id="deleteAccountBtn"
                      type="button"
                      class="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
                    >
                      <i class="fas fa-trash-alt text-white"></i>
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    <i class="fas fa-shield-check text-green-500 mr-1"></i>
                    Your data is encrypted and secure
                  </span>
                  <span>
                    Last updated: ${dayjs().format("MMM D, YYYY")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.setupEventListeners();
    this.setupAvatarUpload();
  },

  setupAvatarUpload() {
    const user = getCurrentUser();
    Avatar.initializeUpload(document.body, {
      onUpload: async (file, dataUrl) => {
        try {
          notify.info("Uploading profile picture...");
          await this.uploadProfileImage(file);
          notify.success("Profile picture updated successfully!");
        } catch (error) {
          console.error("Error uploading profile picture:", error);
          const errorMessage = error.message || "Failed to update profile picture";
          notify.error(errorMessage);
        }
      },
      onRemove: async () => {
        try {
          await this.removeProfileImage();
          notify.success("Profile picture removed");
        } catch (error) {
          console.error("Error removing profile picture:", error);
          notify.error("Failed to remove profile picture");
        }
      },
    });
  },

  async uploadProfileImage(file) {
    const user = getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit. Please choose a smaller image.");
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
    }

    const formData = new FormData();
    formData.append("image", file);

    let response;
    try {
      response = await fetch("/api/users/upload-profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error. Please check your connection and try again.");
      }
      throw new Error("Failed to connect to server. Please try again later.");
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Invalid response from server. Please try again.");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (response.status === 400) {
        throw new Error(data.message || "Invalid image file. Please try a different image.");
      }
      if (response.status === 413) {
        throw new Error("File size too large. Please choose a smaller image.");
      }
      throw new Error(data.message || "Failed to upload image. Please try again.");
    }

    if (!data.success || !data.data || !data.data.imageUrl) {
      throw new Error("Invalid response from server. Please try again.");
    }

    const imageUrl = data.data.imageUrl;

    try {
      await userAPI.update(user.id, {
        profileImage: imageUrl,
      });
    } catch (error) {
      throw new Error("Failed to update profile. Please try again.");
    }

    const updatedUser = { ...user, profileImage: imageUrl };
    const { storage } = await import("@services/storageService.js");
    storage.setUser(updatedUser);

    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));

    const { refreshNavbar } = await import("@components/layout/Navbar.js");
    await refreshNavbar();
  },

  async removeProfileImage() {
    const user = getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    await userAPI.update(user.id, {
      profileImage: null,
    });

    const updatedUser = { ...user, profileImage: null };
    const { storage } = await import("@services/storageService.js");
    storage.setUser(updatedUser);

    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));

    const { refreshNavbar } = await import("@components/layout/Navbar.js");
    await refreshNavbar();
  },

  setupEventListeners() {
    $("#phone").on("input", function () {
      const value = $(this).val();
      const cleaned = phoneUtils.cleanPhone(value);
      const formatted = phoneUtils.formatHKPhone(cleaned);
      $(this).val(formatted);
    });

    $("#profileForm").on("submit", (e) => this.handleUpdate(e));
    $("#cancelBtn").on("click", () => window.location.reload());
    $("#deleteAccountBtn").on("click", () => this.handleDeleteAccount());
  },

  async handleDeleteAccount() {
    const user = getCurrentUser();

    const result = await Swal.fire({
      title: "Delete Account",
      html: `
        <div class="text-left space-y-4">
          <p class="text-gray-700">Are you sure you want to delete your account?</p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800 font-semibold mb-2">
              <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
              This action will:
            </p>
            <ul class="text-sm text-red-700 space-y-1 ml-6 list-disc">
              <li>Permanently delete your account</li>
              <li>Remove all your personal data</li>
              <li>Cancel all your bookings</li>
              <li>Remove access to the platform</li>
            </ul>
          </div>
          <p class="text-sm text-gray-600">
            <strong>Note:</strong> This action cannot be undone.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete My Account",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.dangerDark,
      cancelButtonColor: SwalColors.cancel,
    });

    if (result.isConfirmed) {
      const confirmPassword = await Swal.fire({
        title: "Confirm Password",
        text: "Please enter your password to confirm account deletion",
        input: "password",
        inputPlaceholder: "Enter your password",
        showCancelButton: true,
        confirmButtonText: "Confirm Deletion",
        cancelButtonText: "Cancel",
        confirmButtonColor: SwalColors.dangerDark,
        cancelButtonColor: SwalColors.cancel,
        inputValidator: (value) => {
          if (!value) {
            return "Password is required";
          }
        },
      });

      if (confirmPassword.isConfirmed && confirmPassword.value) {
        try {
          await userAPI.deleteSelf(confirmPassword.value);

          await logout();

          Swal.fire({
            title: "Account Deleted",
            text: "Your account has been permanently deleted. We're sorry to see you go!",
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
          });

          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        } catch (error) {
          handleApiError(error, "Failed to delete account");
        }
      }
    }
  },

  async handleUpdate(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const title = $("#title").val();
    const name = $("#name").val().trim();
    const email = $("#email").val().trim();
    const gender = $("#gender").val();
    const birthday = $("#birthday").val();
    const phone = phoneUtils.cleanPhone($("#phone").val());
    const currentPassword = $("#currentPassword").val();
    const newPassword = $("#newPassword").val();
    const confirmPassword = $("#confirmPassword").val();

    if (!name || !email || !gender || !birthday) {
      notify.warning("Please fill in all required fields");
      return;
    }

    if (!userService.validateEmail(email)) {
      notify.error("Invalid email address");
      return;
    }

    if (!userService.validateAge(birthday)) {
      notify.error("You must be at least 13 years old");
      return;
    }

    if (!userService.validatePhone(phone)) {
      notify.error(
        "Invalid Hong Kong phone number. Must be 8 digits starting with 2-9"
      );
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        notify.error("Please enter your current password to change it");
        return;
      }
      if (newPassword.length < 8) {
        notify.error("Password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        notify.error("New passwords do not match");
        return;
      }
    }

    const updates = {
      title,
      name,
      email,
      gender,
      birthday,
      phone,
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    try {
      const result = await userService.updateUserProfile(user.id, updates);
      if (result.success) {
        notify.success("Profile updated successfully!");
        setTimeout(() => window.location.reload(), 800);
      } else {
        notify.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      handleApiError(error, "Failed to update profile");
    }
  },
};
