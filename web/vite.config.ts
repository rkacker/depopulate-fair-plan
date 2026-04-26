import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Relative base — same dist/ serves correctly at any URL prefix:
// custom domain apex (depopulatefairplan.com), github.io subpath
// (<user>.github.io/<repo>/), even file://. Keep all asset/data
// references in code as relative paths (no leading slash).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
