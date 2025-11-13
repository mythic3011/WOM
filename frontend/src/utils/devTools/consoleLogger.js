import dayjs from "dayjs";
import $ from "jquery";
import { DEV_TOOLS_CONFIG } from "./devToolsConfig.js";

export class ConsoleLogger {
  constructor(containerId) {
    this.containerId = containerId;
    this.config = DEV_TOOLS_CONFIG.console;
  }

  log(message, type = "info") {
    const timestamp = dayjs().format("HH:mm:ss");
    const color = this.config.colors[type] || this.config.colors.info;
    const icon = this.config.icons[type] || this.config.icons.info;

    $(`#${this.containerId}`).append(`
      <div class="${color}">[${timestamp}] ${icon} ${message}</div>
    `);

    this.scrollToBottom();
  }

  clear() {
    $(`#${this.containerId}`).html(
      '<div class="text-gray-500">Console cleared...</div>'
    );
  }

  scrollToBottom() {
    const element = $(`#${this.containerId}`)[0];
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  getAllLogs() {
    return $(`#${this.containerId}`).html();
  }
}
