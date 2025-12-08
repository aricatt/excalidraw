# 🚀 快速部署参考

## 一键部署

```bash
# Linux/macOS
./docker-plus.sh

# Windows
docker-plus.bat
```

## 访问地址

| 服务 | 本地开发 | 生产环境 |
|------|---------|---------|
| 🏠 前端 | https://localhost | https://your-domain.com |
| 🔌 API | https://localhost/api | https://your-domain.com/api |
| 🎤 语音 | https://localhost/voice | https://your-domain.com/voice |

## 架构图

```
┌─────────────┐
│   浏览器     │ HTTPS
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Caddy (反向代理 + 自动 HTTPS)       │
│  - 自动 SSL 证书管理                 │
│  - WebSocket 支持                   │
│  - Gzip 压缩                        │
└──┬──────────┬──────────┬────────────┘
   │          │          │
   ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────────┐
│前端   │  │后端   │  │语音服务   │
│:80   │  │:6601 │  │:4408     │
└──────┘  └──┬───┘  └──────────┘
             │
        ┌────┴────┐
        ▼         ▼
    ┌──────┐  ┌──────┐
    │ DB   │  │Redis │
    │:5432 │  │:6379 │
    └──────┘  └──────┘
```

## 关键配置点

### 1. WebSocket 支持（语音服务）

```caddyfile
handle /voice/* {
    reverse_proxy voice-service:4408 {
        header_up Connection {>Connection}
        header_up Upgrade {>Upgrade}
    }
}
```

### 2. CORS 配置

```yaml
# docker-compose.yml
backend:
  environment:
    - CORS_ORIGIN=https://localhost,https://your-domain.com
```

### 3. 前端 API 配置

```yaml
# docker-compose.yml
frontend:
  build:
    args:
      - VITE_API_URL=/api
      - VITE_VOICE_URL=/voice
```

## 常用命令

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启特定服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 完全清理（包括数据）
docker-compose down -v

# 备份数据库
docker-compose exec db pg_dump -U postgres excalidraw_plus > backup.sql
```

## 切换到生产环境

### 1. 修改 Caddyfile

```caddyfile
# 注释掉本地配置
# https://localhost {
#     ...
# }

# 启用生产配置
your-domain.com {
    # ... 配置内容
}
```

### 2. 修改 docker-compose.yml

```yaml
backend:
  environment:
    - CORS_ORIGIN=https://your-domain.com
```

### 3. 重新部署

```bash
docker-compose down
./docker-plus.sh
```

## 故障排查速查

| 问题 | 检查命令 | 解决方案 |
|------|---------|---------|
| 证书错误 | `docker-compose logs caddy` | 检查域名 DNS，信任自签名证书 |
| 语音连接失败 | `docker-compose logs voice-service` | 检查 WebSocket 配置 |
| CORS 错误 | `docker-compose logs backend` | 更新 CORS_ORIGIN |
| 数据库连接失败 | `docker-compose logs db` | 等待数据库启动完成 |

## 安全检查清单

- [ ] 修改默认数据库密码
- [ ] 修改 JWT_SECRET
- [ ] 配置防火墙（只开放 80, 443）
- [ ] 更新 Caddy 邮箱地址
- [ ] 定期备份数据库
- [ ] 启用 HSTS（生产环境已配置）

## 性能优化

- ✅ HTTP/3 (QUIC) 已启用
- ✅ Gzip 压缩已启用
- ✅ 语音服务超时时间已优化（300s）
- ✅ 自定义 Docker 网络（bridge）

## 更多信息

详细文档：`HTTPS_DEPLOYMENT.md`
