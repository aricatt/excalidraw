import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4417,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@excalidraw/excalidraw": resolve(__dirname, "../packages/excalidraw/index.tsx"),
      "@excalidraw/common": resolve(__dirname, "../packages/common/src"),
      "@excalidraw/element": resolve(__dirname, "../packages/element/src"),
      "@excalidraw/math": resolve(__dirname, "../packages/math/src"),
      "@excalidraw/utils": resolve(__dirname, "../packages/utils/src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
  },
  optimizeDeps: {
    exclude: [
      "@excalidraw/excalidraw",
      "@excalidraw/common",
      "@excalidraw/element", 
      "@excalidraw/math",
      "@excalidraw/utils",
    ],
  },
});
