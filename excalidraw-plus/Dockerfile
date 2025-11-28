# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# 1. 复制根目录依赖配置
COPY package.json yarn.lock ./

# 2. 复制 packages 目录 (因为 excalidraw-plus 依赖它)
COPY packages ./packages

# 3. 复制 excalidraw-plus
COPY excalidraw-plus ./excalidraw-plus

# 4. 安装依赖
RUN yarn install --frozen-lockfile

# 5. 构建 excalidraw-plus
WORKDIR /app/excalidraw-plus
# 注入环境变量 (构建时需要)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN yarn build

# Production Stage
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/excalidraw-plus/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY excalidraw-plus/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
