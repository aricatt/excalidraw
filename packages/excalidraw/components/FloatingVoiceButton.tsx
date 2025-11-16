import React, { useState, useRef } from "react";

import { DEFAULT_VERTICAL_ALIGN } from "@excalidraw/common";
import { newTextElement } from "@excalidraw/element";

import { AliyunVoiceService } from "../voice-input/AliyunVoiceService";
import { BrowserVoiceInputService } from "../voice-input/BrowserVoiceInputService";

import type { VoiceServiceProvider } from "../voice-input/index";
import type { AppClassProperties } from "../types";

interface FloatingVoiceButtonProps {
  app: AppClassProperties;
  voiceProvider?: VoiceServiceProvider;
  selectedLanguages?: string[];
}

export const FloatingVoiceButton: React.FC<FloatingVoiceButtonProps> = ({
  app,
  voiceProvider = "aliyun",
  selectedLanguages = ["zh"],
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [allRecognizedText, setAllRecognizedText] = useState(""); // 累积所有识别结果
  const voiceServiceRef = useRef<any>(null);
  const isMouseDownRef = useRef(false);

  // 添加全局事件监听器来确保鼠标释放被捕获
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current && isListening) {
        console.log("全局鼠标释放事件触发");
        handleMouseUp();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isMouseDownRef.current && isListening) {
        console.log("全局触摸结束事件触发");
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('contextmenu', (e) => {
      if (isMouseDownRef.current) {
        e.preventDefault();
        return false;
      }
    });

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('contextmenu', (e) => {
        if (isMouseDownRef.current) {
          e.preventDefault();
          return false;
        }
      });
    };
  }, [isListening]);

  const startVoiceRecording = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setRecognizedText("");
      setInterimText("");
      setAllRecognizedText(""); // 清空累积文本

      // 1. 显示弹窗
      setShowPopup(true);

      // 2. 创建语音服务
      const VoiceService = voiceProvider === "aliyun" ? AliyunVoiceService : BrowserVoiceInputService;
      voiceServiceRef.current = voiceProvider === "aliyun" 
        ? new VoiceService(undefined, selectedLanguages)
        : new VoiceService();

      // 3. 设置语音识别回调
      voiceServiceRef.current.onResult((text: string) => {
        console.log("语音识别最终结果:", text);
        if (text.trim()) {
          setRecognizedText(text.trim());
          setInterimText(""); // 清空临时文本
          
          // 累积保存所有识别结果
          setAllRecognizedText(prev => {
            const newText = prev ? `${prev} ${text.trim()}` : text.trim();
            console.log("累积文本更新:", newText);
            return newText;
          });
        }
      });

      voiceServiceRef.current.onInterimResult((text: string) => {
        console.log("语音识别临时结果:", text);
        if (text.trim()) {
          setInterimText(text.trim());
        }
      });

      voiceServiceRef.current.onEnd(() => {
        console.log("语音识别结束，累积文本:", allRecognizedText, "当前文本:", recognizedText, "临时文本:", interimText);
        setIsListening(false);
        setIsConnecting(false);
        
        // 优先使用累积文本，然后是当前文本，最后是临时文本
        const finalText = allRecognizedText.trim() || recognizedText.trim() || interimText.trim();
        console.log("准备创建文本元素，内容:", finalText);
        
        setInterimText("");
        
        // 延迟创建文本元素，确保有内容
        setTimeout(() => {
          createTextElementWithResult(finalText);
        }, 800);
      });

      voiceServiceRef.current.onError((error: any) => {
        console.error("语音识别错误:", error);
        setError("语音识别失败");
        setIsListening(false);
        setIsConnecting(false);
        setShowPopup(false);
      });

      // 4. 检查麦克风权限并开始录音
      const permission = await navigator.permissions.query({ 
        name: "microphone" as PermissionName 
      });
      if (permission.state === "denied") {
        setError("请允许麦克风权限");
        setIsConnecting(false);
        setShowPopup(false);
        return;
      }

      await voiceServiceRef.current.start();
      setIsConnecting(false);
      setIsListening(true);

    } catch (error) {
      console.error("启动语音录入失败:", error);
      setError("启动失败");
      setIsConnecting(false);
      setIsListening(false);
      setShowPopup(false);
    }
  };

  const createTextElementWithResult = (finalText?: string) => {
    const textToUse = finalText || allRecognizedText.trim() || recognizedText.trim() || interimText.trim();
    
    console.log("创建文本元素，使用文本:", textToUse);
    
    if (!textToUse) {
      console.log("没有文本内容，跳过创建");
      setShowPopup(false);
      return;
    }

    try {
      // 1. 计算屏幕中央位置
      const canvasCenter = {
        x: app.state.scrollX + app.state.width / 2,
        y: app.state.scrollY + app.state.height / 2,
      };

      // 2. 创建文本元素
      const textElement = newTextElement({
        x: canvasCenter.x - 50,
        y: canvasCenter.y - 10,
        text: textToUse,
        fontSize: 20,
        fontFamily: 1,
        textAlign: "left" as const,
        verticalAlign: DEFAULT_VERTICAL_ALIGN,
      });

      console.log("文本元素创建成功:", textElement);

      // 3. 添加到场景
      app.scene.insertElement(textElement);

      // 4. 清理状态
      setShowPopup(false);
      setRecognizedText("");
      setInterimText("");
      setAllRecognizedText("");

      console.log("文本元素已添加到场景");

    } catch (error) {
      console.error("创建文本元素失败:", error);
      setError("创建文本失败");
      setShowPopup(false);
    }
  };

  const stopVoiceRecording = () => {
    console.log("手动停止语音录音，累积文本:", allRecognizedText, "当前文本:", recognizedText, "临时文本:", interimText);
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stop();
      voiceServiceRef.current = null;
    }
    
    setIsListening(false);
    setIsConnecting(false);
    
    // 手动停止时也要创建文本元素，优先使用累积文本
    const finalText = allRecognizedText.trim() || recognizedText.trim() || interimText.trim();
    if (finalText) {
      console.log("手动停止，准备创建文本元素:", finalText);
      setTimeout(() => {
        createTextElementWithResult(finalText);
      }, 300);
    } else {
      console.log("手动停止，没有文本内容");
      setShowPopup(false);
      setRecognizedText("");
      setInterimText("");
      setAllRecognizedText("");
    }
  };

  const handleMouseDown = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("鼠标按下，设置标记");
    isMouseDownRef.current = true;
    if (!isListening && !isConnecting) {
      startVoiceRecording();
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("鼠标释放，清除标记");
    isMouseDownRef.current = false;
    if (isListening) {
      stopVoiceRecording();
    }
  };

  // 按钮状态样式
  const getButtonStyle = () => {
    if (isConnecting) {
      return {
        background: "linear-gradient(45deg, #fbbf24, #f59e0b)",
        color: "white",
        transform: "scale(1.05)",
      };
    }
    if (isListening) {
      return {
        background: "linear-gradient(45deg, #ef4444, #dc2626)",
        color: "white",
        transform: "scale(1.1)",
        boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
      };
    }
    return {
      background: "linear-gradient(45deg, #3b82f6, #2563eb)",
      color: "white",
      transform: "scale(1)",
    };
  };

  const getButtonText = () => {
    if (isConnecting) return "连接中...";
    if (isListening) return "录音中";
    return "🎤";
  };

  return (
    <div style={{ position: "relative", marginRight: "8px" }}>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseDown();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseUp();
        }}
        onDragStart={(e) => {
          e.preventDefault();
          return false;
        }}
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: isListening 
            ? "#ef4444" 
            : isConnecting 
            ? "#fbbf24" 
            : error 
            ? "#f87171" 
            : "#3b82f6",
          color: "white",
          fontSize: "32px",
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          WebkitUserSelect: "none",
          outline: "none",
          transform: isListening ? "scale(1.1)" : "scale(1)",
          pointerEvents: "auto",
          position: "relative",
          zIndex: 10001,
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
        disabled={isConnecting}
        title={
          error 
            ? `语音输入错误: ${error}` 
            : isListening 
            ? "正在录音，松开停止" 
            : isConnecting 
            ? "正在连接..." 
            : "按住录音"
        }
      >
        {error ? "❌" : isListening ? "🎤" : isConnecting ? "⏳" : "🎤"}
      </button>
      
      {error && (
        <div
          style={{
            position: "relative",
            bottom: "55px",
            right: "0",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "10px",
            color: "#dc2626",
            whiteSpace: "nowrap",
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}

      {/* 语音识别弹窗 */}
      {showPopup && (
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
            minWidth: "320px",
            maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            zIndex: 10001,
            textAlign: "center",
            pointerEvents: "auto",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: isListening ? "#ef4444" : "#fbbf24",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                animation: isListening ? "pulse 1.5s infinite" : "none",
              }}
            >
              🎤
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
              {isConnecting ? "正在连接..." : isListening ? "正在录音" : "准备录音"}
            </h3>
            <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
              {isConnecting ? "连接语音服务中..." : "按住按钮说话，松开结束"}
            </p>
          </div>

          <div
            style={{
              minHeight: "80px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "left",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
          >
            {allRecognizedText && (
              <div style={{ color: "#111827", fontWeight: "500", marginBottom: "8px" }}>
                {allRecognizedText}
              </div>
            )}
            {recognizedText && !allRecognizedText && (
              <div style={{ color: "#111827", fontWeight: "500" }}>
                {recognizedText}
              </div>
            )}
            {interimText && (
              <div style={{ color: "#6b7280", fontStyle: "italic" }}>
                {interimText}
              </div>
            )}
            {!allRecognizedText && !recognizedText && !interimText && (
              <div style={{ color: "#9ca3af", textAlign: "center" }}>
                {isConnecting ? "准备中..." : "开始说话..."}
              </div>
            )}
          </div>

          {isListening && (
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
              松开按钮停止录音
            </div>
          )}
        </div>
      )}

      {/* 添加脉冲动画样式 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
        `}
      </style>
    </div>
  );
};
