import type { VoiceInputService } from "./VoiceInputService";

// 兼容不同浏览器
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export class BrowserVoiceInputService implements VoiceInputService {
  private recognition: any;
  private onResultCallback: (text: string) => void = () => {};
  private onInterimResultCallback: (text: string) => void = () => {};
  private onErrorCallback: (error: any) => void = () => {};
  private onEndCallback: () => void = () => {};
  private onRestartCallback: () => void = () => {};
  private isManualStop: boolean = false;
  private shouldRestart: boolean = true;

  constructor(lang: string = "en-US") {
    if (this.isSupported()) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.onResultCallback(finalTranscript);
        }
        if (interimTranscript) {
          this.onInterimResultCallback(interimTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.onErrorCallback(event.error);
      };

      this.recognition.onend = () => {
        console.log("语音识别结束，是否手动停止:", this.isManualStop);
        
        // 如果不是手动停止且应该重启，则自动重新开始
        if (!this.isManualStop && this.shouldRestart) {
          console.log("自动重启语音识别...");
          setTimeout(() => {
            try {
              this.recognition.start();
            } catch (error) {
              console.error("自动重启语音识别失败:", error);
              // 重启失败时，继续尝试重启而不是结束
              if (this.shouldRestart) {
                console.log("重启失败，1秒后再次尝试...");
                setTimeout(() => {
                  try {
                    this.recognition.start();
                  } catch (retryError) {
                    console.error("重试启动失败:", retryError);
                    // 多次失败后才真正结束
                    this.onEndCallback();
                  }
                }, 1000);
              } else {
                this.onEndCallback();
              }
            }
          }, 100); // 短暂延迟避免冲突
        } else {
          this.onEndCallback();
        }
        
        // 重置手动停止标志
        this.isManualStop = false;
      };
    }
  }

  isSupported(): boolean {
    return !!SpeechRecognition;
  }

  start(): void {
    if (this.isSupported()) {
      try {
        console.log("开始语音识别...");
        this.isManualStop = false;
        this.shouldRestart = true;
        this.recognition.start();
      } catch (error) {
        console.error("启动语音识别失败:", error);
        this.onErrorCallback(error);
      }
    } else {
      console.warn("浏览器不支持语音识别");
      this.onErrorCallback("浏览器不支持语音识别");
    }
  }

  stop(): void {
    if (this.isSupported()) {
      console.log("手动停止语音识别");
      this.isManualStop = true;
      this.shouldRestart = false;
      this.recognition.stop();
    }
  }

  onResult(callback: (text: string) => void): void {
    this.onResultCallback = callback;
  }

  onInterimResult(callback: (text: string) => void): void {
    this.onInterimResultCallback = callback;
  }

  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  onRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }
}
