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
 */
export const DEFAULT_VOICE_CONFIG: VoiceServiceConfig = {
  serverUrl: "https://192.168.31.244",
  port: 4408,
  forceHttps: true
};

/**
 * 获取完整的语音服务器URL
 */
export function getVoiceServerUrl(config: VoiceServiceConfig = DEFAULT_VOICE_CONFIG): string {
  const { serverUrl, port } = config;
  
  // 如果serverUrl已经包含端口，直接返回
  if (serverUrl.includes(':' + port)) {
    return serverUrl;
  }
  
  // 否则添加端口
  return `${serverUrl}:${port}`;
}

/**
 * 获取WebSocket URL的API端点
 */
export function getWebSocketUrlEndpoint(config: VoiceServiceConfig = DEFAULT_VOICE_CONFIG): string {
  return `${getVoiceServerUrl(config)}/api/websocket-url`;
}
