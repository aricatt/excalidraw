import { BrowserVoiceInputService } from "./BrowserVoiceInputService";
import { AliyunVoiceService } from "./AliyunVoiceService";
import type { VoiceInputService } from "./VoiceInputService";
import { DEFAULT_VOICE_CONFIG, type VoiceServiceConfig as ConfigType } from "./config";

export type VoiceServiceProvider = "browser" | "aliyun";

export interface VoiceServiceConfig {
  provider: VoiceServiceProvider;
  lang?: string;
  voiceConfig?: Partial<ConfigType>;
}

export const createVoiceInputService = (config: VoiceServiceConfig): VoiceInputService => {
  switch (config.provider) {
    case "aliyun":
      return new AliyunVoiceService(config.voiceConfig);
    case "browser":
    default:
      return new BrowserVoiceInputService(config.lang || "en-US");
  }
};

// 保持向后兼容的简化版本
export const createBrowserVoiceInputService = (lang: string = "en-US"): VoiceInputService => {
  return new BrowserVoiceInputService(lang);
};

export const createAliyunVoiceInputService = (backendUrl?: string): VoiceInputService => {
  // 向后兼容：如果传入了backendUrl，将其转换为新的配置格式
  const config = backendUrl ? { serverUrl: backendUrl, port: 4408, forceHttps: true } : undefined;
  return new AliyunVoiceService(config);
};
