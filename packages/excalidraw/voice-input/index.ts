import { BrowserVoiceInputService } from "./BrowserVoiceInputService";
import { AliyunVoiceService } from "./AliyunVoiceService";
import type { VoiceInputService } from "./VoiceInputService";

export type VoiceServiceProvider = "browser" | "aliyun";

export interface VoiceServiceConfig {
  provider: VoiceServiceProvider;
  lang?: string;
  backendUrl?: string;
}

export const createVoiceInputService = (config: VoiceServiceConfig): VoiceInputService => {
  switch (config.provider) {
    case "aliyun":
      return new AliyunVoiceService(config.backendUrl);
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
  return new AliyunVoiceService(backendUrl);
};
