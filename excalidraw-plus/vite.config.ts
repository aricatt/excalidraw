import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4417,
    host: "0.0.0.0",
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "src"),
      },
      // Excalidraw common package
      {
        find: /^@excalidraw\/common$/,
        replacement: path.resolve(__dirname, "../packages/common/src/index.ts"),
      },
      {
        find: /^@excalidraw\/common\/(.*)/,
        replacement: path.resolve(__dirname, "../packages/common/src/$1"),
      },
      // Excalidraw element package
      {
        find: /^@excalidraw\/element$/,
        replacement: path.resolve(__dirname, "../packages/element/src/index.ts"),
      },
      {
        find: /^@excalidraw\/element\/(.*)/,
        replacement: path.resolve(__dirname, "../packages/element/src/$1"),
      },
      // Excalidraw main package
      {
        find: /^@excalidraw\/excalidraw$/,
        replacement: path.resolve(__dirname, "../packages/excalidraw/index.tsx"),
      },
      {
        find: /^@excalidraw\/excalidraw\/(.*)/,
        replacement: path.resolve(__dirname, "../packages/excalidraw/$1"),
      },
      // Excalidraw math package
      {
        find: /^@excalidraw\/math$/,
        replacement: path.resolve(__dirname, "../packages/math/src/index.ts"),
      },
      {
        find: /^@excalidraw\/math\/(.*)/,
        replacement: path.resolve(__dirname, "../packages/math/src/$1"),
      },
      // Excalidraw utils package
      {
        find: /^@excalidraw\/utils$/,
        replacement: path.resolve(__dirname, "../packages/utils/src/index.ts"),
      },
      {
        find: /^@excalidraw\/utils\/(.*)/,
        replacement: path.resolve(__dirname, "../packages/utils/src/$1"),
      },
    ],
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
