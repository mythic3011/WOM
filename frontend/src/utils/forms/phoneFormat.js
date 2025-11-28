export const phoneUtils = {
  formatHKPhone(phone) {
    if (!phone) {return "";}

    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length <= 4) {
      return cleaned;
    }

    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}`;
  },

  cleanPhone(phone) {
    if (!phone) {return "";}
    return phone.replace(/\D/g, "");
  },

  validateHKPhone(phone) {
    if (!phone) {return false;}
    const cleaned = this.cleanPhone(phone);
    return /^[2-9][0-9]{7}$/.test(cleaned);
  },

  autoFormatInput(event) {
    const input = event.target;
    const cleaned = this.cleanPhone(input.value);
    const formatted = this.formatHKPhone(cleaned);
    input.value = formatted;

    if (this.validateHKPhone(cleaned)) {
      input.classList.remove("border-red-500");
      input.classList.add("border-green-500");
    } else if (cleaned.length > 0) {
      input.classList.remove("border-green-500");
      input.classList.add("border-red-500");
    } else {
      input.classList.remove("border-red-500", "border-green-500");
    }

    return cleaned;
  },
};
