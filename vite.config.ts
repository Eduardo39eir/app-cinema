import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/app-cinema/" : "/",
  build: { outDir: mode === "pages" ? "dist-pages" : "dist" },
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        "**/.android-tools/**",
        "**/.android-signing/**",
        "**/android/**",
        "**/downloads/**",
      ],
    },
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/.android-signing/**",
        "**/.android-tools/**",
      ],
    },
  },
}));
