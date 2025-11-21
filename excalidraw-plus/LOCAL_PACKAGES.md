# 使用本地 Excalidraw 包的说明

## 📋 概述

`excalidraw-plus` 现在已配置为使用本地的 Excalidraw 包,这样你可以测试你对 Excalidraw 所做的修改。

## 🔧 配置更改

### 1. package.json 更新
```json
"@excalidraw/excalidraw": "*"  // 使用本地 workspace 包
```

### 2. 依赖关系
- `@excalidraw/common`: 本地包
- `@excalidraw/element`: 本地包  
- `@excalidraw/excalidraw`: 本地包
- `@excalidraw/math`: 本地包
- `@excalidraw/utils`: 本地包

## 🚀 启动方式

### 方式 1: 使用启动脚本 (推荐)
```bash
cd excalidraw-plus
./start-local.sh
```

### 方式 2: 手动启动
```bash
# 1. 确保本地包已构建
cd /Users/mac/Gits/_ari_\ excalidraw
yarn build:packages

# 2. 启动 excalidraw-plus
cd excalidraw-plus
npx vite --port 4417
```

## ⚠️ 已知问题

### Utils 包构建失败
`@excalidraw/utils` 包在构建时可能会遇到类型错误。这是因为它依赖 `@excalidraw/excalidraw` 的类型定义。

**解决方案:**
1. 先构建其他包: `yarn build:packages`
2. 如果 utils 构建失败,可以跳过它,因为 excalidraw-plus 主要使用 `@excalidraw/excalidraw`

### Vite 导入错误
如果看到类似 `Failed to resolve import "@excalidraw/excalidraw/appState"` 的错误:

**原因:** 某些包(如 utils)尝试导入 excalidraw 的内部模块,但这些模块可能不在导出列表中。

**解决方案:**
1. 确保所有核心包已构建: `yarn build:common && yarn build:math && yarn build:element && yarn build:excalidraw`
2. 重启 Vite 开发服务器

## 📝 开发工作流

### 修改 Excalidraw 核心代码后
```bash
# 1. 重新构建 excalidraw 包
cd /Users/mac/Gits/_ari_\ excalidraw
yarn build:excalidraw

# 2. Vite 会自动检测变化并重新加载
# 如果没有自动重新加载,手动刷新浏览器
```

### 完整重新构建
```bash
cd /Users/mac/Gits/_ari_\ excalidraw
yarn build:packages
```

## 🎯 当前状态

✅ **已完成:**
- package.json 配置为使用本地包
- yarn install 已链接本地包
- 核心包 (common, math, element, excalidraw) 已构建

⚠️ **待解决:**
- utils 包构建有类型错误(可选,不影响主要功能)

## 🔄 回退到 NPM 包

如果需要回退到使用 NPM 发布的包:

```bash
cd excalidraw-plus

# 修改 package.json
# "@excalidraw/excalidraw": "*" 改为 "@excalidraw/excalidraw": "^0.18.0"

# 重新安装
yarn install

# 启动
npx vite --port 4417
```

## 📚 相关文档

- [Excalidraw 开发文档](../packages/excalidraw/README.md)
- [Monorepo 结构](../README.md)
- [API 服务器文档](../servers/api-service/README.md)

---

**最后更新:** 2025-11-21
