# 🐳 Podman 部署指南

本指南说明如何使用 Podman 替代 Docker 部署 Excalidraw Plus。

---

## 🎯 Podman vs Docker

Podman 是 Docker 的无守护进程替代品，具有以下优势：

| 特性 | Docker | Podman |
|------|--------|--------|
| **守护进程** | 需要 dockerd | ❌ 无需守护进程 |
| **Root 权限** | 需要 | ✅ 支持 rootless |
| **安全性** | 较好 | ✅ 更安全 |
| **兼容性** | - | ✅ 兼容 Docker CLI |
| **systemd 集成** | 有限 | ✅ 原生支持 |

---

## 📦 安装 Podman

### CentOS/RHEL/Fedora

```bash
# CentOS 8 / RHEL 8
sudo dnf install -y podman

# CentOS 7 / RHEL 7
sudo yum install -y podman

# Fedora
sudo dnf install -y podman
```

### Ubuntu/Debian

```bash
# Ubuntu 20.10+
sudo apt-get update
sudo apt-get install -y podman

# Ubuntu 20.04 及更早版本
. /etc/os-release
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
curl -L "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/Release.key" | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y podman
```

### macOS

```bash
brew install podman

# 初始化 Podman 虚拟机
podman machine init
podman machine start
```

### 验证安装

```bash
podman --version
# 输出: podman version 4.x.x
```

---

## 🔧 安装 podman-compose

Podman 使用 `podman-compose` 来支持 Docker Compose 文件。

### 使用 pip 安装（推荐）

```bash
# 安装
pip3 install podman-compose

# 或使用系统包管理器
sudo dnf install podman-compose  # Fedora/RHEL
sudo apt install podman-compose  # Ubuntu (22.04+)

# 验证安装
podman-compose --version
```

### 从源码安装

```bash
git clone https://github.com/containers/podman-compose.git
cd podman-compose
sudo pip3 install .
```

---

## 🚀 使用 Podman 部署

### 本地开发环境

```bash
# 使用 Podman 脚本
./podman-dev.sh

# 或手动使用 podman-compose
podman-compose -f docker-compose.dev.yml up -d --build
```

### 生产环境

```bash
# 1. 配置 .env
cp servers/api-service/.env.example servers/api-service/.env
nano servers/api-service/.env

# 2. 使用 Podman 脚本
./podman-plus.sh

# 或手动使用 podman-compose
podman-compose up -d --build
```

---

## 🔄 Podman 与 Docker 命令对照

### 基本命令

| Docker | Podman | 说明 |
|--------|--------|------|
| `docker ps` | `podman ps` | 查看容器 |
| `docker images` | `podman images` | 查看镜像 |
| `docker run` | `podman run` | 运行容器 |
| `docker build` | `podman build` | 构建镜像 |
| `docker pull` | `podman pull` | 拉取镜像 |
| `docker exec` | `podman exec` | 执行命令 |
| `docker logs` | `podman logs` | 查看日志 |
| `docker stop` | `podman stop` | 停止容器 |
| `docker rm` | `podman rm` | 删除容器 |

### Compose 命令

| Docker Compose | Podman Compose | 说明 |
|----------------|----------------|------|
| `docker-compose up` | `podman-compose up` | 启动服务 |
| `docker-compose down` | `podman-compose down` | 停止服务 |
| `docker-compose logs` | `podman-compose logs` | 查看日志 |
| `docker-compose ps` | `podman-compose ps` | 查看状态 |
| `docker-compose exec` | `podman-compose exec` | 执行命令 |
| `docker-compose build` | `podman-compose build` | 构建镜像 |

---

## 🛠️ Podman 特有功能

### 1. Rootless 模式（无需 root 权限）

```bash
# Podman 默认以普通用户运行
podman ps

# 查看用户命名空间
podman unshare cat /proc/self/uid_map
```

### 2. 生成 systemd 服务

```bash
# 为容器生成 systemd 单元文件
podman generate systemd --new --files --name excalidraw-backend

# 安装服务
mkdir -p ~/.config/systemd/user/
mv container-excalidraw-backend.service ~/.config/systemd/user/

# 启用服务
systemctl --user enable container-excalidraw-backend.service
systemctl --user start container-excalidraw-backend.service
```

### 3. Pod 管理

```bash
# 创建 Pod（类似 Kubernetes）
podman pod create --name excalidraw-pod -p 443:443

# 在 Pod 中运行容器
podman run -d --pod excalidraw-pod --name frontend nginx

# 查看 Pod
podman pod ps
```

---

## ⚙️ Podman 配置优化

### 1. 配置文件位置

```bash
# 系统配置
/etc/containers/containers.conf

# 用户配置
~/.config/containers/containers.conf
```

### 2. 存储配置

```bash
# 查看存储信息
podman info --format '{{.Store.GraphRoot}}'

# 配置存储驱动
# 编辑 ~/.config/containers/storage.conf
[storage]
driver = "overlay"
```

### 3. 网络配置

```bash
# 查看网络
podman network ls

# 创建自定义网络
podman network create excalidraw-network

# 检查网络
podman network inspect excalidraw-network
```

---

## 🔍 故障排查

### 问题 1: podman-compose 未找到

```bash
# 检查 PATH
echo $PATH

# 查找 podman-compose
which podman-compose

# 重新安装
pip3 install --user podman-compose
```

### 问题 2: 权限问题

```bash
# 检查子 UID/GID 映射
cat /etc/subuid
cat /etc/subgid

# 如果没有，添加映射
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $(whoami)

# 重新登录后生效
```

### 问题 3: 端口绑定失败

```bash
# Rootless 模式下，端口 < 1024 需要特殊处理
# 方法 1: 使用端口映射
podman run -p 8443:443 ...

# 方法 2: 允许绑定低端口
sudo sysctl net.ipv4.ip_unprivileged_port_start=80
```

### 问题 4: SELinux 问题（CentOS/RHEL）

```bash
# 检查 SELinux 状态
getenforce

# 临时禁用（不推荐）
sudo setenforce 0

# 正确做法：添加 SELinux 标签
podman run -v /path/to/data:/data:Z ...
```

---

## 📊 性能对比

| 指标 | Docker | Podman |
|------|--------|--------|
| **启动时间** | ~2s | ~1s |
| **内存占用** | 较高（守护进程） | 较低（无守护进程） |
| **安全性** | 需要 root | Rootless 支持 |
| **资源隔离** | 好 | 更好 |

---

## 🎯 最佳实践

### 1. 使用 Rootless 模式

```bash
# 以普通用户运行所有命令
podman-compose up -d
```

### 2. 配置自动启动

```bash
# 生成 systemd 服务
podman-compose -f docker-compose.yml systemd

# 启用服务
systemctl --user enable podman-compose@excalidraw
```

### 3. 定期清理

```bash
# 清理未使用的镜像
podman image prune -a

# 清理未使用的容器
podman container prune

# 清理所有未使用的资源
podman system prune -a
```

---

## 🔄 从 Docker 迁移到 Podman

### 方法 1: 使用别名（最简单）

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
alias docker=podman
alias docker-compose=podman-compose

# 重新加载配置
source ~/.bashrc
```

### 方法 2: 使用 Podman 脚本

```bash
# 使用我们提供的 Podman 脚本
./podman-dev.sh      # 本地开发
./podman-plus.sh     # 生产环境
```

### 方法 3: 修改现有脚本

```bash
# 全局替换
sed -i 's/docker-compose/podman-compose/g' *.sh
sed -i 's/docker /podman /g' *.sh
```

---

## 📚 常用命令速查

### 开发环境

```bash
# 启动
./podman-dev.sh

# 查看日志
podman-compose -f docker-compose.dev.yml logs -f

# 进入容器
podman-compose -f docker-compose.dev.yml exec backend sh

# 停止
podman-compose -f docker-compose.dev.yml down
```

### 生产环境

```bash
# 启动
./podman-plus.sh

# 查看日志
podman-compose logs -f backend

# 重启服务
podman-compose restart backend

# 停止
podman-compose down
```

### 维护命令

```bash
# 查看所有容器
podman ps -a

# 查看资源使用
podman stats

# 清理系统
podman system prune -a --volumes

# 查看镜像
podman images
```

---

## 🎉 总结

### Podman 的优势

✅ **无守护进程** - 更轻量，更安全
✅ **Rootless** - 无需 root 权限
✅ **兼容 Docker** - 可以直接使用 Docker 镜像和命令
✅ **systemd 集成** - 更好的服务管理
✅ **更安全** - 更好的隔离和权限控制

### 使用建议

- **开发环境**: 使用 `./podman-dev.sh`
- **生产环境**: 使用 `./podman-plus.sh`
- **命令兼容**: 大部分 Docker 命令可以直接替换为 Podman

---

## 📖 参考资源

- [Podman 官方文档](https://docs.podman.io/)
- [podman-compose GitHub](https://github.com/containers/podman-compose)
- [从 Docker 迁移到 Podman](https://podman.io/getting-started/migration)
- [Podman 教程](https://github.com/containers/podman/blob/main/docs/tutorials/README.md)

---

**使用 Podman，享受更安全、更轻量的容器体验！** 🚀
