import React, { useState, useRef, useCallback } from "react";
import { createVoiceInputService } from "./index";
import type { VoiceInputService } from "./VoiceInputService";

interface SimpleVoiceInputProps {
  onVoiceResult: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export const SimpleVoiceInput: React.FC<SimpleVoiceInputProps> = ({
  onVoiceResult,
  disabled = false,
  language = "zh-CN",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const voiceServiceRef = useRef<VoiceInputService | null>(null);

  // 初始化语音服务
  const initVoiceService = useCallback(() => {
    if (voiceServiceRef.current) return voiceServiceRef.current;

    const service = createVoiceInputService(language);
    
    if (!service.isSupported()) {
      setIsSupported(false);
      return null;
    }

    service.onResult((text: string) => {
      if (text.trim()) {
        onVoiceResult(text.trim());
      }
      setIsListening(false);
      setInterimText("");
      setError(null);
    });

    service.onInterimResult((text: string) => {
      setInterimText(text);
    });

    service.onError((error: any) => {
      console.error("语音识别错误:", error);
      setError("语音识别失败");
      setIsListening(false);
      setInterimText("");
    });

    service.onEnd(() => {
      setIsListening(false);
      setInterimText("");
    });

    voiceServiceRef.current = service;
    return service;
  }, [language, onVoiceResult]);

  const handleVoiceToggle = useCallback(() => {
    if (disabled || !isSupported) return;

    const service = initVoiceService();
    if (!service) return;

    if (isListening) {
      service.stop();
      setIsListening(false);
      setInterimText("");
    } else {
      setError(null);
      setIsListening(true);
      service.start();
    }
  }, [disabled, isSupported, isListening, initVoiceService]);

  // 清理
  React.useEffect(() => {
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return null; // 不支持语音时隐藏按钮
  }

  const containerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
  };

  const buttonStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    padding: "6px 8px",
    fontSize: "16px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    color: isListening ? "#ef4444" : "#6b7280",
    borderColor: isListening ? "#ef4444" : "#d1d5db",
    backgroundColor: isListening ? "#fef2f2" : "transparent",
    opacity: disabled ? 0.5 : 1,
  };

  const statusStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: "0",
    marginTop: "4px",
    padding: "8px 12px",
    background: "white",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    whiteSpace: "nowrap",
    zIndex: 1000,
  };

  const indicatorStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: 500,
  };

  const dotStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    animation: "pulse 1.5s infinite",
  };

  const interimStyle: React.CSSProperties = {
    marginTop: "4px",
    fontSize: "11px",
    color: "#6b7280",
    fontStyle: "italic",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const errorStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: "0",
    marginTop: "4px",
    padding: "6px 8px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    color: "#dc2626",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    zIndex: 1000,
  };

  const closeStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0",
    lineHeight: 1,
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={handleVoiceToggle}
        disabled={disabled}
        style={buttonStyle}
        title={isListening ? "点击停止语音输入" : "点击开始语音输入"}
      >
        🎤
      </button>
      
      {/* 状态指示器 */}
      {isListening && (
        <div style={statusStyle}>
          <div style={indicatorStyle}>
            <span style={dotStyle}></span>
            正在监听...
          </div>
          {interimText && (
            <div style={interimStyle}>"{interimText}"</div>
          )}
        </div>
      )}

      {error && (
        <div style={errorStyle}>
          {error}
          <button onClick={() => setError(null)} style={closeStyle}>×</button>
        </div>
      )}
    </div>
  );
};
