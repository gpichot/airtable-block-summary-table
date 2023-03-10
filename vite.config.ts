import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
    },
  },
  test: {
    environment: "jsdom",
    // happy-domsetupFiles: ['setupTests.ts'],
    coverage: {
      all: true,
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"],
    },
  },
  plugins: [react()],
});
