import express from "express";
import cors from "cors";
import https from "https";
import fs from "fs";

const app = express();
const port = 4408; // 使用一个与前端不同的端口

// 允许局域网内的跨域请求
app.use(cors({
  origin: true, // 允许所有来源，包括局域网IP
  credentials: true
}));

app.get("/api/websocket-url", async (req, res) => {
  const apiKey = "sk-8e4cdb3bda2f498f935fda53d5d9d681";

  if (!apiKey) {
    console.error("错误：未设置 ALIYUN_API_KEY 环境变量。");
    return res.status(500).json({ error: "服务器未正确配置API Key。" });
  }

  try {
    // 根据官方示例，DashScope的WebSocket URL格式是：
    // wss://dashscope.aliyuncs.com/api-ws/v1/inference/?api_key=sk-xxxxxxxx
    const websocketUrl = `wss://dashscope.aliyuncs.com/api-ws/v1/inference/?api_key=${apiKey}`;

    res.json({
      websocketUrl,
      success: true,
    });
  } catch (error) {
    console.error("生成WebSocket URL时发生错误:", error);
    res
      .status(500)
      .json({ error: "服务器在生成WebSocket URL时发生内部错误。" });
  }
});

// 启动服务器
const startServer = () => {
  const enableHttps = process.env.ENABLE_HTTPS === 'true';

  if (enableHttps) {
    try {
      const key = fs.readFileSync("server.key");
      const cert = fs.readFileSync("server.crt");

      const httpsServer = https.createServer({ key, cert }, app);

      httpsServer.listen(port, "0.0.0.0", () => {
        console.log(`🔒 HTTPS语音服务代理服务器正在运行在 https://0.0.0.0:${port}`);
      });
    } catch (error) {
      console.error("❌ HTTPS证书未找到，回退到 HTTP 模式");
      startHttpServer();
    }
  } else {
    startHttpServer();
  }
};

const startHttpServer = () => {
  app.listen(port, "0.0.0.0", () => {
    console.log(`🔓 HTTP语音服务代理服务器正在运行在 http://0.0.0.0:${port}`);
    console.log("⚠️  注意: 在生产环境中，请确保通过反向代理(如Caddy/Nginx)提供HTTPS支持");
  });
};

startServer();
