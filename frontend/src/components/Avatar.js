export const Avatar = {
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

    return `
      <div class="avatar-container relative inline-block ${className}">
        <div class="${sizeClass} ${roundedClass} overflow-hidden bg-gradient-to-br ${bgColor} flex items-center justify-center shadow-md border-2 border-white relative group">
          ${
            src
              ? `<img 
                  id="${avatarId}-img"
                  src="${src}" 
                  alt="${name}" 
                  class="w-full h-full object-cover"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />`
              : ""
          }
          <div 
            id="${avatarId}-initials"
            class="w-full h-full flex items-center justify-center font-bold text-white ${src ? "hidden" : ""}"
            style="display: ${src ? "none" : "flex"};"
          >
            ${initials || '<i class="fas fa-user"></i>'}
          </div>
          
          ${
            editable || showUpload
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
        
        ${
          editable || showUpload
            ? `
          <input 
            type="file" 
            id="${uploadId}"
            class="hidden avatar-upload-input"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            data-avatar-id="${avatarId}"
          />
          ${
            src
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
    if (!name) return "";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  getColorFromName(name) {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
      "from-red-400 to-red-600",
      "from-yellow-400 to-yellow-600",
      "from-teal-400 to-teal-600",
      "from-orange-400 to-orange-600",
      "from-cyan-400 to-cyan-600",
    ];

    if (!name) return colors[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  },

  initializeUpload(containerId, options = {}) {
    const { onUpload, onRemove, maxSize = 5 * 1024 * 1024 } = options;

    const container =
      typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;
    if (!container) return;

    const uploadInputs = container.querySelectorAll(".avatar-upload-input");
    uploadInputs.forEach((input) => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > maxSize) {
          alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
          e.target.value = "";
          return;
        }

        if (!file.type.startsWith("image/")) {
          alert("Please select an image file");
          e.target.value = "";
          return;
        }

        try {
          const dataUrl = await this.readFileAsDataURL(file);
          const avatarId = input.dataset.avatarId;

          const img = document.getElementById(`${avatarId}-img`);
          const initials = document.getElementById(`${avatarId}-initials`);

          if (img) {
            img.src = dataUrl;
            img.style.display = "block";
            if (initials) initials.style.display = "none";
          } else {
            const avatarContainer = input
              .closest(".avatar-container")
              .querySelector("div > div");
            if (avatarContainer) {
              const newImg = document.createElement("img");
              newImg.id = `${avatarId}-img`;
              newImg.src = dataUrl;
              newImg.alt = "Avatar";
              newImg.className = "w-full h-full object-cover";
              avatarContainer.insertBefore(newImg, avatarContainer.firstChild);
              if (initials) initials.style.display = "none";
            }
          }

          if (onUpload) {
            await onUpload(file, dataUrl);
          }
        } catch (error) {
          console.error("Error uploading avatar:", error);
          alert("Failed to upload image");
        }

        e.target.value = "";
      });
    });

    const removeButtons = container.querySelectorAll(".avatar-remove-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation();
        const avatarId = button.dataset.avatarId;

        const img = document.getElementById(`${avatarId}-img`);
        const initials = document.getElementById(`${avatarId}-initials`);

        if (img) {
          img.src = "";
          img.style.display = "none";
        }
        if (initials) {
          initials.style.display = "flex";
        }

        if (onRemove) {
          await onRemove();
        }
      });
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
    const img = document.getElementById(`${avatarId}-img`);
    const initials = document.getElementById(`${avatarId}-initials`);

    if (src) {
      if (img) {
        img.src = src;
        img.style.display = "block";
      }
      if (initials) {
        initials.style.display = "none";
      }
    } else {
      if (img) {
        img.style.display = "none";
      }
      if (initials) {
        initials.style.display = "flex";
      }
    }
  },
};
