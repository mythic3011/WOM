import { VenueController } from "@/pages/admin/venues/VenueController.js";
import { VenueView } from "@/pages/admin/venues/VenueView.js";

export default {
  title: "Venue Management | Admin",
  controller: null,
  view: null,

  async render() {
    this.view = new VenueView();
    return this.view.renderPage();
  },

  async afterRender() {
    this.controller = new VenueController();
    await this.controller.init();
  },
};
