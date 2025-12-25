/**
 * 语音服务配置
 */
export interface VoiceServiceConfig {
  /** 语音服务器地址 */
  serverUrl: string;
  /** 服务器端口 */
  port: number;
  /** 是否强制使用HTTPS */
  forceHttps: boolean;
}

/**
 * 默认语音服务配置
 * serverUrl 为空时，将自动使用当前页面的 origin
 */
export const DEFAULT_VOICE_CONFIG: VoiceServiceConfig = {
  serverUrl: "", // 空字符串表示使用当前页面的 origin
  port: 4408,
  forceHttps: true
};

/**
 * 获取完整的语音服务器URL
 * 如果 serverUrl 为空，则使用当前页面的 origin（适用于通过 Caddy 反向代理的部署）
 */
export function getVoiceServerUrl(config: VoiceServiceConfig = DEFAULT_VOICE_CONFIG): string {
  const { serverUrl, port } = config;

  // 如果 serverUrl 为空，使用当前页面的 origin（适用于反向代理模式）
  if (!serverUrl) {
    // 在浏览器环境中使用 window.location.origin
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    // 在非浏览器环境中返回空字符串
    return '';
  }

  // 如果serverUrl已经包含端口，直接返回
  if (serverUrl.includes(':' + port)) {
    return serverUrl;
  }

  // 否则添加端口
  return `${serverUrl}:${port}`;
}

/**
 * 获取WebSocket URL的API端点
 * 使用 /voice/api/websocket-url 路径，通过 Caddy 反向代理路由到语音服务
 */
export function getWebSocketUrlEndpoint(config: VoiceServiceConfig = DEFAULT_VOICE_CONFIG): string {
  const baseUrl = getVoiceServerUrl(config);
  // 使用 /voice 前缀，因为 Caddy 配置了 reverse_proxy /voice/* excalidraw-voice:4408
  return `${baseUrl}/voice/api/websocket-url`;
}
