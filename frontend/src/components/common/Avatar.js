import $ from "jquery";

export const Avatar = {
    isBase64(value) {
        if (!value || typeof value !== "string") {
            return false;
        }
        return value.startsWith("data:image/");
    },

    isUrl(value) {
        if (!value || typeof value !== "string") {
            return false;
        }
        const trimmed = value.trim();
        return trimmed !== "" && !this.isBase64(value);
    },

    render(options = {}) {
        const {
            src = null,
            name = "",
            size = "md",
            editable = false,
            userId = null,
            showUpload = false,
            rounded = "full",
            className = "",
        } = options;

        const sizeClasses = {
            xs: "w-8 h-8 text-xs",
            sm: "w-12 h-12 text-sm",
            md: "w-16 h-16 text-base",
            lg: "w-24 h-24 text-lg",
            xl: "w-32 h-32 text-xl",
            "2xl": "w-40 h-40 text-2xl",
        };

        const roundedClasses = {
            full: "rounded-full",
            lg: "rounded-lg",
            md: "rounded-md",
            none: "rounded-none",
        };

        const sizeClass = sizeClasses[size] || sizeClasses.md;
        const roundedClass = roundedClasses[rounded] || roundedClasses.full;
        const initials = this.getInitials(name);
        const bgColor = this.getColorFromName(name);

        const avatarId = userId ? `avatar-${userId}` : "avatar";
        const uploadId = `${avatarId}-upload`;

        const isBase64Src = this.isBase64(src);
        const isUrlSrc = this.isUrl(src);
        const hasValidSrc = isBase64Src || isUrlSrc;

        if (isBase64Src) {
            console.warn("[Avatar] Base64 profile images are deprecated. Please update your profile to use URL-based images.");
        }

        return `
      <div class="avatar-container relative inline-block ${className}">
        <div class="${sizeClass} ${roundedClass} overflow-hidden ${bgColor} flex items-center justify-center shadow-md border-2 border-white relative group">
          ${hasValidSrc
                ? `<img 
                  id="${avatarId}-img"
                  src="${src}" 
                  alt="${name}" 
                  class="w-full h-full object-cover"
                  onerror="this.style.display='none'; const initialsDiv = this.parentElement.querySelector('#${avatarId}-initials'); if (initialsDiv) { initialsDiv.style.display='flex'; initialsDiv.classList.remove('hidden'); }"
                />`
                : ""
            }
          <div 
            id="${avatarId}-initials"
            class="w-full h-full flex items-center justify-center font-bold text-white ${hasValidSrc ? "hidden" : ""}"
            style="display: ${hasValidSrc ? "none" : "flex"};"
          >
            ${initials || "<i class=\"fas fa-user\"></i>"}
          </div>
          
          ${editable || showUpload
                ? `
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
              <label for="${uploadId}" class="cursor-pointer text-white">
                <i class="fas fa-camera text-xl"></i>
              </label>
            </div>
          `
                : ""
            }
        </div>
        
        ${editable || showUpload
                ? `
          <input 
            type="file" 
            id="${uploadId}"
            class="hidden avatar-upload-input"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            data-avatar-id="${avatarId}"
          />
          ${src
                    ? `
            <button 
              type="button"
              class="avatar-remove-btn absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
              data-avatar-id="${avatarId}"
              title="Remove avatar"
            >
              <i class="fas fa-times text-xs"></i>
            </button>
          `
                    : ""
                }
        `
                : ""
            }
      </div>
    `;
    },

    getInitials(name) {
        if (!name) {return "";}

        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    getColorFromName(name) {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-red-500",
            "bg-yellow-500",
            "bg-teal-500",
            "bg-orange-500",
            "bg-cyan-500",
        ];

        if (!name) {return colors[0];}

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    },

    initializeUpload(containerId, options = {}) {
        const { onUpload, onRemove, maxSize = 5 * 1024 * 1024 } = options;

        const $container = $(containerId);
        if (!$container.length) {return;}

        $container.find(".avatar-upload-input").on("change", async (e) => {
            const file = e.target.files[0];
            if (!file) {return;}

            if (file.size > maxSize) {
                alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
                $(e.target).val("");
                return;
            }

            if (!file.type.startsWith("image/")) {
                alert("Please select an image file");
                $(e.target).val("");
                return;
            }

            try {
                const dataUrl = await this.readFileAsDataURL(file);
                const avatarId = $(e.target).data("avatar-id");

                const $img = $(`#${avatarId}-img`);
                const $initials = $(`#${avatarId}-initials`);

                if ($img.length) {
                    $img.attr("src", dataUrl).show();
                    $initials.hide();
                } else {
                    const $avatarContainer = $(e.target)
                        .closest(".avatar-container")
                        .find("div > div")
                        .first();

                    if ($avatarContainer.length) {
                        const $newImg = $("<img>", {
                            id: `${avatarId}-img`,
                            src: dataUrl,
                            alt: "Avatar",
                            class: "w-full h-full object-cover"
                        });
                        $avatarContainer.prepend($newImg);
                        $initials.hide();
                    }
                }

                if (onUpload) {
                    await onUpload(file, dataUrl);
                }
            } catch (error) {
                console.error("Error uploading avatar:", error);
                alert("Failed to upload image");
            }

            $(e.target).val("");
        });

        $container.find(".avatar-remove-btn").on("click", async (e) => {
            e.stopPropagation();
            const avatarId = $(e.currentTarget).data("avatar-id");

            const $img = $(`#${avatarId}-img`);
            const $initials = $(`#${avatarId}-initials`);

            if ($img.length) {
                $img.attr("src", "").hide();
            }
            if ($initials.length) {
                $initials.show();
            }

            if (onRemove) {
                await onRemove();
            }
        });
    },

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    updateAvatar(avatarId, src) {
        const $img = $(`#${avatarId}-img`);
        const $initials = $(`#${avatarId}-initials`);

        if (src) {
            if ($img.length) {
                $img.attr("src", src).show();
            }
            if ($initials.length) {
                $initials.hide();
            }
        } else {
            if ($img.length) {
                $img.hide();
            }
            if ($initials.length) {
                $initials.show();
            }
        }
    },
};
