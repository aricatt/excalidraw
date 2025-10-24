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

// 尝试启动HTTPS服务器
const startHttpsServer = () => {
  try {
    const key = fs.readFileSync("server.key");
    const cert = fs.readFileSync("server.crt");
    
    const httpsServer = https.createServer({ key, cert }, app);
    
    httpsServer.listen(port, "0.0.0.0", () => {
      console.log(`🔒 HTTPS语音服务代理服务器正在运行在 https://0.0.0.0:${port}`);
      console.log(`🔒 局域网HTTPS访问地址: https://[你的IP地址]:${port}`);
      console.log("⚠️  注意: 浏览器可能会提示证书不安全，请选择'继续访问'");
    });
    
    return true;
  } catch (error) {
    console.log("⚠️  HTTPS证书未找到，启动HTTP服务器");
    return false;
  }
};

// 如果HTTPS启动失败，则启动HTTP服务器
if (!startHttpsServer()) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`🔓 HTTP语音服务代理服务器正在运行在 http://0.0.0.0:${port}`);
    console.log(`🔓 局域网HTTP访问地址: http://[你的IP地址]:${port}`);
    console.log("💡 提示: 如需HTTPS支持，请运行 'node generate-cert.js' 生成证书");
  });
}
