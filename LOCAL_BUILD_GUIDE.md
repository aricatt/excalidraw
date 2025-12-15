# 🚀 本地构建 + 云端部署方案

## 📖 方案说明

**适用场景：** 云服务器性能较差，构建镜像很慢

**解决方案：** 在本地电脑构建镜像，推送到阿里云镜像仓库，服务器只需拉取和运行

---

## 🎯 方案优势

| 对比项 | 服务器构建 | 本地构建 + 推送 |
|--------|-----------|----------------|
| **构建速度** | 慢（10-20分钟） | 快（5-10分钟） |
| **服务器负载** | 高 | 低 |
| **内存需求** | 4GB+ | 本地无限制 |
| **网络要求** | 需要拉取依赖 | 只需拉取镜像 |
| **灵活性** | 低 | 高（本地测试） |

---

## 📋 前置准备

### 1. 创建阿里云容器镜像仓库

1. 访问 [阿里云容器镜像服务](https://cr.console.aliyun.com/)
2. 点击 **个人实例** → **命名空间**
3. 创建命名空间（例如：`excalidraw`）
4. 创建镜像仓库：
   - 仓库名称：`excalidraw-frontend`
   - 仓库类型：私有
   - 重复创建：`excalidraw-backend`、`excalidraw-voice`

### 2. 获取登录信息

在 **访问凭证** 页面获取：
- Registry 地址：`registry.cn-hangzhou.aliyuncs.com`
- 用户名：你的阿里云账号
- 密码：设置镜像仓库密码

---

## 🔧 配置步骤

### 步骤 1: 修改构建脚本

编辑 `build-and-push.sh`：

```bash
nano build-and-push.sh
```

修改以下配置：

```bash
# 修改这些值
REGISTRY="registry.cn-hangzhou.aliyuncs.com"  # 你的 Registry 地址
NAMESPACE="excalidraw"                        # 你的命名空间
VERSION="latest"                              # 版本标签

# 在登录部分修改用户名
docker login --username=your-aliyun-account $REGISTRY
```

### 步骤 2: 修改部署脚本

编辑 `deploy-from-registry.sh`：

```bash
nano deploy-from-registry.sh
```

修改相同的配置：

```bash
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="excalidraw"
VERSION="latest"

# 修改登录用户名
podman login --username=your-aliyun-account $REGISTRY
```

---

## 🚀 使用流程

### 在本地电脑（Mac）

#### 1. 构建并推送镜像

```bash
# 进入项目目录
cd /Users/mac/Gits/_ari_\ excalidraw

# 运行构建脚本
./build-and-push.sh
```

**过程：**
```
1️⃣  构建前端镜像... (5-8分钟)
2️⃣  构建后端镜像... (2-3分钟)
3️⃣  构建语音服务镜像... (1-2分钟)
4️⃣  登录阿里云镜像仓库...
5️⃣  推送镜像到阿里云... (根据网速)

🎉 所有镜像已推送成功！
```

#### 2. 验证镜像

访问阿里云控制台，应该看到 3 个镜像：
- `excalidraw/excalidraw-frontend:latest`
- `excalidraw/excalidraw-backend:latest`
- `excalidraw/excalidraw-voice:latest`

---

### 在云服务器

#### 1. 配置环境变量

```bash
# 创建 .env 文件
cp servers/api-service/.env.example servers/api-service/.env
nano servers/api-service/.env

# 填写必需配置
DATABASE_URL="mysql://..."
JWT_SECRET="..."
CORS_ORIGIN="https://your-domain.com"
```

#### 2. 部署应用

```bash
# 运行部署脚本
./deploy-from-registry.sh
```

**过程：**
```
1️⃣  登录阿里云镜像仓库...
2️⃣  拉取镜像... (2-5分钟，取决于网速)
3️⃣  配置网络...
4️⃣  停止旧容器...
5️⃣  启动服务...
6️⃣  等待服务启动...
7️⃣  执行数据库迁移...

🎉 部署完成！
```

---

## 📊 时间对比

### 服务器构建方案

```
总时间：15-25 分钟

拉取代码         1 分钟
构建前端镜像    10 分钟  ← 慢
构建后端镜像     3 分钟
构建语音镜像     2 分钟
启动容器         2 分钟
数据库迁移       1 分钟
```

### 本地构建 + 推送方案

```
总时间：10-15 分钟

本地构建（快）：
  前端镜像       5 分钟  ← 快
  后端镜像       2 分钟
  语音镜像       1 分钟
  推送镜像       2 分钟

服务器部署（快）：
  拉取镜像       3 分钟  ← 快
  启动容器       1 分钟
  数据库迁移     1 分钟
```

**节省时间：5-10 分钟**

---

## 🔄 更新流程

### 代码更新后

**在本地：**
```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并推送
./build-and-push.sh
```

**在服务器：**
```bash
# 1. 停止旧容器
podman stop excalidraw-frontend excalidraw-backend excalidraw-voice

# 2. 重新部署
./deploy-from-registry.sh
```

---

## 💡 最佳实践

### 1. 使用版本标签

```bash
# 不要总是使用 latest
VERSION="v1.0.0"

# 构建时
docker build -t registry.cn-hangzhou.aliyuncs.com/excalidraw/frontend:v1.0.0

# 部署时指定版本
podman pull registry.cn-hangzhou.aliyuncs.com/excalidraw/frontend:v1.0.0
```

### 2. 本地测试后再推送

```bash
# 1. 本地构建
docker build -t excalidraw-frontend:test .

# 2. 本地测试
docker run -p 8080:80 excalidraw-frontend:test

# 3. 测试通过后推送
./build-and-push.sh
```

### 3. 保留多个版本

```bash
# 推送新版本前，先标记旧版本
docker tag excalidraw-frontend:latest excalidraw-frontend:v1.0.0
docker push excalidraw-frontend:v1.0.0

# 然后推送新版本
docker push excalidraw-frontend:latest
```

---

## 🔍 故障排查

### 问题 1: 推送失败

```
Error: unauthorized: authentication required
```

**解决：**
```bash
# 重新登录
docker login registry.cn-hangzhou.aliyuncs.com
```

### 问题 2: 拉取失败

```
Error: image not found
```

**解决：**
1. 检查镜像名称是否正确
2. 确认镜像已推送成功
3. 检查命名空间和仓库名

### 问题 3: 架构不匹配

```
Error: exec format error
```

**解决：**
```bash
# 构建时指定平台
docker build --platform linux/amd64 -t image:tag .
```

---

## 📋 完整配置示例

### build-and-push.sh

```bash
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="excalidraw"
VERSION="v1.0.0"

# 登录
docker login --username=your-account@aliyun.com $REGISTRY

# 构建
docker build --platform linux/amd64 \
  -t $REGISTRY/$NAMESPACE/excalidraw-frontend:$VERSION \
  -f excalidraw-plus/Dockerfile .

# 推送
docker push $REGISTRY/$NAMESPACE/excalidraw-frontend:$VERSION
```

### deploy-from-registry.sh

```bash
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="excalidraw"
VERSION="v1.0.0"

# 登录
podman login --username=your-account@aliyun.com $REGISTRY

# 拉取
podman pull $REGISTRY/$NAMESPACE/excalidraw-frontend:$VERSION

# 运行
podman run -d \
  --name excalidraw-frontend \
  $REGISTRY/$NAMESPACE/excalidraw-frontend:$VERSION
```

---

## 🎯 总结

### 推荐使用场景

✅ **使用本地构建方案：**
- 云服务器性能差
- 本地电脑性能好
- 需要频繁更新
- 需要本地测试

❌ **使用服务器构建方案：**
- 云服务器性能好
- 本地网络不稳定
- 不需要频繁更新

### 核心优势

1. **更快** - 本地构建快，服务器只需拉取
2. **更稳** - 本地测试后再部署
3. **更省** - 节省服务器资源
4. **更灵活** - 可以保留多个版本

---

## 🚀 快速开始

```bash
# 本地（Mac）
./build-and-push.sh

# 服务器
./deploy-from-registry.sh
```

**就这么简单！** 🎉
