import type { VoiceInputService } from "./VoiceInputService";
import { AliyunAudioRecorder } from "./AliyunAudioRecorder";
import { AliyunWebSocketClient, type AliyunRecognitionResult } from "./AliyunWebSocketClient";

/**
 * 阿里云语音识别服务
 * 实现VoiceInputService接口，提供与BrowserVoiceInputService相同的API
 */
export class AliyunVoiceService implements VoiceInputService {
  private audioRecorder: AliyunAudioRecorder | null = null;
  private websocketClient: AliyunWebSocketClient | null = null;
  private onResultCallback: (text: string) => void = () => {};
  private onInterimResultCallback: (text: string) => void = () => {};
  private onErrorCallback: (error: any) => void = () => {};
  private onEndCallback: () => void = () => {};
  private onRestartCallback: () => void = () => {};
  private isRunning: boolean = false;
  private backendUrl: string;

  constructor(backendUrl?: string) {
    // 如果没有指定后端URL，尝试自动检测
    this.backendUrl = backendUrl || this.getDefaultBackendUrl();
  }

  /**
   * 获取默认的后端URL
   * 根据当前页面的协议和主机名自动选择合适的URL
   */
  private getDefaultBackendUrl(): string {
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const port = 4408;
    
    // 根据当前页面的协议选择对应的协议
    const protocol = currentProtocol === "https:" ? "https" : "http";
    
    // 如果当前是localhost，保持localhost
    if (currentHost === "localhost" || currentHost === "127.0.0.1") {
      return `${protocol}://localhost:${port}`;
    }
    
    // 否则使用当前主机名（适用于局域网环境）
    return `${protocol}://${currentHost}:${port}`;
  }

  /**
   * 检查当前环境是否支持语音识别
   */
  isSupported(): boolean {
    // 检查必要的Web API支持
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      window.AudioContext &&
      window.WebSocket
    );
  }

  /**
   * 开始语音识别
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("语音识别已在运行中");
      return;
    }

    try {
      this.isRunning = true;

      // 1. 从后端获取WebSocket URL
      const websocketUrl = await this.getWebSocketUrl();

      // 2. 创建并连接WebSocket客户端
      this.websocketClient = new AliyunWebSocketClient(websocketUrl);
      
      // 设置WebSocket回调
      this.websocketClient.onResult((result: AliyunRecognitionResult) => {
        if (result.isFinal) {
          this.onResultCallback(result.text);
        } else {
          this.onInterimResultCallback(result.text);
        }
      });

      this.websocketClient.onError((error: any) => {
        console.error("WebSocket错误:", error);
        this.onErrorCallback(error);
        this.stop();
      });

      this.websocketClient.onClose(() => {
        console.log("WebSocket连接已关闭");
        this.stop();
      });

      // 连接WebSocket
      await this.websocketClient.connect();

      // 3. 创建并连接音频录制器
      this.audioRecorder = new AliyunAudioRecorder();
      
      await this.audioRecorder.connect((audioData: Int16Array) => {
        // 将音频数据发送到WebSocket
        if (this.websocketClient && this.isRunning) {
          try {
            this.websocketClient.sendAudio(audioData);
          } catch (error) {
            console.error("发送音频数据失败:", error);
            this.onErrorCallback(error);
          }
        }
      });

      console.log("阿里云语音识别服务已启动");
    } catch (error) {
      console.error("启动语音识别失败:", error);
      this.isRunning = false;
      this.onErrorCallback(error);
      throw error;
    }
  }

  /**
   * 停止语音识别
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    try {
      // 停止音频录制器
      if (this.audioRecorder) {
        this.audioRecorder.disconnect();
        this.audioRecorder = null;
      }

      // 停止WebSocket客户端
      if (this.websocketClient) {
        this.websocketClient.stop();
        this.websocketClient.close();
        this.websocketClient = null;
      }

      console.log("阿里云语音识别服务已停止");
      this.onEndCallback();
    } catch (error) {
      console.error("停止语音识别失败:", error);
      this.onErrorCallback(error);
    }
  }

  /**
   * 注册结果回调函数
   */
  onResult(callback: (text: string) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * 注册中间结果回调函数
   */
  onInterimResult(callback: (text: string) => void): void {
    this.onInterimResultCallback = callback;
  }

  /**
   * 注册错误回调函数
   */
  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * 注册结束回调函数
   */
  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * 注册重启回调函数
   */
  onRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  /**
   * 从后端服务器获取WebSocket URL
   */
  private async getWebSocketUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/api/websocket-url`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.websocketUrl) {
        throw new Error("后端返回的数据中缺少websocketUrl字段");
      }

      return data.websocketUrl;
    } catch (error) {
      console.error("获取WebSocket URL失败:", error);
      throw new Error(`无法从后端获取WebSocket URL: ${error}`);
    }
  }
}
