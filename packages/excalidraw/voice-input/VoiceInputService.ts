export interface VoiceInputService {
  /**
   * 检查当前环境是否支持语音识别
   */
  isSupported(): boolean;

  /**
   * 开始语音识别
   */
  start(): void;

  /**
   * 停止语音识别
   */
  stop(): void;

  /**
   * 注册结果回调函数
   * @param callback - 识别到最终结果时调用
   */
  onResult(callback: (text: string) => void): void;

  /**
   * 注册中间结果回调函数
   * @param callback - 识别到临时结果时调用
   */
  onInterimResult(callback: (text: string) => void): void;

  /**
   * 注册错误回调函数
   */
  onError(callback: (error: any) => void): void;

  /**
   * 注册结束回调函数
   */
  onEnd(callback: () => void): void;

  /**
   * 注册重启回调函数
   */
  onRestart?(callback: () => void): void;
}
