import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("scheduler")) return "react-runtime";
          if (id.includes("@tanstack/") || id.includes("@trpc/") || id.includes("superjson")) return "data-client";
          if (id.includes("@radix-ui/") || id.includes("lucide-react") || id.includes("class-variance-authority")) return "ui-system";
          if (id.includes("recharts") || id.includes("/d3-")) return "charts";
          return "vendor";
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
  },
});
