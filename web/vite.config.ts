import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Absolute base — required for client-side routing (BrowserRouter), so a
// hard refresh at /data resolves /assets/* correctly. Trade-off: dist/
// only works at the apex of a domain (depopulatefairplan.com) — no longer
// works under github.io/<repo>/ subpaths or file://. We deploy to a
// custom apex domain, so this is fine.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
