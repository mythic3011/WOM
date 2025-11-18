export { SEO } from "./seo.js";
export { initializeApp } from "./initApp.js";
export {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  truncateText,
  capitalize,
  slugify,
  debounce,
  throttle,
  once,
  memoize,
} from "./utils.js";
export {
  getStatusBadge,
  getStatusColor,
  getStatusIcon,
  getStatusText,
} from "./status.js";
export {
  performanceMonitor,
  measurePerformance,
  logPerformance,
} from "./performance.js";

export { apiCall, get, post, put, del } from "./core/api.js";
export {
  checkAuth,
  isAuthenticated,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "./core/auth.js";
export { encrypt, decrypt, hash, generateToken } from "./core/crypto.js";
export {
  navigate,
  initSPALinks,
  getCurrentPath,
  goBack,
  redirect,
} from "./core/navigation.js";
export { fileHandler } from "./core/fileHandler.js";

export {
  animate,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
} from "./ui/animations.js";
export {
  showContextMenu,
  hideContextMenu,
  createContextMenu,
} from "./ui/contextMenu.js";
export {
  showModal,
  hideModal,
  confirmDialog,
  alertDialog,
} from "./ui/modal.js";
export { notify } from "./ui/notification.js";
export { initDragDrop, makeDraggable, makeDroppable } from "./ui/dragDrop.js";
export {
  bindKeyboardShortcuts,
  unbindKeyboardShortcuts,
  registerShortcut,
} from "./ui/keyboard.js";
export {
  initTouchGestures,
  onSwipe,
  onPinch,
  onTap,
} from "./ui/touchGestures.js";
export { scrollbarUtils, initializeScrollbars } from "./ui/scrollbar.js";

export { phoneUtils } from "./forms/phoneFormat.js";

export {
  calculateSeatPrice,
  calculateTotalPrice,
  applyDiscount,
} from "./booking/pricing.js";
export {
  generateSeatMap,
  getSeatMapHTML,
  updateSeatAvailability,
} from "./booking/seatMapGenerator.js";
export {
  createHeatMap,
  updateHeatMap,
  getSeatHeatData,
} from "./booking/heatMap.js";
export { ZonePricing } from "./booking/zonePricing.js";

export {
  generateTicket,
  downloadTicket,
  downloadTickets,
} from "./reports/ticketGenerator.js";
export {
  generateInvoice,
  downloadInvoice,
} from "./reports/invoiceGenerator.js";
export {
  generateReport,
  exportReport,
  generateBookingReport,
  generateRevenueReport,
} from "./reports/reporting.js";

export * as api from "./api/index.js";
export * as data from "./data/index.js";
export * as forms from "./forms/index.js";
export * as table from "./table/index.js";

export { calculationService } from "./calculations.js";
