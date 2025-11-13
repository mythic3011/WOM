import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    historyApiFallback: true,
    allowedHosts: ["frontend.eie4432-project.orb.local", "localhost"],
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
      },
      output: {
        manualChunks: {
          vendor: ["dayjs", "notyf", "sweetalert2", "page", "jquery", "lodash"],
          pdf: ["pdfmake", "jspdf"],
          faker: ["@faker-js/faker"],
          crypto: ["crypto-js", "lz-string", "bcryptjs"],
          utils: [
            "animejs",
            "hammerjs",
            "hotkeys-js",
            "jsbarcode",
            "qrcode",
            "sortablejs",
            "papaparse",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
});
