# Excalidraw Plus HTTPS 部署指南

本指南说明如何使用 Caddy 将所有服务（前端、后端 API、语音服务）部署为 HTTPS。

## 🎯 架构说明

```
浏览器 (HTTPS)
    ↓
Caddy (反向代理 + 自动 HTTPS)
    ├─→ 前端服务 (HTTP:80)
    ├─→ 后端 API (HTTP:6601)
    └─→ 语音服务 (HTTP:4408, 支持 WebSocket)
```

**关键特性：**
- ✅ 所有外部访问都通过 HTTPS
- ✅ 语音服务支持 WebSocket over HTTPS
- ✅ 内部服务间通信使用 HTTP（更高效）
- ✅ Caddy 自动管理 SSL 证书

## 📋 部署方式

### 方式一：本地开发（推荐用于测试）

使用 `https://localhost` 和自签名证书。

#### 1. 确认配置

`Caddyfile` 中已启用本地配置：
```caddyfile
https://localhost {
    tls internal  # 使用自签名证书
    # ... 其他配置
}
```

#### 2. 启动服务

```bash
# Linux/macOS
./docker-plus.sh

# Windows
docker-plus.bat
```

#### 3. 访问应用

- 🏠 前端：https://localhost
- 🔌 后端 API：https://localhost/api
- 🎤 语音服务：https://localhost/voice

**⚠️ 首次访问需要信任自签名证书：**
- Chrome：点击"高级" → "继续访问 localhost（不安全）"
- Firefox：点击"高级" → "接受风险并继续"
- Safari：点击"显示详细信息" → "访问此网站"

### 方式二：生产环境（使用真实域名）

使用真实域名和 Let's Encrypt 免费证书。

#### 1. 准备域名

确保你有一个域名，并将 DNS A 记录指向你的服务器 IP：

```
draw.example.com  →  YOUR_SERVER_IP
```

#### 2. 修改 Caddyfile

编辑 `Caddyfile`，注释掉本地配置，启用生产配置：

```caddyfile
# 全局配置
{
    email your-email@example.com  # 修改为你的邮箱
}

# 注释掉本地配置
# https://localhost {
#     ...
# }

# 启用生产配置
draw.example.com {  # 替换为你的域名
    # 前端服务 (主页面)
    handle /* {
        reverse_proxy frontend:80 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # 后端 API 服务
    handle /api/* {
        reverse_proxy backend:6601 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # 语音服务 (支持 WebSocket)
    handle /voice/* {
        reverse_proxy voice-service:4408 {
            # WebSocket 支持
            header_up Connection {>Connection}
            header_up Upgrade {>Upgrade}
            
            # 标准代理头
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # 启用 gzip 压缩
    encode gzip

    # 安全头
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
    }

    # 日志
    log {
        output file /var/log/caddy/access.log
    }
}
```

#### 3. 修改 docker-compose.yml

更新后端的 CORS 配置：

```yaml
backend:
  environment:
    - CORS_ORIGIN=https://draw.example.com  # 替换为你的域名
```

#### 4. 启动服务

```bash
./docker-plus.sh
```

#### 5. 验证 HTTPS

访问 `https://draw.example.com`，检查：
- ✅ 浏览器地址栏显示锁图标
- ✅ 证书由 Let's Encrypt 签发
- ✅ 语音功能正常工作

## 🔧 语音服务 WebSocket 配置

语音服务需要 WebSocket 支持，Caddy 配置中已包含关键设置：

```caddyfile
handle /voice/* {
    reverse_proxy voice-service:4408 {
        # WebSocket 支持 - 关键配置！
        header_up Connection {>Connection}
        header_up Upgrade {>Upgrade}
        
        # 增加超时时间，适配语音流
        transport http {
            read_timeout 300s
            write_timeout 300s
        }
    }
}
```

**前端连接语音服务时使用：**
```javascript
// 自动使用当前页面的协议和域名
const wsUrl = `wss://${window.location.host}/voice/ws`;
// 或使用相对路径
const wsUrl = `/voice/ws`;
```

## 🐛 故障排查

### 1. 证书错误

**问题：** 浏览器显示"您的连接不是私密连接"

**本地开发：**
- 这是正常的，因为使用自签名证书
- 点击"高级"并继续访问

**生产环境：**
- 检查域名 DNS 是否正确指向服务器
- 检查防火墙是否开放 80 和 443 端口
- 查看 Caddy 日志：`docker-compose logs caddy`

### 2. 语音服务连接失败

**检查步骤：**

```bash
# 1. 检查服务是否运行
docker-compose ps

# 2. 检查语音服务日志
docker-compose logs voice-service

# 3. 检查 Caddy 日志
docker-compose logs caddy

# 4. 测试语音服务端点
curl https://localhost/voice/health
```

### 3. CORS 错误

**问题：** 浏览器控制台显示 CORS 错误

**解决方案：**
1. 确认 `docker-compose.yml` 中的 `CORS_ORIGIN` 包含你的域名
2. 重启服务：`docker-compose restart backend`

### 4. WebSocket 连接失败

**检查：**
- 确认前端使用 `wss://` 协议（不是 `ws://`）
- 检查 Caddyfile 中的 WebSocket 配置
- 查看浏览器开发者工具的网络标签

## 📊 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f caddy
docker-compose logs -f voice-service
docker-compose logs -f backend

# 查看最近 100 行
docker-compose logs --tail=100 caddy
```

## 🔐 安全建议

### 生产环境必做：

1. **修改默认密码**
   ```yaml
   # docker-compose.yml
   - POSTGRES_PASSWORD=your_strong_password_here
   - JWT_SECRET=your_random_secret_here
   ```

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **定期备份数据库**
   ```bash
   docker-compose exec db pg_dump -U postgres excalidraw_plus > backup_$(date +%Y%m%d).sql
   ```

4. **更新 Caddy 邮箱**
   ```caddyfile
   {
       email your-real-email@example.com
   }
   ```

## 🚀 性能优化

### 1. 启用 HTTP/3

已在 `docker-compose.yml` 中配置：
```yaml
ports:
  - "443:443/udp"  # HTTP/3 (QUIC)
```

### 2. 启用 Gzip 压缩

已在 Caddyfile 中启用：
```caddyfile
encode gzip
```

### 3. 调整语音服务超时

根据实际使用情况调整：
```caddyfile
transport http {
    read_timeout 300s   # 5分钟
    write_timeout 300s
}
```

## 📱 移动设备访问

移动设备（iOS/Android）访问语音功能时：

1. **必须使用 HTTPS**（本配置已满足）
2. **必须是用户手势触发**（如点击按钮）
3. **需要授权麦克风权限**

测试步骤：
1. 在移动设备浏览器访问 `https://your-domain.com`
2. 点击语音输入按钮
3. 授权麦克风权限
4. 开始语音输入

## 🎉 完成！

现在你的 Excalidraw Plus 已经完全运行在 HTTPS 上，所有服务都通过 Caddy 安全访问！

**访问地址：**
- 本地开发：https://localhost
- 生产环境：https://your-domain.com
