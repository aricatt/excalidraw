# Python 3.6 兼容性问题解决方案

## 问题说明

错误信息：
```
SyntaxError: invalid syntax
if isinstance(services := content.get('services'), dict):
```

**原因：** podman-compose 新版本使用了 Python 3.8+ 的海象运算符 (`:=`)，但你的系统使用 Python 3.6。

---

## 解决方案 1: 升级 Python（推荐）

### CentOS 7 / RHEL 7

```bash
# 安装 Python 3.8
sudo yum install -y centos-release-scl
sudo yum install -y rh-python38

# 启用 Python 3.8
scl enable rh-python38 bash

# 或永久启用
echo 'source scl_source enable rh-python38' >> ~/.bashrc
source ~/.bashrc

# 验证版本
python3 --version  # 应该显示 Python 3.8.x

# 重新安装 podman-compose
pip3 install --upgrade podman-compose
```

### CentOS 8 / RHEL 8 / Rocky Linux 8

```bash
# 安装 Python 3.8 或 3.9
sudo dnf install -y python38
# 或
sudo dnf install -y python39

# 使用 Python 3.8 安装 podman-compose
python3.8 -m pip install podman-compose

# 创建别名
echo 'alias podman-compose="python3.8 -m podman_compose"' >> ~/.bashrc
source ~/.bashrc
```

---

## 解决方案 2: 安装兼容版本的 podman-compose

### 安装旧版本

```bash
# 卸载当前版本
pip3 uninstall podman-compose

# 安装兼容 Python 3.6 的版本
pip3 install 'podman-compose<1.0.4'

# 验证安装
podman-compose --version
```

---

## 解决方案 3: 直接使用 Podman（无需 podman-compose）

如果升级 Python 困难，可以直接使用 Podman 命令。

### 创建简化部署脚本

我会为你创建一个不依赖 podman-compose 的脚本。

---

## 推荐方案

### 对于 CentOS 7

```bash
# 1. 安装 Python 3.8
sudo yum install -y centos-release-scl
sudo yum install -y rh-python38

# 2. 使用 Python 3.8
scl enable rh-python38 bash

# 3. 重新安装 podman-compose
pip3 install --upgrade podman-compose

# 4. 重新运行部署
./podman-plus.sh
```

### 对于 CentOS 8 / Rocky Linux

```bash
# 1. 安装 Python 3.8
sudo dnf install -y python38

# 2. 使用 Python 3.8 安装
python3.8 -m pip install podman-compose

# 3. 创建别名
alias podman-compose="python3.8 -m podman_compose"

# 4. 重新运行部署
./podman-plus.sh
```

---

## 快速测试

```bash
# 检查 Python 版本
python3 --version

# 检查 podman-compose 版本
podman-compose --version

# 如果还是报错，使用旧版本
pip3 install 'podman-compose==1.0.3'
```

---

## 临时解决方案：使用 Docker 脚本

如果暂时无法解决 Python 问题，可以：

```bash
# 检查是否安装了 docker-compose
which docker-compose

# 如果有，直接使用 Docker 脚本
./docker-plus.sh
```

或者安装 docker-compose：

```bash
# 安装 docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证
docker-compose --version

# 使用 Docker 脚本
./docker-plus.sh
```

---

## 验证修复

```bash
# 1. 检查 Python 版本
python3 --version
# 应该是 3.8 或更高

# 2. 检查 podman-compose
podman-compose --version

# 3. 测试运行
podman-compose ps

# 4. 重新部署
./podman-plus.sh
```
