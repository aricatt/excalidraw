/**
 * 基于阿里云官方示例的WebSocket客户端
 * 参考：alibabacloud-bailian-speech-demo/samples/gallery/paraformer-realtime-js/paraformer_realtime_api.js
 */

export interface AliyunRecognitionResult {
  text: string;
  isFinal: boolean;
}

export class AliyunWebSocketClient {
  private websocketUrl: string;
  private socket: WebSocket | null = null;
  private taskId: string | null = null;
  private isConnected: boolean = false;
  private isTaskStarted: boolean = false;
  private onResultCallback: (result: AliyunRecognitionResult) => void = () => {};
  private onErrorCallback: (error: any) => void = () => {};
  private onCloseCallback: () => void = () => {};

  constructor(websocketUrl: string) {
    this.websocketUrl = websocketUrl;
  }

  /**
   * 连接到WebSocket服务并发送run-task消息
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.websocketUrl);

        this.socket.onopen = () => {
          console.log("WebSocket连接已建立");
          this.isConnected = true;

          // 生成随机任务ID
          this.taskId = this.generateUUID();

          // 发送run-task消息
          const runTaskMessage = {
            header: {
              action: "run-task",
              task_id: this.taskId,
              streaming: "duplex",
            },
            payload: {
              task_group: "audio",
              task: "asr",
              function: "recognition",
              model: "paraformer-realtime-v2",
              parameters: {
                format: "pcm",
                sample_rate: 16000,
                disfluency_removal_enabled: false,
                language_hints: ["zh"],
              },
              input: {},
            },
          };

          this.socket!.send(JSON.stringify(runTaskMessage));
          console.log("已发送run-task消息:", runTaskMessage);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("收到消息:", message);

            switch (message.header.event) {
              case "task-started":
                this.isTaskStarted = true;
                console.log("任务已开始");
                resolve();
                break;

              case "result-generated":
                console.log("收到识别结果:", message.payload?.output?.sentence);
                if (message.payload?.output?.sentence?.text) {
                  // 检查是否是最终结果
                  // 阿里云会在sentence对象中提供end_time来标识句子是否结束
                  const sentence = message.payload.output.sentence;
                  const isFinal = sentence.end_time !== undefined && sentence.end_time > 0;
                  
                  const result: AliyunRecognitionResult = {
                    text: sentence.text,
                    isFinal: isFinal,
                  };
                  
                  console.log(`识别结果类型: ${isFinal ? '最终' : '临时'}, 内容: "${sentence.text}"`);
                  this.onResultCallback(result);
                }
                break;

              case "task-finished":
                console.log("任务已完成");
                this.onCloseCallback();
                break;

              case "task-failed":
                console.error("任务失败:", message.header.error_message);
                this.onErrorCallback(new Error(message.header.error_message));
                break;

              default:
                console.log("未知事件:", message.header.event);
            }
          } catch (error) {
            console.error("解析WebSocket消息失败:", error);
            this.onErrorCallback(error);
          }
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket错误:", error);
          this.onErrorCallback(error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log("WebSocket连接已关闭");
          this.isConnected = false;
          this.isTaskStarted = false;
          this.onCloseCallback();
          
          if (!this.isTaskStarted) {
            reject(new Error("WebSocket在任务开始前关闭"));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: Int16Array): void {
    if (!this.isConnected || !this.isTaskStarted) {
      throw new Error("WebSocket未连接或任务未开始");
    }

    if (!this.socket) {
      throw new Error("WebSocket实例不存在");
    }

    this.socket.send(audioData);
  }

  /**
   * 停止任务并等待task-finished消息
   */
  async stop(): Promise<void> {
    if (!this.isConnected || !this.isTaskStarted || !this.socket) {
      return;
    }

    const finishTaskMessage = {
      header: {
        action: "finish-task",
        task_id: this.taskId,
        streaming: "duplex",
      },
      payload: {
        input: {},
      },
    };

    this.socket.send(JSON.stringify(finishTaskMessage));
    console.log("已发送finish-task消息:", finishTaskMessage);
  }

  /**
   * 关闭WebSocket连接
   */
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * 注册结果回调
   */
  onResult(callback: (result: AliyunRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * 注册错误回调
   */
  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * 注册关闭回调
   */
  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * 生成随机UUID
   */
  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
