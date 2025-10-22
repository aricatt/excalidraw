import React from "react";

interface VoiceInputProps {
  elements: readonly any[];
  scene: any;
  elementsMap: any;
  appState: any;
}

export const VoiceInput = ({ elements, appState }: VoiceInputProps) => {
  console.log("🎤 VoiceInput component is rendering!");
  console.log("Elements:", elements.length);
  console.log("Selected IDs:", appState.selectedElementIds);

  return (
    <div style={{ 
      padding: "8px", 
      backgroundColor: "#f0f9ff", 
      border: "2px solid #3b82f6", 
      borderRadius: "4px",
      margin: "4px 0"
    }}>
      <button
        onClick={() => console.log("🎤 Voice button clicked!")}
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "8px 12px",
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          width: "100%",
          justifyContent: "center",
        }}
      >
        🎤
        <span>语音输入测试</span>
      </button>
      
      <div style={{ 
        fontSize: "11px", 
        color: "#666", 
        marginTop: "4px", 
        textAlign: "center" 
      }}>
        测试版本 - 元素数量: {elements.length}
      </div>
    </div>
  );
};
