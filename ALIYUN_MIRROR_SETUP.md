# 🇨🇳 阿里云 Podman 镜像加速配置

## 问题说明

在阿里云服务器上拉取 Docker Hub 镜像时超时：
```
Error: pinging container registry registry-1.docker.io: dial tcp xxx:443: i/o timeout
```

**原因：** 中国大陆访问 Docker Hub 较慢或被限制。

---

## 🚀 快速解决方案

### 方法 1: 配置阿里云镜像加速（推荐）

```bash
# 1. 创建或编辑 Podman 配置文件
sudo mkdir -p /etc/containers
sudo nano /etc/containers/registries.conf

# 2. 添加以下内容（替换整个文件）
```

**配置内容：**

```toml
# /etc/containers/registries.conf

# 不合格的镜像名称将被搜索的注册表列表
unqualified-search-registries = ["docker.io"]

# 配置镜像加速
[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"
insecure = false

[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"
insecure = false

[[registry.mirror]]
location = "hub-mirror.c.163.com"
insecure = false

# 阿里云容器镜像服务（需要登录）
# [[registry.mirror]]
# location = "你的专属加速地址.mirror.aliyuncs.com"
# insecure = false
```

```bash
# 3. 保存并退出（Ctrl+O, Enter, Ctrl+X）

# 4. 重启 Podman（如果有服务运行）
sudo systemctl restart podman 2>/dev/null || true

# 5. 测试拉取镜像
podman pull node:18-alpine
```

---

### 方法 2: 使用阿里云个人镜像加速地址（最快）

#### 获取专属加速地址

1. 登录 [阿里云容器镜像服务](https://cr.console.aliyun.com/)
2. 左侧菜单选择 **镜像工具** → **镜像加速器**
3. 复制你的专属加速地址，格式如：`https://xxxxx.mirror.aliyuncs.com`

#### 配置专属加速

```bash
# 编辑配置文件
sudo nano /etc/containers/registries.conf
```

**添加你的专属地址：**

```toml
unqualified-search-registries = ["docker.io"]

[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
# 替换为你的专属加速地址（去掉 https://）
location = "xxxxx.mirror.aliyuncs.com"
insecure = false
```

---

### 方法 3: 使用国内公共镜像源

```bash
# 编辑配置
sudo nano /etc/containers/registries.conf
```

**使用多个镜像源：**

```toml
unqualified-search-registries = ["docker.io"]

[[registry]]
prefix = "docker.io"
location = "docker.io"

# 阿里云公共镜像
[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"

# 中科大镜像
[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"

# 网易镜像
[[registry.mirror]]
location = "hub-mirror.c.163.com"

# 腾讯云镜像
[[registry.mirror]]
location = "mirror.ccs.tencentyun.com"
```

---

## ✅ 验证配置

```bash
# 1. 查看配置
cat /etc/containers/registries.conf

# 2. 测试拉取镜像
podman pull node:18-alpine

# 应该看到从镜像源拉取：
# Trying to pull registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine...

# 3. 查看镜像
podman images | grep node
```

---

## 🔧 完整配置文件示例

创建文件 `/etc/containers/registries.conf`：

```toml
# Podman 镜像仓库配置
# 适用于中国大陆阿里云服务器

# 搜索顺序
unqualified-search-registries = ["docker.io"]

# Docker Hub 镜像加速
[[registry]]
prefix = "docker.io"
location = "docker.io"

# 阿里云杭州镜像（公共）
[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"
insecure = false

# 中科大镜像
[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"
insecure = false

# 网易镜像
[[registry.mirror]]
location = "hub-mirror.c.163.com"
insecure = false

# 腾讯云镜像
[[registry.mirror]]
location = "mirror.ccs.tencentyun.com"
insecure = false

# 阿里云容器镜像服务（其他区域）
[[registry]]
prefix = "registry.cn-beijing.aliyuncs.com"
location = "registry.cn-beijing.aliyuncs.com"
insecure = false

[[registry]]
prefix = "registry.cn-shanghai.aliyuncs.com"
location = "registry.cn-shanghai.aliyuncs.com"
insecure = false

# Quay.io 镜像
[[registry]]
prefix = "quay.io"
location = "quay.io"

[[registry.mirror]]
location = "quay.mirrors.ustc.edu.cn"
insecure = false

# gcr.io 镜像
[[registry]]
prefix = "gcr.io"
location = "gcr.io"

[[registry.mirror]]
location = "gcr.mirrors.ustc.edu.cn"
insecure = false
```

---

## 🚀 配置后重新部署

```bash
# 1. 配置镜像加速（见上面）

# 2. 清理之前失败的构建
podman system prune -a -f

# 3. 重新部署
./podman-native.sh

# 或使用兼容版本的 podman-compose
pip3 install 'podman-compose==1.0.3'
./podman-plus.sh
```

---

## 📊 镜像源速度对比

| 镜像源 | 速度 | 稳定性 | 推荐度 |
|--------|------|--------|--------|
| 阿里云个人加速 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ 最推荐 |
| 阿里云公共镜像 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ 推荐 |
| 中科大镜像 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ 推荐 |
| 网易镜像 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ 备用 |
| 腾讯云镜像 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ 推荐 |

---

## 🔍 故障排查

### 问题 1: 配置后仍然超时

```bash
# 检查网络连接
ping registry.cn-hangzhou.aliyuncs.com

# 检查配置是否生效
podman info | grep -A 10 registries

# 尝试直接指定镜像源
podman pull registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine
```

### 问题 2: 权限问题

```bash
# 确保配置文件权限正确
sudo chmod 644 /etc/containers/registries.conf

# 确保目录存在
sudo mkdir -p /etc/containers
```

### 问题 3: 配置文件位置

```bash
# Podman 配置文件可能在不同位置
# 系统级别
/etc/containers/registries.conf

# 用户级别
~/.config/containers/registries.conf

# 检查 Podman 使用哪个配置
podman info --debug 2>&1 | grep registries.conf
```

---

## 💡 一键配置脚本

```bash
#!/bin/bash
# 快速配置 Podman 镜像加速

# 创建配置目录
sudo mkdir -p /etc/containers

# 备份旧配置
sudo cp /etc/containers/registries.conf /etc/containers/registries.conf.bak 2>/dev/null || true

# 写入新配置
sudo tee /etc/containers/registries.conf > /dev/null <<'EOF'
unqualified-search-registries = ["docker.io"]

[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"
insecure = false

[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"
insecure = false

[[registry.mirror]]
location = "hub-mirror.c.163.com"
insecure = false
EOF

echo "✅ 配置完成！"
echo "测试拉取镜像: podman pull node:18-alpine"
```

保存为 `setup-mirrors.sh`，然后运行：

```bash
chmod +x setup-mirrors.sh
./setup-mirrors.sh
```

---

## 🎯 推荐配置（阿里云服务器）

```bash
# 1. 快速配置镜像加速
sudo tee /etc/containers/registries.conf > /dev/null <<'EOF'
unqualified-search-registries = ["docker.io"]

[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"
insecure = false

[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"
insecure = false
EOF

# 2. 安装兼容版本的 podman-compose
pip3 install 'podman-compose==1.0.3'

# 3. 重新部署
./podman-plus.sh
```

---

**配置镜像加速后，拉取速度将大幅提升！** 🚀
