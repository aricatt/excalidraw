import React, { useState, useRef, useEffect } from "react";
import { createVoiceInputService } from "./index";
import type { VoiceInputService } from "./VoiceInputService";

interface VoiceInputUIProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

type InputMode = "keyboard" | "voice" | "processing";

export const VoiceInputUI: React.FC<VoiceInputUIProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "输入文字...",
  disabled = false,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>("keyboard");
  const [interimText, setInterimText] = useState("");
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceServiceRef = useRef<VoiceInputService | null>(null);

  useEffect(() => {
    // 初始化语音服务
    const voiceService = createVoiceInputService("zh-CN");
    voiceServiceRef.current = voiceService;
    setIsVoiceSupported(voiceService.isSupported());

    if (voiceService.isSupported()) {
      voiceService.onResult((text: string) => {
        // 语音识别完成，添加到现有文本
        const newValue = value + text;
        onChange(newValue);
        setInterimText("");
        setInputMode("keyboard");
        
        // 重新聚焦到文本框
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      });

      voiceService.onInterimResult((text: string) => {
        // 显示临时识别结果
        setInterimText(text);
      });

      voiceService.onError((error: any) => {
        console.error("语音识别错误:", error);
        setError("语音识别失败，请重试");
        setInputMode("keyboard");
        setInterimText("");
      });

      voiceService.onEnd(() => {
        setInputMode("keyboard");
        setInterimText("");
      });
    }

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, [value, onChange]);

  const handleVoiceToggle = () => {
    if (!voiceServiceRef.current || disabled) return;

    if (inputMode === "voice") {
      // 停止语音输入
      voiceServiceRef.current.stop();
      setInputMode("keyboard");
      setInterimText("");
    } else {
      // 开始语音输入
      setError(null);
      setInputMode("voice");
      voiceServiceRef.current.start();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果正在语音输入，停止语音
    if (inputMode === "voice" && voiceServiceRef.current) {
      voiceServiceRef.current.stop();
      setInputMode("keyboard");
      setInterimText("");
    }

    // 长按空格开始语音输入
    if (e.code === "Space" && e.repeat && isVoiceSupported && inputMode === "keyboard") {
      e.preventDefault();
      handleVoiceToggle();
    }

    // Enter 提交
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const getVoiceButtonStyle = () => {
    switch (inputMode) {
      case "voice":
        return {
          color: "#ef4444", // 红色 - 正在监听
          animation: "pulse 1.5s infinite",
        };
      case "processing":
        return {
          color: "#3b82f6", // 蓝色 - 处理中
        };
      default:
        return {
          color: isVoiceSupported ? "#6b7280" : "#d1d5db", // 灰色 - 可用/不可用
        };
    }
  };

  const getStatusText = () => {
    switch (inputMode) {
      case "voice":
        return "正在监听... (点击停止或开始打字)";
      case "processing":
        return "处理中...";
      default:
        return isVoiceSupported ? "点击麦克风或长按空格进行语音输入" : "浏览器不支持语音输入";
    }
  };

  const displayValue = inputMode === "voice" && interimText 
    ? value + interimText 
    : value;

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
  };

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: "60px",
    padding: "8px 40px 8px 8px",
    border: `1px solid ${inputMode === "voice" ? "#f59e0b" : "#d1d5db"}`,
    borderRadius: "4px",
    fontFamily: "inherit",
    fontSize: "14px",
    resize: "vertical",
    transition: "all 0.2s ease",
    opacity: inputMode === "voice" ? 0.7 : 1,
    backgroundColor: inputMode === "voice" ? "#fef3c7" : "transparent",
    outline: "none",
    boxShadow: inputMode === "voice" 
      ? "0 0 0 2px rgba(245, 158, 11, 0.1)" 
      : "none",
  };

  const buttonStyle: React.CSSProperties = {
    position: "absolute",
    right: "8px",
    top: "8px",
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "4px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.5 : 1,
    ...getVoiceButtonStyle(),
  };

  const statusBarStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
    fontSize: "12px",
  };

  const statusTextStyle: React.CSSProperties = {
    color: "#6b7280",
  };

  const errorTextStyle: React.CSSProperties = {
    color: "#ef4444",
    fontWeight: 500,
  };

  const previewStyle: React.CSSProperties = {
    marginTop: "4px",
    padding: "4px 8px",
    backgroundColor: "#f3f4f6",
    borderRadius: "4px",
    fontSize: "12px",
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || inputMode === "voice"}
          style={textareaStyle}
        />
        
        {isVoiceSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={disabled}
            style={buttonStyle}
            title={inputMode === "voice" ? "停止语音输入" : "开始语音输入"}
          >
            🎤
          </button>
        )}
      </div>

      {/* 状态提示 */}
      <div style={statusBarStyle}>
        <span style={statusTextStyle}>{getStatusText()}</span>
        {error && (
          <span style={errorTextStyle}>
            {error}
          </span>
        )}
      </div>

      {/* 临时识别结果预览 */}
      {interimText && inputMode === "voice" && (
        <div style={previewStyle}>
          <span style={{ color: "#6b7280", fontStyle: "italic" }}>
            识别中: "{interimText}"
          </span>
        </div>
      )}
    </div>
  );
};
