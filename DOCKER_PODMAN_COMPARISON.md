# 🔄 Docker vs Podman 命令对照表

## 快速切换指南

### 部署脚本对照

| 场景 | Docker | Podman |
|------|--------|--------|
| **本地开发** | `./docker-dev.sh` | `./podman-dev.sh` |
| **生产环境** | `./docker-plus.sh` | `./podman-plus.sh` |

---

## 常用命令对照

### 容器管理

| 功能 | Docker | Podman |
|------|--------|--------|
| 查看运行的容器 | `docker ps` | `podman ps` |
| 查看所有容器 | `docker ps -a` | `podman ps -a` |
| 启动容器 | `docker start <name>` | `podman start <name>` |
| 停止容器 | `docker stop <name>` | `podman stop <name>` |
| 重启容器 | `docker restart <name>` | `podman restart <name>` |
| 删除容器 | `docker rm <name>` | `podman rm <name>` |
| 进入容器 | `docker exec -it <name> sh` | `podman exec -it <name> sh` |
| 查看日志 | `docker logs -f <name>` | `podman logs -f <name>` |
| 查看资源使用 | `docker stats` | `podman stats` |

### 镜像管理

| 功能 | Docker | Podman |
|------|--------|--------|
| 查看镜像 | `docker images` | `podman images` |
| 拉取镜像 | `docker pull <image>` | `podman pull <image>` |
| 构建镜像 | `docker build -t <tag> .` | `podman build -t <tag> .` |
| 删除镜像 | `docker rmi <image>` | `podman rmi <image>` |
| 标记镜像 | `docker tag <src> <dst>` | `podman tag <src> <dst>` |
| 推送镜像 | `docker push <image>` | `podman push <image>` |

### Compose 命令

| 功能 | Docker Compose | Podman Compose |
|------|----------------|----------------|
| 启动服务 | `docker-compose up -d` | `podman-compose up -d` |
| 停止服务 | `docker-compose down` | `podman-compose down` |
| 查看状态 | `docker-compose ps` | `podman-compose ps` |
| 查看日志 | `docker-compose logs -f` | `podman-compose logs -f` |
| 重启服务 | `docker-compose restart` | `podman-compose restart` |
| 构建镜像 | `docker-compose build` | `podman-compose build` |
| 执行命令 | `docker-compose exec <svc> <cmd>` | `podman-compose exec <svc> <cmd>` |

### 开发环境命令

| 功能 | Docker | Podman |
|------|--------|--------|
| 启动开发环境 | `docker-compose -f docker-compose.dev.yml up -d` | `podman-compose -f docker-compose.dev.yml up -d` |
| 查看开发日志 | `docker-compose -f docker-compose.dev.yml logs -f` | `podman-compose -f docker-compose.dev.yml logs -f` |
| 停止开发环境 | `docker-compose -f docker-compose.dev.yml down` | `podman-compose -f docker-compose.dev.yml down` |

### 生产环境命令

| 功能 | Docker | Podman |
|------|--------|--------|
| 启动生产环境 | `docker-compose up -d` | `podman-compose up -d` |
| 查看生产日志 | `docker-compose logs -f` | `podman-compose logs -f` |
| 重启后端 | `docker-compose restart backend` | `podman-compose restart backend` |
| 停止生产环境 | `docker-compose down` | `podman-compose down` |

### 清理命令

| 功能 | Docker | Podman |
|------|--------|--------|
| 清理未使用的容器 | `docker container prune` | `podman container prune` |
| 清理未使用的镜像 | `docker image prune -a` | `podman image prune -a` |
| 清理未使用的卷 | `docker volume prune` | `podman volume prune` |
| 清理所有未使用资源 | `docker system prune -a` | `podman system prune -a` |

---

## 项目特定命令

### 本地开发

| 任务 | Docker | Podman |
|------|--------|--------|
| 启动开发环境 | `./docker-dev.sh` | `./podman-dev.sh` |
| 查看后端日志 | `docker-compose -f docker-compose.dev.yml logs -f backend` | `podman-compose -f docker-compose.dev.yml logs -f backend` |
| 访问 MySQL | `docker-compose -f docker-compose.dev.yml exec mysql mysql -u excalidraw -p` | `podman-compose -f docker-compose.dev.yml exec mysql mysql -u excalidraw -p` |
| 重置数据库 | `docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset` | `podman-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset` |

### 生产环境

| 任务 | Docker | Podman |
|------|--------|--------|
| 启动生产环境 | `./docker-plus.sh` | `./podman-plus.sh` |
| 查看所有日志 | `docker-compose logs -f` | `podman-compose logs -f` |
| 重启后端 | `docker-compose restart backend` | `podman-compose restart backend` |
| 执行迁移 | `docker-compose exec backend npx prisma migrate deploy` | `podman-compose exec backend npx prisma migrate deploy` |

---

## 别名配置（可选）

如果你想无缝切换，可以设置别名：

### 方法 1: 全局别名

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
alias docker=podman
alias docker-compose=podman-compose

# 重新加载配置
source ~/.bashrc
```

### 方法 2: 项目级别

```bash
# 在项目目录创建 .envrc (需要 direnv)
export DOCKER_CMD=podman
export COMPOSE_CMD=podman-compose
```

---

## 快速迁移

### 从 Docker 切换到 Podman

```bash
# 1. 安装 Podman
sudo dnf install podman podman-compose  # CentOS/RHEL/Fedora
sudo apt install podman                  # Ubuntu

# 2. 安装 podman-compose
pip3 install podman-compose

# 3. 使用 Podman 脚本
./podman-dev.sh   # 本地开发
./podman-plus.sh  # 生产环境
```

### 从 Podman 切换到 Docker

```bash
# 1. 安装 Docker
# 参考: https://docs.docker.com/engine/install/

# 2. 使用 Docker 脚本
./docker-dev.sh   # 本地开发
./docker-plus.sh  # 生产环境
```

---

## 性能对比

| 指标 | Docker | Podman |
|------|--------|--------|
| 启动时间 | ~2-3s | ~1-2s ⚡ |
| 内存占用 | 较高 | 较低 ✅ |
| CPU 占用 | 中等 | 较低 ✅ |
| 需要守护进程 | ✅ 是 | ❌ 否 |
| Root 权限 | 需要 | 可选 ✅ |
| 安全性 | 好 | 更好 ✅ |

---

## 兼容性说明

### 完全兼容

✅ Docker 镜像
✅ Dockerfile
✅ docker-compose.yml
✅ 大部分 Docker CLI 命令
✅ 环境变量
✅ 卷挂载
✅ 网络配置

### 部分差异

⚠️ Docker Swarm（Podman 使用 Kubernetes）
⚠️ 某些 Docker 插件
⚠️ Docker Desktop 特定功能

---

## 推荐使用场景

### 使用 Docker

- Windows/macOS 桌面开发
- 需要 Docker Desktop 功能
- 团队已经熟悉 Docker

### 使用 Podman

- Linux 服务器部署 ✅
- 需要 rootless 运行 ✅
- 更高的安全要求 ✅
- CentOS/RHEL/Fedora 环境 ✅

---

## 📚 更多信息

- [PODMAN_GUIDE.md](./PODMAN_GUIDE.md) - 详细 Podman 指南
- [DUAL_ENVIRONMENT_GUIDE.md](./DUAL_ENVIRONMENT_GUIDE.md) - 双环境部署
- [Podman 官方文档](https://docs.podman.io/)

---

**Docker 和 Podman 都是优秀的容器工具，选择适合你的！** 🚀
