import { BrowserVoiceInputService } from "./BrowserVoiceInputService";
import type { VoiceInputService } from "./VoiceInputService";

export const createVoiceInputService = (lang: string = "en-US"): VoiceInputService => {
  // 未来可以在这里根据配置选择不同的服务
  // if (config.provider === 'cloud') {
  //   return new CloudVoiceInputService(lang);
  // }
  return new BrowserVoiceInputService(lang);
};
