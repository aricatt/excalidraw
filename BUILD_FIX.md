# 🔧 构建问题修复说明

## 已修复的问题

### 1. JavaScript heap out of memory ✅

**问题：** 前端构建时 Node.js 内存不足

**解决方案：** 在 `excalidraw-plus/Dockerfile` 中增加内存限制

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

这将 Node.js 最大内存从默认的 ~512MB 增加到 4GB。

### 2. Alpine 包下载失败 ✅

**问题：** 访问 `dl-cdn.alpinelinux.org` 超时或中断

**解决方案：** 在所有 Dockerfile 中配置阿里云镜像源

```dockerfile
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
```

---

## 修改的文件

✅ `excalidraw-plus/Dockerfile` - 前端
✅ `servers/api-service/Dockerfile` - 后端
✅ `servers/aliyunasr/Dockerfile` - 语音服务

---

## 重新部署步骤

```bash
# 1. 清理之前失败的构建
podman system prune -a -f

# 2. 重新部署
./podman-plus.sh
```

---

## 预期结果

现在构建应该：
- ✅ 使用阿里云 Alpine 镜像源（更快、更稳定）
- ✅ 前端构建有足够内存（4GB）
- ✅ 不会出现内存溢出错误
- ✅ 不会出现网络超时错误

---

## 构建时间估算

- 前端构建：5-10 分钟
- 后端构建：2-3 分钟
- 语音服务构建：1-2 分钟
- **总计：约 10-15 分钟**

---

## 监控构建进度

```bash
# 查看实时日志
podman-compose logs -f

# 查看资源使用
podman stats

# 查看容器状态
podman ps -a
```

---

## 如果还有问题

### 问题 1: 仍然内存不足

如果服务器内存小于 4GB，可能需要调整：

```dockerfile
# 减少内存限制
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

或者增加服务器 swap：

```bash
# 创建 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 问题 2: 网络仍然不稳定

尝试其他镜像源：

```dockerfile
# 使用清华大学镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 或使用中科大镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
```

---

## 验证修复

构建成功后应该看到：

```
✅ 数据库迁移成功！

🎉 部署完成！

📱 访问地址 (HTTPS):
   - 🏠 前端: https://localhost
   - 🔌 后端 API: https://localhost/api
   - 🎤 语音服务: https://localhost/voice
```

---

**现在可以重新运行部署脚本了！** 🚀
