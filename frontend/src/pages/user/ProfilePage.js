import { storage } from "/src/services/storageService.js";
import { notify } from "/src/utils/ui/notification.js";
import { verifyPassword } from "/src/utils/core/crypto.js";
import { formValidator } from "/src/utils/forms/formValidator.js";
import { userService } from "/src/services/userService.js";
import { phoneUtils } from "/src/utils/forms/phoneFormat.js";
import {
  createImageUpload,
  initImageUpload,
  getImageDataURL,
} from "/src/components/ImageUpload.js";
import { FormComponents } from "/src/components/FormComponents.js";
import Swal from "sweetalert2";
import dayjs from "dayjs";

export default {
  title: "Profile | User",

  async render() {
    const user = storage.getUser();
    const registeredUsers = storage.getItem("registeredUsers", []);
    const fullUserData = registeredUsers.find((u) => u.id === user.id);

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
                  <div id="profileImageUpload"></div>
                  <h3 class="mt-4 text-lg font-bold text-gray-900">${
                    user?.name || "User"
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
                      <span class="font-mono font-semibold">#${
                        fullUserData?.userId || user?.userId || ""
                      }</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">Username:</span>
                      <span class="font-mono font-medium">${
                        fullUserData?.username || user?.username || ""
                      }</span>
                    </div>
                    ${
                      fullUserData?.gender
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
                    ${
                      fullUserData?.birthday
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
                    ${
                      fullUserData?.createdAt
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
                      ${
                        user?.role === "admin"
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
                          value: `#${
                            fullUserData?.userId || user?.userId || ""
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
                          value: fullUserData?.gender || "",
                          options: [
                            { value: "", label: "Select gender" },
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" },
                            { value: "other", label: "Other" },
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
                          value: fullUserData?.birthday
                            ? dayjs(fullUserData.birthday).format("YYYY-MM-DD")
                            : "",
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
    const user = storage.getUser();

    $("#profileImageUpload").html(
      createImageUpload({
        id: "profileImage",
        label: "Change Profile Image",
        preview: true,
        previewSize: "24",
        defaultImage: user?.profileImage,
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

    $("#profileForm").on("submit", (e) => this.handleUpdate(e));
    $("#cancelBtn").on("click", () => window.location.reload());
    $("#deleteAccountBtn").on("click", () => this.handleDeleteAccount());
  },

  async handleDeleteAccount() {
    const user = storage.getUser();

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
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
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
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        inputValidator: (value) => {
          if (!value) {
            return "Password is required";
          }
        },
      });

      if (confirmPassword.isConfirmed && confirmPassword.value) {
        const registeredUsers = storage.getItem("registeredUsers", []);
        const userData = registeredUsers.find((u) => u.id === user.id);

        if (!userData) {
          notify.error("User not found");
          return;
        }

        const isPasswordValid = await verifyPassword(
          confirmPassword.value,
          userData.password
        );

        if (!isPasswordValid) {
          notify.error("Incorrect password. Account deletion cancelled.");
          return;
        }

        const updatedUsers = registeredUsers.filter((u) => u.id !== user.id);
        storage.setItem("registeredUsers", updatedUsers);

        const bookings = storage.getItem("bookings", []);
        const updatedBookings = bookings.filter((b) => b.userId !== user.id);
        storage.setItem("bookings", updatedBookings);

        storage.clearUser();

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
      }
    }
  },

  async handleUpdate(e) {
    e.preventDefault();

    const user = storage.getUser();
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

    const emailValidation = formValidator.validateEmail(email);
    if (!emailValidation.valid) {
      notify.error(emailValidation.error);
      return;
    }

    if (!userService.validateAge(birthday)) {
      notify.error("You must be at least 13 years old");
      return;
    }

    if (phone && !userService.validatePhone(phone)) {
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

      const registeredUsers = storage.getItem("registeredUsers", []);
      const userData = registeredUsers.find((u) => u.id === user.id);

      if (!userData) {
        notify.error("User not found");
        return;
      }

      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        userData.password
      );
      if (!isCurrentPasswordValid) {
        notify.error("Current password is incorrect");
        return;
      }

      const passwordValidation = formValidator.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        notify.error(passwordValidation.error);
        return;
      }

      if (newPassword !== confirmPassword) {
        notify.error("New passwords do not match");
        return;
      }
    }

    const profileImageData = await getImageDataURL("profileImageInput");

    const updates = {
      title,
      name,
      email,
      gender,
      birthday,
      phone,
      profileImage: profileImageData || user.profileImage,
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    const result = await userService.updateUserProfile(user.id, updates);

    if (result.success) {
      notify.success("Profile updated successfully!");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      notify.error(result.error || "Profile update failed. Please try again.");
    }
  },
};
