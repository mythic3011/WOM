import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@store": path.resolve(__dirname, "./src/store"),
    },
  },
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
      "/assets": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: "./index.html",
      },
      output: {
        manualChunks: {
          vendor: ["dayjs", "notyf", "sweetalert2", "page", "jquery", "lodash"],
          pdf: ["pdfmake", "jspdf"],
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
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
  },
});
