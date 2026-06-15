import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    chunkSizeWarningLimit: 2000,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
