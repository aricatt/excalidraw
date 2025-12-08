# 🔍 HTTPS 配置检查清单

在部署前，请确认以下配置已正确设置：

## ✅ 本地开发环境

### 1. Caddyfile 配置
- [ ] `https://localhost` 配置已启用（未注释）
- [ ] `tls internal` 指令存在（使用自签名证书）
- [ ] 生产环境配置已注释掉

### 2. docker-compose.yml 配置
- [ ] Caddy 端口映射正确：`80:80`, `443:443`, `443:443/udp`
- [ ] 所有服务都在 `excalidraw-network` 网络中
- [ ] CORS_ORIGIN 包含 `https://localhost`
- [ ] 前端构建参数包含 `VITE_API_URL=/api` 和 `VITE_VOICE_URL=/voice`

### 3. 数据持久化
- [ ] `postgres_data` volume 已定义
- [ ] `caddy_data` volume 已定义
- [ ] `caddy_config` volume 已定义

### 4. 部署脚本
- [ ] `docker-plus.sh` 可执行（`chmod +x docker-plus.sh`）
- [ ] 脚本显示 HTTPS 访问地址

## ✅ 生产环境

### 1. 域名配置
- [ ] 域名已注册
- [ ] DNS A 记录指向服务器 IP
- [ ] DNS 记录已生效（使用 `nslookup your-domain.com` 验证）

### 2. Caddyfile 配置
- [ ] 本地开发配置已注释掉
- [ ] 生产环境配置已启用
- [ ] 域名已替换（不是 `YOUR_DOMAIN.com`）
- [ ] 邮箱地址已更新（用于 Let's Encrypt 通知）

### 3. docker-compose.yml 配置
- [ ] CORS_ORIGIN 已更新为生产域名
- [ ] 数据库密码已修改（不是 `password`）
- [ ] JWT_SECRET 已修改（不是 `change_this_secret_in_production`）

### 4. 服务器配置
- [ ] 防火墙开放 80 端口（HTTP）
- [ ] 防火墙开放 443 端口（HTTPS）
- [ ] 服务器有足够的磁盘空间（至少 10GB）
- [ ] Docker 和 docker-compose 已安装

### 5. 安全配置
- [ ] 所有默认密码已修改
- [ ] SSH 密钥认证已启用
- [ ] 不必要的端口已关闭
- [ ] 定期备份计划已制定

## 🧪 测试清单

### 本地开发测试

```bash
# 1. 启动服务
./docker-plus.sh

# 2. 检查所有容器运行状态
docker-compose ps
# 应该看到 5 个服务都是 "Up" 状态

# 3. 检查 Caddy 日志
docker-compose logs caddy | grep -i error
# 不应该有错误

# 4. 测试前端访问
curl -k https://localhost
# 应该返回 HTML 内容

# 5. 测试 API 访问
curl -k https://localhost/api/health
# 应该返回 API 健康状态

# 6. 测试语音服务
curl -k https://localhost/voice/health
# 应该返回语音服务状态

# 7. 检查数据库连接
docker-compose exec backend npx prisma db pull
# 应该成功连接数据库

# 8. 检查 volumes
docker volume ls | grep excalidraw
# 应该看到 postgres_data, caddy_data, caddy_config
```

### 浏览器测试

- [ ] 访问 `https://localhost` 能看到前端页面
- [ ] 首次访问时显示证书警告（正常）
- [ ] 信任证书后页面正常加载
- [ ] 浏览器控制台没有 CORS 错误
- [ ] 浏览器控制台没有 WebSocket 错误
- [ ] 语音输入按钮可点击
- [ ] 语音输入功能正常工作
- [ ] 创建的元素能正常保存

### 生产环境测试

```bash
# 1. 检查 DNS
nslookup your-domain.com
# 应该返回正确的服务器 IP

# 2. 检查端口开放
nc -zv your-domain.com 80
nc -zv your-domain.com 443
# 都应该显示 "succeeded"

# 3. 启动服务
./docker-plus.sh

# 4. 等待 Let's Encrypt 证书获取
docker-compose logs -f caddy
# 应该看到 "certificate obtained successfully"

# 5. 测试 HTTPS
curl https://your-domain.com
# 应该返回 HTML，不需要 -k 参数

# 6. 检查证书
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -issuer
# 应该显示 "Let's Encrypt"
```

### 浏览器测试（生产）

- [ ] 访问 `https://your-domain.com` 显示绿色锁图标
- [ ] 证书由 Let's Encrypt 签发
- [ ] 证书有效期正常（90天）
- [ ] 所有功能正常工作
- [ ] 移动设备访问正常
- [ ] 语音功能在移动设备上正常

## 🐛 常见问题检查

### 问题：Caddy 无法启动

```bash
# 检查 Caddyfile 语法
docker run --rm -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile

# 检查端口占用
sudo lsof -i :80
sudo lsof -i :443
```

### 问题：Let's Encrypt 证书获取失败

```bash
# 检查域名解析
dig your-domain.com

# 检查 Caddy 日志
docker-compose logs caddy | grep -i "acme"

# 常见原因：
# - DNS 未生效
# - 防火墙未开放 80 端口
# - 域名指向错误的 IP
```

### 问题：语音服务连接失败

```bash
# 检查语音服务日志
docker-compose logs voice-service

# 检查 WebSocket 连接
# 在浏览器控制台运行：
# new WebSocket('wss://localhost/voice/ws')

# 检查 Caddy 配置
docker-compose exec caddy cat /etc/caddy/Caddyfile | grep -A 10 "voice"
```

### 问题：CORS 错误

```bash
# 检查后端环境变量
docker-compose exec backend env | grep CORS

# 更新 CORS 配置后重启
docker-compose restart backend
```

### 问题：数据库连接失败

```bash
# 检查数据库状态
docker-compose ps db

# 检查数据库日志
docker-compose logs db

# 测试数据库连接
docker-compose exec db psql -U postgres -d excalidraw_plus -c "SELECT 1;"
```

## 📊 性能检查

### 响应时间

```bash
# 测试前端响应时间
curl -w "@-" -o /dev/null -s https://localhost <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

### 资源使用

```bash
# 检查容器资源使用
docker stats

# 检查磁盘使用
docker system df

# 检查 volume 大小
docker volume ls -q | xargs docker volume inspect | grep Mountpoint | awk '{print $2}' | xargs du -sh
```

## ✅ 部署完成确认

当以下所有项都完成时，部署成功：

- [ ] 所有容器都在运行
- [ ] HTTPS 访问正常（绿色锁图标）
- [ ] API 请求正常
- [ ] 语音功能正常
- [ ] 数据持久化正常
- [ ] 日志没有错误
- [ ] 性能满足要求
- [ ] 备份计划已制定
- [ ] 监控已配置（可选）

## 📝 部署记录

建议记录以下信息：

```
部署日期：__________
域名：__________
服务器 IP：__________
数据库密码：__________ (安全保存)
JWT_SECRET：__________ (安全保存)
Let's Encrypt 邮箱：__________
备份位置：__________
```

## 🎉 下一步

部署完成后：

1. **设置监控**
   - 使用 Uptime Robot 或类似服务监控网站可用性
   - 配置 Caddy 日志收集

2. **定期维护**
   - 每周检查日志
   - 每月备份数据库
   - 每季度更新 Docker 镜像

3. **性能优化**
   - 根据实际使用情况调整资源
   - 考虑使用 CDN
   - 优化数据库查询

4. **安全加固**
   - 启用 fail2ban
   - 配置自动更新
   - 定期审计访问日志
