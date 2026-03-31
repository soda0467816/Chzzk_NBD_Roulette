import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "src/pages",
  publicDir: false,
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        streamer: resolve(__dirname, "src/pages/streamer.html"),
        overlay: resolve(__dirname, "src/pages/overlay.html"),
      },
    },
  },
});
