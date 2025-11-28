FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 yarn.lock
COPY servers/api-service/package.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY servers/api-service/ .

# 生成 Prisma Client
RUN npx prisma generate

# 暴露端口
EXPOSE 6601

# 启动命令
CMD ["npm", "start"]
