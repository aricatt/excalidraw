/**
 * 基于阿里云官方示例的音频录制器
 * 参考：alibabacloud-bailian-speech-demo/samples/gallery/paraformer-realtime-js/audio_recorder.js
 */

export class AliyunAudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private onAudioDataCallback: (data: Int16Array) => void = () => {};

  constructor() {
    // 构造函数为空，实际初始化在connect方法中进行
  }

  /**
   * 连接麦克风并开始录制
   */
  async connect(onAudioData: (data: Int16Array) => void): Promise<void> {
    this.onAudioDataCallback = onAudioData;

    try {
      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // 创建音频上下文
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      
      // 加载音频处理器
      await this.loadAudioWorklet();

      // 创建媒体流源
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 创建音频工作节点
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        "recorder-worklet"
      );

      // 监听音频数据
      this.audioWorkletNode.port.onmessage = (event) => {
        const audioData = event.data;
        if (audioData && audioData.length > 0) {
          // 将Float32Array转换为Int16Array (PCM 16位)
          const int16Data = this.float32ToInt16(audioData);
          this.onAudioDataCallback(int16Data);
        }
      };

      // 连接音频节点
      source.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      console.log("音频录制器已连接并开始录制");
    } catch (error) {
      console.error("连接音频录制器失败:", error);
      throw error;
    }
  }

  /**
   * 停止录制并释放资源
   */
  disconnect(): void {
    try {
      // 停止媒体流
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }

      // 断开音频工作节点
      if (this.audioWorkletNode) {
        this.audioWorkletNode.disconnect();
        this.audioWorkletNode = null;
      }

      // 关闭音频上下文
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      console.log("音频录制器已断开连接");
    } catch (error) {
      console.error("断开音频录制器失败:", error);
    }
  }

  /**
   * 加载音频处理器
   */
  private async loadAudioWorklet(): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext未初始化");
    }

    // 创建内联的音频处理器代码
    const workletCode = `
      class RecorderWorklet extends AudioWorkletProcessor {
        constructor() {
          super();
          this.bufferSize = 1024;
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }

        process(inputs) {
          const input = inputs[0];
          if (input && input[0]) {
            const inputData = input[0];
            
            for (let i = 0; i < inputData.length; i++) {
              this.buffer[this.bufferIndex] = inputData[i];
              this.bufferIndex++;
              
              if (this.bufferIndex >= this.bufferSize) {
                // 发送缓冲区数据
                this.port.postMessage(new Float32Array(this.buffer));
                this.bufferIndex = 0;
              }
            }
          }
          return true;
        }
      }

      registerProcessor('recorder-worklet', RecorderWorklet);
    `;

    // 创建Blob URL
    const blob = new Blob([workletCode], { type: "application/javascript" });
    const workletUrl = URL.createObjectURL(blob);

    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } finally {
      // 清理Blob URL
      URL.revokeObjectURL(workletUrl);
    }
  }

  /**
   * 将Float32Array转换为Int16Array
   */
  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // 将浮点数(-1.0 到 1.0)转换为16位整数(-32768 到 32767)
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return int16Array;
  }
}
