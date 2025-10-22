import { useState, useRef, useEffect } from "react";
import { createVoiceInputService } from "../voice-input/index";

interface VoiceInputForEditorProps {
  editable: HTMLTextAreaElement;
  onTextUpdate: (text: string) => void;
}

export const VoiceInputForEditor = ({ 
  editable, 
  onTextUpdate 
}: VoiceInputForEditorProps) => {
  console.log("🎤 VoiceInputForEditor 组件正在渲染");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voiceServiceRef = useRef<any>(null);

  // 组件卸载时清理语音服务
  useEffect(() => {
    return () => {
      if (voiceServiceRef.current) {
        console.log("编辑器语音组件卸载，清理语音服务");
        voiceServiceRef.current.stop();
        voiceServiceRef.current = null;
      }
    };
  }, []);

  const handleVoiceToggle = async () => {
    console.log("🎤 编辑器语音按钮被点击，当前状态:", isListening);
    
    if (isListening) {
      // 停止录音
      if (voiceServiceRef.current) {
        console.log("停止编辑器语音识别");
        voiceServiceRef.current.stop();
        voiceServiceRef.current = null;
      }
      setIsListening(false);
      return;
    }

    // 清理之前的服务（如果存在）
    if (voiceServiceRef.current) {
      console.log("清理之前的编辑器语音服务");
      voiceServiceRef.current.stop();
      voiceServiceRef.current = null;
    }

    // 创建新的语音服务
    console.log("创建新的编辑器语音识别服务");
    voiceServiceRef.current = createVoiceInputService("zh-CN");
    
    if (!voiceServiceRef.current.isSupported()) {
      setError("浏览器不支持语音识别");
      return;
    }

    // 设置语音识别回调
    voiceServiceRef.current.onResult((text: string) => {
      console.log("🎯 编辑器语音识别结果:", text);
      
      if (text.trim()) {
        // 获取当前光标位置
        const cursorPosition = editable.selectionStart;
        const currentText = editable.value;
        
        // 在光标位置插入语音识别结果
        const newText = 
          currentText.slice(0, cursorPosition) + 
          text.trim() + 
          currentText.slice(cursorPosition);
        
        console.log("🎯 在编辑器中插入文本:", `"${text.trim()}"`);
        
        // 更新编辑器内容
        editable.value = newText;
        
        // 设置新的光标位置（在插入文本的末尾）
        const newCursorPosition = cursorPosition + text.trim().length;
        editable.selectionStart = newCursorPosition;
        editable.selectionEnd = newCursorPosition;
        
        // 触发输入事件，让编辑器知道内容已更改
        const inputEvent = new Event('input', { bubbles: true });
        editable.dispatchEvent(inputEvent);
        
        // 通知父组件文本已更新
        onTextUpdate(newText);
        
        console.log("✅ 编辑器文本更新成功");
      }
      
      setIsListening(false);
      setError(null);
    });

    // 实时显示临时识别结果
    voiceServiceRef.current.onInterimResult((text: string) => {
      console.log("🔄 编辑器临时识别结果:", text);
      
      if (text.trim()) {
        // 获取当前光标位置
        const cursorPosition = editable.selectionStart;
        const currentText = editable.value;
        
        // 临时显示识别结果（用不同颜色或样式标识）
        const tempText = 
          currentText.slice(0, cursorPosition) + 
          text.trim() + 
          currentText.slice(cursorPosition);
        
        // 更新编辑器内容（临时）
        editable.value = tempText;
        
        // 设置光标位置
        const newCursorPosition = cursorPosition + text.trim().length;
        editable.selectionStart = newCursorPosition;
        editable.selectionEnd = newCursorPosition;
      }
    });

    voiceServiceRef.current.onError((error: any) => {
      console.error("❌ 编辑器语音识别错误:", error);
      setError("语音识别失败");
      setIsListening(false);
    });

    voiceServiceRef.current.onEnd(() => {
      console.log("🔚 编辑器语音识别结束");
      setIsListening(false);
    });

    // 开始语音识别
    try {
      // 检查麦克风权限
      const permission = await navigator.permissions.query({ 
        name: "microphone" as PermissionName 
      });
      
      if (permission.state === "denied") {
        setError("请允许麦克风权限");
        return;
      }
      
      setError(null);
      setIsListening(true);
      console.log("🎤 开始编辑器语音识别");
      voiceServiceRef.current.start();
    } catch (error) {
      console.error("❌ 启动编辑器语音识别失败:", error);
      setError("启动失败");
      setIsListening(false);
    }
  };

  console.log("🎤 VoiceInputForEditor 正在返回JSX");
  
  return (
    <div 
      style={{ 
        position: "static",
        padding: "10px", 
        backgroundColor: "red", 
        border: "3px solid blue", 
        borderRadius: "4px",
        margin: "10px",
        width: "200px",
        height: "60px"
      }}
    >
      <div style={{ color: "white", fontWeight: "bold" }}>
        语音输入测试组件
      </div>
      <button
        onClick={handleVoiceToggle}
        style={{
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "6px 10px",
          fontSize: "12px",
          cursor: "pointer",
          marginTop: "5px"
        }}
      >
        🎤 {isListening ? "停止" : "开始"}
      </button>
      
      {error && (
        <div style={{ 
          fontSize: "10px", 
          color: "yellow", 
          marginTop: "2px"
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
