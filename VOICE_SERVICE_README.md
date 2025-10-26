# 语音服务配置说明

## 🎯 概述

语音服务现在使用固定的 HTTPS 服务器地址，不再依赖 localhost 或自动检测。

## 📝 当前配置

- **服务器地址**: `https://192.168.31.244:4408`
- **协议**: 仅支持 HTTPS
- **端口**: 4408

## 🔧 修改服务器地址

### 方法1: 修改配置文件

编辑 `voice-server-config.json`:

```json
{
  "serverUrl": "https://你的IP地址",
  "port": 4408,
  "forceHttps": true
}
```

### 方法2: 修改代码配置

在 `packages/excalidraw/components/Actions.tsx` 中找到：

```typescript
voiceConfig: {
  serverUrl: "https://192.168.31.244",  // 修改这里
  port: 4408,
  forceHttps: true
}
```

## 🔒 HTTPS 证书设置

语音服务器需要 HTTPS 证书才能运行。

### 生成自签名证书

在 `servers/aliyunasr/` 目录下运行：

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes
```

### 证书文件

确保以下文件存在：
- `servers/aliyunasr/server.key`
- `servers/aliyunasr/server.crt`

## 🚀 启动服务

1. **启动语音服务器**:
   ```bash
   cd servers/aliyunasr
   npm start
   ```

2. **启动前端应用**:
   ```bash
   npm run dev
   ```

## 🔍 故障排除

### 证书错误
- 浏览器会提示"不安全连接"
- 点击"高级" → "继续访问"

### 连接失败
- 确认服务器地址正确
- 确认端口 4408 未被占用
- 确认防火墙允许该端口

### 网络配置
- 确保客户端和服务器在同一网络
- 如果使用不同网络，需要配置端口转发

## 📱 使用方式

1. 进入文本编辑模式
2. 按住语音输入按钮开始录音
3. 松开按钮停止录音并保存内容
