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
        this.onEndCallback();
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
}
