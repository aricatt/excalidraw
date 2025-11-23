import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    // 自定义插件:处理 Excalidraw 字体文件
    {
      name: 'excalidraw-fonts',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // 拦截字体文件请求
          if (req.url?.includes('/fonts/') && req.url?.match(/\.(woff2?|ttf)$/)) {
            // 移除查询参数
            const cleanUrl = req.url.split('?')[0];
            // 重写为正确的本地路径
            req.url = cleanUrl.replace(
              /.*\/fonts\//,
              '/@fs' + path.resolve(__dirname, '../packages/excalidraw/fonts') + '/'
            );
          }
          next();
        });
      },
    },
  ],
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
  // 包含字体文件作为资源
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 保持字体文件的原始目录结构
          if (assetInfo.name?.match(/\.(woff2?|ttf|eot)$/)) {
            return 'fonts/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
