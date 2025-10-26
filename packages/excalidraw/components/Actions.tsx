import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";

import {
  CLASSES,
  KEYS,
  capitalizeString,
  isTransparent,
} from "@excalidraw/common";

import {
  shouldAllowVerticalAlign,
  suppportsHorizontalAlign,
  hasBoundTextElement,
  isElbowArrow,
  isImageElement,
  isLinearElement,
  isTextElement,
  isArrowElement,
  hasStrokeColor,
  toolIsArrow,
} from "@excalidraw/element";

import { 
  createVoiceInputService, 
  type VoiceServiceProvider,
  type VoiceServiceConfig 
} from "../voice-input/index";

import type {
  ExcalidrawElement,
  ExcalidrawElementType,
  NonDeletedElementsMap,
  NonDeletedSceneElementsMap,
} from "@excalidraw/element/types";

import { actionToggleZenMode } from "../actions";

import { alignActionsPredicate } from "../actions/actionAlign";
import { trackEvent } from "../analytics";
import { useTunnels } from "../context/tunnels";

import { t } from "../i18n";
import {
  canChangeRoundness,
  canHaveArrowheads,
  getTargetElements,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
} from "../scene";

import { getFormValue } from "../actions/actionProperties";

import { useTextEditorFocus } from "../hooks/useTextEditorFocus";

import { getToolbarTools } from "./shapes";

import "./Actions.scss";

import { useDevice, useExcalidrawContainer } from "./App";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { ToolPopover } from "./ToolPopover";
import { Tooltip } from "./Tooltip";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import { PropertiesPopover } from "./PropertiesPopover";
import {
  EmbedIcon,
  extraToolsIcon,
  frameToolIcon,
  mermaidLogoIcon,
  laserPointerToolIcon,
  MagicIcon,
  LassoIcon,
  sharpArrowIcon,
  roundArrowIcon,
  elbowArrowIcon,
  TextSizeIcon,
  adjustmentsIcon,
  DotsHorizontalIcon,
  SelectionIcon,
} from "./icons";

import { Island } from "./Island";

import type {
  AppClassProperties,
  AppProps,
  UIAppState,
  Zoom,
  AppState,
} from "../types";
import type { ActionManager } from "../actions/manager";

/**
 * 格式化长句子：在每30个字符后的逗号后添加换行符
 * @param text 原始文本
 * @returns 格式化后的文本
 */
const formatLongSentence = (text: string): string => {
  if (text.length <= 30) {
    return text; // 短句子不需要处理
  }
  
  let result = "";
  let charCount = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += char;
    charCount++;
    
    // 如果遇到逗号且已经超过30个字符，添加换行符
    if ((char === "，" || char === ",") && charCount >= 30) {
      result += "\n";
      charCount = 0; // 重置计数器
    }
  }
  
  return result;
};

// Common CSS class combinations
const PROPERTIES_CLASSES = clsx([
  CLASSES.SHAPE_ACTIONS_THEME_SCOPE,
  "properties-content",
]);

export const canChangeStrokeColor = (
  appState: UIAppState,
  targetElements: ExcalidrawElement[],
) => {
  let commonSelectedType: ExcalidrawElementType | null =
    targetElements[0]?.type || null;

  for (const element of targetElements) {
    if (element.type !== commonSelectedType) {
      commonSelectedType = null;
      break;
    }
  }

  return (
    (hasStrokeColor(appState.activeTool.type) &&
      commonSelectedType !== "image" &&
      commonSelectedType !== "frame" &&
      commonSelectedType !== "magicframe") ||
    targetElements.some((element) => hasStrokeColor(element.type))
  );
};

export const canChangeBackgroundColor = (
  appState: UIAppState,
  targetElements: ExcalidrawElement[],
) => {
  return (
    hasBackground(appState.activeTool.type) ||
    targetElements.some((element) => hasBackground(element.type))
  );
};

// 语音输入按钮组件
const VoiceInputButton = ({ 
  targetElements, 
  app,
  isInEditMode
}: { 
  targetElements: readonly ExcalidrawElement[];
  app: AppClassProperties;
  isInEditMode: boolean;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [voiceProvider, setVoiceProvider] = useState<VoiceServiceProvider>("aliyun");
  const voiceServiceRef = useRef<any>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterimResultRef = useRef<string>(""); // 保存最后的临时识别结果

  // 组件卸载时清理语音服务和倒计时
  useEffect(() => {
    return () => {
      if (voiceServiceRef.current) {
        console.log("语音组件卸载，清理语音服务");
        voiceServiceRef.current.stop();
        voiceServiceRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  // 监听编辑模式变化，退出编辑模式时停止语音输入
  useEffect(() => {
    if (!isInEditMode && isListening) {
      console.log("退出编辑模式，停止语音输入");
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
        voiceServiceRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setIsListening(false);
      setError(null);
      setCountdown(0);
    }
  }, [isInEditMode, isListening]);

  // 启动倒计时
  const startCountdown = () => {
    setCountdown(30);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 倒计时结束，先保存最后的临时结果，然后停止录音
          console.log("⏰ 倒计时结束，保存临时结果并停止录音");
          handleTimeoutWithSave();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 延长倒计时
  const extendCountdown = (additionalSeconds: number) => {
    setCountdown((prev) => prev + additionalSeconds);
  };

  // 停止倒计时
  const stopCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
  };

  // 倒计时结束时的处理函数 - 先保存临时结果再停止
  const handleTimeoutWithSave = () => {
    // 如果有临时识别结果，先保存它
    if (lastInterimResultRef.current && lastInterimResultRef.current.trim()) {
      console.log("💾 倒计时结束，保存最后的临时结果:", lastInterimResultRef.current);
      
      // 使用临时结果作为最终结果进行保存
      const tempResult = lastInterimResultRef.current.trim();
      
      if (isInEditMode) {
        // 在编辑模式下保存到文本编辑器
        const textEditor = document.querySelector('.excalidraw-textEditorContainer textarea') as HTMLTextAreaElement;
        if (textEditor) {
          let voiceText = formatLongSentence(tempResult);
          const currentPosition = textEditor.selectionStart;
          const currentText = textEditor.value;
          
          const isCompleteSentence = /[。！？.!?]$/.test(voiceText);
          const needSeparator = currentPosition > 0 && 
                               currentText[currentPosition - 1] !== " " && 
                               currentText[currentPosition - 1] !== "\n";
          
          const separator = needSeparator ? " " : "";
          const suffix = isCompleteSentence ? "\n" : "";
          
          const beforeText = currentText.slice(0, currentPosition);
          const afterText = currentText.slice(currentPosition);
          const newText = beforeText + separator + voiceText + suffix + afterText;
          
          textEditor.value = newText;
          const newCursorPosition = currentPosition + separator.length + voiceText.length + suffix.length;
          textEditor.selectionStart = newCursorPosition;
          textEditor.selectionEnd = newCursorPosition;
          
          const inputEvent = new Event('input', { bubbles: true });
          textEditor.dispatchEvent(inputEvent);
          
          console.log("💾 临时结果已保存到编辑器");
        }
      }
      
      // 清理临时结果
      lastInterimResultRef.current = "";
    }
    
    // 然后正常停止录音
    handleStopRecording();
  };

  // 停止录音的通用函数
  const handleStopRecording = () => {
    if (voiceServiceRef.current) {
      console.log("停止语音识别");
      voiceServiceRef.current.stop();
      voiceServiceRef.current = null;
    }
    setIsListening(false);
    stopCountdown();
  };

  const handleVoiceToggle = async () => {
    console.log("🎤 语音按钮被点击，当前状态:", isListening, "编辑模式:", isInEditMode);
    
    // 如果不在编辑模式，不允许使用语音输入
    if (!isInEditMode) {
      setError("请先进入文本编辑模式");
      return;
    }
    
    if (isListening) {
      // 停止录音
      handleStopRecording();
      return;
    }

    // 清理之前的服务（如果存在）
    if (voiceServiceRef.current) {
      console.log("清理之前的语音服务");
      voiceServiceRef.current.stop();
      voiceServiceRef.current = null;
    }

    // 每次都创建新的语音服务，避免缓存问题
    console.log("创建新的语音识别服务，提供商:", voiceProvider);
    voiceServiceRef.current = createVoiceInputService({
      provider: voiceProvider,
      lang: "zh-CN",
      backendUrl: "https://192.168.31.244:4408" // 手动指定HTTPS后端URL
    });
    
    if (!voiceServiceRef.current.isSupported()) {
      setError("浏览器不支持语音识别");
      return;
    }

    // 设置语音识别回调 - 处理最终确认的句子
    voiceServiceRef.current.onResult((text: string) => {
      console.log("🎯 语音识别最终结果:", text);
      
      if (text.trim()) {
        // 如果在编辑模式，追加文本到编辑器
        if (isInEditMode) {
          console.log("🎯 在编辑模式下，追加最终句子");
          
          // 查找当前的文本编辑器
          const textEditor = document.querySelector('.excalidraw-textEditorContainer textarea') as HTMLTextAreaElement;
          if (textEditor) {
            let voiceText = text.trim();
            
            // 对长句子进行自动换行处理：每30个字符后的逗号后添加换行
            voiceText = formatLongSentence(voiceText);
            
            // 获取当前光标位置，在此位置追加新句子
            const currentPosition = textEditor.selectionStart;
            const currentText = textEditor.value;
            
            // 检查语音文本是否以句子结束符结尾
            const isCompleteSentence = /[。！？.!?]$/.test(voiceText);
            
            // 检查是否需要添加分隔符
            const needSeparator = currentPosition > 0 && 
                                 currentText[currentPosition - 1] !== ' ' && 
                                 currentText[currentPosition - 1] !== '\n';
            
            // 根据情况选择分隔符：完整句子用换行，否则用空格
            let separator = '';
            if (needSeparator) {
              separator = ' '; // 默认用空格
            }
            
            // 如果是完整句子，在末尾添加换行符
            const suffix = isCompleteSentence ? '\n' : '';
            
            const beforeText = currentText.slice(0, currentPosition);
            const afterText = currentText.slice(currentPosition);
            const newText = beforeText + separator + voiceText + suffix + afterText;
            
            console.log("🎯 追加句子:", `"${voiceText}"`, "到位置:", currentPosition, 
                       isCompleteSentence ? "(完整句子，添加换行)" : "(非完整句子)",
                       voiceText.includes('\n') ? "(包含长句换行)" : "");
            
            // 更新编辑器内容
            textEditor.value = newText;
            
            // 设置新的光标位置到追加文本的末尾
            // 如果是完整句子，光标应该在换行符之后
            const newCursorPosition = currentPosition + separator.length + voiceText.length + suffix.length;
            textEditor.selectionStart = newCursorPosition;
            textEditor.selectionEnd = newCursorPosition;
            
            // 清理任何临时数据
            delete textEditor.dataset.voiceStartPosition;
            delete textEditor.dataset.voiceOriginalText;
            
            // 触发输入事件，让编辑器知道内容已更改
            const inputEvent = new Event('input', { bubbles: true });
            textEditor.dispatchEvent(inputEvent);
            
            console.log("✅ 最终文本更新成功");
          } else {
            console.log("❌ 没有找到文本编辑器");
          }
        } else {
          // 非编辑模式，更新元素（原来的逻辑）
          const currentSelectedElements = app.scene.getSelectedElements(app.state);
          const textElements = currentSelectedElements.filter(isTextElement);
          console.log("🎯 当前选中的文本元素:", textElements.length);
          
          if (textElements.length > 0) {
            textElements.forEach((element) => {
              const currentText = element.originalText || element.text || "";
              const newText = currentText + (currentText ? " " : "") + text.trim();
              console.log("🎯 更新文本:", `"${currentText}"`, "->", `"${newText}"`);
              
              try {
                app.scene.mutateElement(element, {
                  originalText: newText,
                });
                
                app.scene.triggerUpdate();
                console.log("✅ 文本更新成功");
              } catch (error) {
                console.error("❌ 文本更新失败:", error);
              }
            });
          } else {
            console.log("❌ 没有找到选中的文本元素");
          }
        }
      }
      
      // 不要在这里重置按钮状态，因为语音识别还在继续
      // setIsListening(false); // 删除这行
      setError(null);
    });

    voiceServiceRef.current.onInterimResult((text: string) => {
      console.log("🔄 临时识别结果:", text);
      
      // 保存最后的临时识别结果，用于倒计时结束时的紧急保存
      if (text.trim()) {
        lastInterimResultRef.current = text.trim();
        console.log("🔄 正在识别句子:", text.trim());
        
        // 如果倒计时剩余时间少于3秒且有临时结果，延长倒计时
        if (countdown > 0 && countdown <= 3 && text.trim().length > 0) {
          console.log("⏰ 检测到用户还在说话，延长倒计时10秒");
          extendCountdown(10);
        }
      }
    });

    voiceServiceRef.current.onError((error: any) => {
      console.error("❌ 语音识别错误:", error);
      
      // 只有严重错误才停止语音输入，临时错误不影响按钮状态
      if (error === "not-allowed" || error === "service-not-allowed") {
        setError("请允许麦克风权限");
        setIsListening(false);
      } else {
        // 其他错误（如网络错误、超时等）只显示错误信息，不重置按钮状态
        setError(`语音识别错误: ${error}`);
        console.log("临时错误，保持语音输入状态");
      }
    });

    voiceServiceRef.current.onEnd(() => {
      console.log("🔚 语音识别手动结束");
      
      // 清理临时数据
      const textEditor = document.querySelector('.excalidraw-textEditorContainer textarea') as HTMLTextAreaElement;
      if (textEditor) {
        delete textEditor.dataset.voiceStartPosition;
        delete textEditor.dataset.voiceOriginalText;
      }
      
      // 只有手动停止时才更新UI状态
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
      console.log("🎤 开始语音识别");
      voiceServiceRef.current.start();
      
      // 启动30秒倒计时
      startCountdown();
    } catch (error) {
      console.error("❌ 启动语音识别失败:", error);
      setError("启动失败");
      setIsListening(false);
    }
  };

  return (
    <div style={{ 
      padding: "4px", 
      backgroundColor: isListening ? "#fef2f2" : "#f9fafb", 
      border: `1px solid ${isListening ? "#ef4444" : "#d1d5db"}`, 
      borderRadius: "4px",
      margin: "4px 0"
    }}>
      {/* 语音服务提供商选择器 */}
      <div style={{ marginBottom: "8px" }}>
        <label style={{ 
          fontSize: "10px", 
          color: "#6b7280", 
          display: "block", 
          marginBottom: "2px" 
        }}>
          语音服务:
        </label>
        <select
          value={voiceProvider}
          onChange={(e) => setVoiceProvider(e.target.value as VoiceServiceProvider)}
          disabled={isListening}
          style={{
            width: "100%",
            padding: "2px 4px",
            fontSize: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "2px",
            backgroundColor: isListening ? "#f3f4f6" : "white",
            cursor: isListening ? "not-allowed" : "pointer"
          }}
        >
          <option value="aliyun">阿里云 (更准确)</option>
          <option value="browser">浏览器原生 (免费)</option>
        </select>
      </div>
      
      <button
        onClick={handleVoiceToggle}
        disabled={!isInEditMode && !isListening}
        style={{
          background: isListening 
            ? "#ef4444" 
            : isInEditMode 
              ? "#6b7280" 
              : "#9ca3af",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "6px 10px",
          fontSize: "12px",
          cursor: isInEditMode || isListening ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          width: "100%",
          justifyContent: "center",
          opacity: isInEditMode || isListening ? 1 : 0.6,
        }}
        title={
          isListening 
            ? "点击停止语音输入" 
            : isInEditMode 
              ? "点击开始语音输入" 
              : "请先进入文本编辑模式"
        }
      >
        🎤
        <span>
          {isListening 
            ? `停止录音 (${countdown}s)` 
            : isInEditMode 
              ? "语音输入" 
              : "语音输入(禁用)"
          }
        </span>
      </button>
      
      {error && (
        <div style={{ 
          fontSize: "10px", 
          color: "#ef4444", 
          marginTop: "2px", 
          textAlign: "center" 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export const SelectedShapeActions = ({
  appState,
  elementsMap,
  renderAction,
  app,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
  app: AppClassProperties;
}) => {
  const targetElements = getTargetElements(elementsMap, appState);

  let isSingleElementBoundContainer = false;
  if (
    targetElements.length === 2 &&
    (hasBoundTextElement(targetElements[0]) ||
      hasBoundTextElement(targetElements[1]))
  ) {
    isSingleElementBoundContainer = true;
  }
  const isEditingTextOrNewElement = Boolean(
    appState.editingTextElement || appState.newElement,
  );
  const device = useDevice();
  const isRTL = document.documentElement.getAttribute("dir") === "rtl";

  const showFillIcons =
    (hasBackground(appState.activeTool.type) &&
      !isTransparent(appState.currentItemBackgroundColor)) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );

  const showLinkIcon =
    targetElements.length === 1 || isSingleElementBoundContainer;

  const showLineEditorAction =
    !appState.selectedLinearElement?.isEditing &&
    targetElements.length === 1 &&
    isLinearElement(targetElements[0]) &&
    !isElbowArrow(targetElements[0]);

  const showCropEditorAction =
    !appState.croppingElementId &&
    targetElements.length === 1 &&
    isImageElement(targetElements[0]);

  const showAlignActions =
    !isSingleElementBoundContainer && alignActionsPredicate(appState, app);

  return (
    <div className="selected-shape-actions">
      <div>
        {canChangeStrokeColor(appState, targetElements) &&
          renderAction("changeStrokeColor")}
      </div>
      {canChangeBackgroundColor(appState, targetElements) && (
        <div>{renderAction("changeBackgroundColor")}</div>
      )}
      {showFillIcons && renderAction("changeFillStyle")}

      {(hasStrokeWidth(appState.activeTool.type) ||
        targetElements.some((element) => hasStrokeWidth(element.type))) &&
        renderAction("changeStrokeWidth")}

      {(appState.activeTool.type === "freedraw" ||
        targetElements.some((element) => element.type === "freedraw")) &&
        renderAction("changeStrokeShape")}

      {(hasStrokeStyle(appState.activeTool.type) ||
        targetElements.some((element) => hasStrokeStyle(element.type))) && (
        <>
          {renderAction("changeStrokeStyle")}
          {renderAction("changeSloppiness")}
        </>
      )}

      {(canChangeRoundness(appState.activeTool.type) ||
        targetElements.some((element) => canChangeRoundness(element.type))) && (
        <>{renderAction("changeRoundness")}</>
      )}

      {(toolIsArrow(appState.activeTool.type) ||
        targetElements.some((element) => toolIsArrow(element.type))) && (
        <>{renderAction("changeArrowType")}</>
      )}

      {(appState.activeTool.type === "text" ||
        targetElements.some(isTextElement)) && (
        <>
          {renderAction("changeFontFamily")}
          {renderAction("changeFontSize")}
          {(appState.activeTool.type === "text" ||
            suppportsHorizontalAlign(targetElements, elementsMap)) &&
            renderAction("changeTextAlign")}
          
          {/* 语音输入按钮 - 只在有文本元素时显示 */}
          <VoiceInputButton 
            targetElements={targetElements}
            app={app}
            isInEditMode={appState.editingTextElement !== null}
          />
        </>
      )}

      {shouldAllowVerticalAlign(targetElements, elementsMap) &&
        renderAction("changeVerticalAlign")}
      {(canHaveArrowheads(appState.activeTool.type) ||
        targetElements.some((element) => canHaveArrowheads(element.type))) && (
        <>{renderAction("changeArrowhead")}</>
      )}

      {renderAction("changeOpacity")}

      <fieldset>
        <legend>{t("labels.layers")}</legend>
        <div className="buttonList">
          {renderAction("sendToBack")}
          {renderAction("sendBackward")}
          {renderAction("bringForward")}
          {renderAction("bringToFront")}
        </div>
      </fieldset>

      {showAlignActions && !isSingleElementBoundContainer && (
        <fieldset>
          <legend>{t("labels.align")}</legend>
          <div className="buttonList">
            {
              // swap this order for RTL so the button positions always match their action
              // (i.e. the leftmost button aligns left)
            }
            {isRTL ? (
              <>
                {renderAction("alignRight")}
                {renderAction("alignHorizontallyCentered")}
                {renderAction("alignLeft")}
              </>
            ) : (
              <>
                {renderAction("alignLeft")}
                {renderAction("alignHorizontallyCentered")}
                {renderAction("alignRight")}
              </>
            )}
            {targetElements.length > 2 &&
              renderAction("distributeHorizontally")}
            {/* breaks the row ˇˇ */}
            <div style={{ flexBasis: "100%", height: 0 }} />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".5rem",
                marginTop: "-0.5rem",
              }}
            >
              {renderAction("alignTop")}
              {renderAction("alignVerticallyCentered")}
              {renderAction("alignBottom")}
              {targetElements.length > 2 &&
                renderAction("distributeVertically")}
            </div>
          </div>
        </fieldset>
      )}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <fieldset>
          <legend>{t("labels.actions")}</legend>
          <div className="buttonList">
            {!device.editor.isMobile && renderAction("duplicateSelection")}
            {!device.editor.isMobile && renderAction("deleteSelectedElements")}
            {renderAction("group")}
            {renderAction("ungroup")}
            {showLinkIcon && renderAction("hyperlink")}
            {showCropEditorAction && renderAction("cropEditor")}
            {showLineEditorAction && renderAction("toggleLinearEditor")}
          </div>
        </fieldset>
      )}
    </div>
  );
};

const CombinedShapeProperties = ({
  appState,
  renderAction,
  setAppState,
  targetElements,
  container,
}: {
  targetElements: ExcalidrawElement[];
  appState: UIAppState;
  renderAction: ActionManager["renderAction"];
  setAppState: React.Component<any, AppState>["setState"];
  container: HTMLDivElement | null;
}) => {
  const showFillIcons =
    (hasBackground(appState.activeTool.type) &&
      !isTransparent(appState.currentItemBackgroundColor)) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );

  const shouldShowCombinedProperties =
    targetElements.length > 0 ||
    (appState.activeTool.type !== "selection" &&
      appState.activeTool.type !== "eraser" &&
      appState.activeTool.type !== "hand" &&
      appState.activeTool.type !== "laser" &&
      appState.activeTool.type !== "lasso");
  const isOpen = appState.openPopup === "compactStrokeStyles";

  if (!shouldShowCombinedProperties) {
    return null;
  }

  return (
    <div className="compact-action-item">
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            setAppState({ openPopup: "compactStrokeStyles" });
          } else {
            setAppState({ openPopup: null });
          }
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className={clsx("compact-action-button properties-trigger", {
              active: isOpen,
            })}
            title={t("labels.stroke")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setAppState({
                openPopup: isOpen ? null : "compactStrokeStyles",
              });
            }}
          >
            {adjustmentsIcon}
          </button>
        </Popover.Trigger>
        {isOpen && (
          <PropertiesPopover
            className={PROPERTIES_CLASSES}
            container={container}
            style={{ maxWidth: "13rem" }}
            onClose={() => {}}
          >
            <div className="selected-shape-actions">
              {showFillIcons && renderAction("changeFillStyle")}
              {(hasStrokeWidth(appState.activeTool.type) ||
                targetElements.some((element) =>
                  hasStrokeWidth(element.type),
                )) &&
                renderAction("changeStrokeWidth")}
              {(hasStrokeStyle(appState.activeTool.type) ||
                targetElements.some((element) =>
                  hasStrokeStyle(element.type),
                )) && (
                <>
                  {renderAction("changeStrokeStyle")}
                  {renderAction("changeSloppiness")}
                </>
              )}
              {(canChangeRoundness(appState.activeTool.type) ||
                targetElements.some((element) =>
                  canChangeRoundness(element.type),
                )) &&
                renderAction("changeRoundness")}
              {renderAction("changeOpacity")}
            </div>
          </PropertiesPopover>
        )}
      </Popover.Root>
    </div>
  );
};

const CombinedArrowProperties = ({
  appState,
  renderAction,
  setAppState,
  targetElements,
  container,
  app,
}: {
  targetElements: ExcalidrawElement[];
  appState: UIAppState;
  renderAction: ActionManager["renderAction"];
  setAppState: React.Component<any, AppState>["setState"];
  container: HTMLDivElement | null;
  app: AppClassProperties;
}) => {
  const showShowArrowProperties =
    toolIsArrow(appState.activeTool.type) ||
    targetElements.some((element) => toolIsArrow(element.type));
  const isOpen = appState.openPopup === "compactArrowProperties";

  if (!showShowArrowProperties) {
    return null;
  }

  return (
    <div className="compact-action-item">
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            setAppState({ openPopup: "compactArrowProperties" });
          } else {
            setAppState({ openPopup: null });
          }
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className={clsx("compact-action-button properties-trigger", {
              active: isOpen,
            })}
            title={t("labels.arrowtypes")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setAppState({
                openPopup: isOpen ? null : "compactArrowProperties",
              });
            }}
          >
            {(() => {
              // Show an icon based on the current arrow type
              const arrowType = getFormValue(
                targetElements,
                app,
                (element) => {
                  if (isArrowElement(element)) {
                    return element.elbowed
                      ? "elbow"
                      : element.roundness
                      ? "round"
                      : "sharp";
                  }
                  return null;
                },
                (element) => isArrowElement(element),
                (hasSelection) =>
                  hasSelection ? null : appState.currentItemArrowType,
              );

              if (arrowType === "elbow") {
                return elbowArrowIcon;
              }
              if (arrowType === "round") {
                return roundArrowIcon;
              }
              return sharpArrowIcon;
            })()}
          </button>
        </Popover.Trigger>
        {isOpen && (
          <PropertiesPopover
            container={container}
            className="properties-content"
            style={{ maxWidth: "13rem" }}
            onClose={() => {}}
          >
            {renderAction("changeArrowProperties")}
          </PropertiesPopover>
        )}
      </Popover.Root>
    </div>
  );
};

const CombinedTextProperties = ({
  appState,
  renderAction,
  setAppState,
  targetElements,
  container,
  elementsMap,
}: {
  appState: UIAppState;
  renderAction: ActionManager["renderAction"];
  setAppState: React.Component<any, AppState>["setState"];
  targetElements: ExcalidrawElement[];
  container: HTMLDivElement | null;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
}) => {
  const { saveCaretPosition, restoreCaretPosition } = useTextEditorFocus();
  const isOpen = appState.openPopup === "compactTextProperties";

  return (
    <div className="compact-action-item">
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            if (appState.editingTextElement) {
              saveCaretPosition();
            }
            setAppState({ openPopup: "compactTextProperties" });
          } else {
            setAppState({ openPopup: null });
            if (appState.editingTextElement) {
              restoreCaretPosition();
            }
          }
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className={clsx("compact-action-button properties-trigger", {
              active: isOpen,
            })}
            title={t("labels.textAlign")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (isOpen) {
                setAppState({ openPopup: null });
              } else {
                if (appState.editingTextElement) {
                  saveCaretPosition();
                }
                setAppState({ openPopup: "compactTextProperties" });
              }
            }}
          >
            {TextSizeIcon}
          </button>
        </Popover.Trigger>
        {appState.openPopup === "compactTextProperties" && (
          <PropertiesPopover
            className={PROPERTIES_CLASSES}
            container={container}
            style={{ maxWidth: "13rem" }}
            // Improve focus handling for text editing scenarios
            preventAutoFocusOnTouch={!!appState.editingTextElement}
            onClose={() => {
              // Refocus text editor when popover closes with caret restoration
              if (appState.editingTextElement) {
                restoreCaretPosition();
              }
            }}
          >
            <div className="selected-shape-actions">
              {(appState.activeTool.type === "text" ||
                targetElements.some(isTextElement)) &&
                renderAction("changeFontSize")}
              {(appState.activeTool.type === "text" ||
                suppportsHorizontalAlign(targetElements, elementsMap)) &&
                renderAction("changeTextAlign")}
              {shouldAllowVerticalAlign(targetElements, elementsMap) &&
                renderAction("changeVerticalAlign")}
            </div>
          </PropertiesPopover>
        )}
      </Popover.Root>
    </div>
  );
};

const CombinedExtraActions = ({
  appState,
  renderAction,
  targetElements,
  setAppState,
  container,
  app,
  showDuplicate,
  showDelete,
}: {
  appState: UIAppState;
  targetElements: ExcalidrawElement[];
  renderAction: ActionManager["renderAction"];
  setAppState: React.Component<any, AppState>["setState"];
  container: HTMLDivElement | null;
  app: AppClassProperties;
  showDuplicate?: boolean;
  showDelete?: boolean;
}) => {
  const isEditingTextOrNewElement = Boolean(
    appState.editingTextElement || appState.newElement,
  );
  const showCropEditorAction =
    !appState.croppingElementId &&
    targetElements.length === 1 &&
    isImageElement(targetElements[0]);
  const showLinkIcon = targetElements.length === 1;
  const showAlignActions = alignActionsPredicate(appState, app);
  let isSingleElementBoundContainer = false;
  if (
    targetElements.length === 2 &&
    (hasBoundTextElement(targetElements[0]) ||
      hasBoundTextElement(targetElements[1]))
  ) {
    isSingleElementBoundContainer = true;
  }

  const isRTL = document.documentElement.getAttribute("dir") === "rtl";
  const isOpen = appState.openPopup === "compactOtherProperties";

  if (isEditingTextOrNewElement || targetElements.length === 0) {
    return null;
  }

  return (
    <div className="compact-action-item">
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            setAppState({ openPopup: "compactOtherProperties" });
          } else {
            setAppState({ openPopup: null });
          }
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className={clsx("compact-action-button properties-trigger", {
              active: isOpen,
            })}
            title={t("labels.actions")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAppState({
                openPopup: isOpen ? null : "compactOtherProperties",
              });
            }}
          >
            {DotsHorizontalIcon}
          </button>
        </Popover.Trigger>
        {isOpen && (
          <PropertiesPopover
            className={PROPERTIES_CLASSES}
            container={container}
            style={{
              maxWidth: "12rem",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClose={() => {}}
          >
            <div className="selected-shape-actions">
              <fieldset>
                <legend>{t("labels.layers")}</legend>
                <div className="buttonList">
                  {renderAction("sendToBack")}
                  {renderAction("sendBackward")}
                  {renderAction("bringForward")}
                  {renderAction("bringToFront")}
                </div>
              </fieldset>

              {showAlignActions && !isSingleElementBoundContainer && (
                <fieldset>
                  <legend>{t("labels.align")}</legend>
                  <div className="buttonList">
                    {isRTL ? (
                      <>
                        {renderAction("alignRight")}
                        {renderAction("alignHorizontallyCentered")}
                        {renderAction("alignLeft")}
                      </>
                    ) : (
                      <>
                        {renderAction("alignLeft")}
                        {renderAction("alignHorizontallyCentered")}
                        {renderAction("alignRight")}
                      </>
                    )}
                    {targetElements.length > 2 &&
                      renderAction("distributeHorizontally")}
                    {/* breaks the row ˇˇ */}
                    <div style={{ flexBasis: "100%", height: 0 }} />
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: ".5rem",
                        marginTop: "-0.5rem",
                      }}
                    >
                      {renderAction("alignTop")}
                      {renderAction("alignVerticallyCentered")}
                      {renderAction("alignBottom")}
                      {targetElements.length > 2 &&
                        renderAction("distributeVertically")}
                    </div>
                  </div>
                </fieldset>
              )}
              <fieldset>
                <legend>{t("labels.actions")}</legend>
                <div className="buttonList">
                  {renderAction("group")}
                  {renderAction("ungroup")}
                  {showLinkIcon && renderAction("hyperlink")}
                  {showCropEditorAction && renderAction("cropEditor")}
                  {showDuplicate && renderAction("duplicateSelection")}
                  {showDelete && renderAction("deleteSelectedElements")}
                </div>
              </fieldset>
            </div>
          </PropertiesPopover>
        )}
      </Popover.Root>
    </div>
  );
};

const LinearEditorAction = ({
  appState,
  renderAction,
  targetElements,
}: {
  appState: UIAppState;
  targetElements: ExcalidrawElement[];
  renderAction: ActionManager["renderAction"];
}) => {
  const showLineEditorAction =
    !appState.selectedLinearElement?.isEditing &&
    targetElements.length === 1 &&
    isLinearElement(targetElements[0]) &&
    !isElbowArrow(targetElements[0]);

  if (!showLineEditorAction) {
    return null;
  }

  return (
    <div className="compact-action-item">
      {renderAction("toggleLinearEditor")}
    </div>
  );
};

export const CompactShapeActions = ({
  appState,
  elementsMap,
  renderAction,
  app,
  setAppState,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
  app: AppClassProperties;
  setAppState: React.Component<any, AppState>["setState"];
}) => {
  const targetElements = getTargetElements(elementsMap, appState);
  const { container } = useExcalidrawContainer();

  const isEditingTextOrNewElement = Boolean(
    appState.editingTextElement || appState.newElement,
  );

  const showLineEditorAction =
    !appState.selectedLinearElement?.isEditing &&
    targetElements.length === 1 &&
    isLinearElement(targetElements[0]) &&
    !isElbowArrow(targetElements[0]);

  return (
    <div className="compact-shape-actions">
      {/* Stroke Color */}
      {canChangeStrokeColor(appState, targetElements) && (
        <div className={clsx("compact-action-item")}>
          {renderAction("changeStrokeColor")}
        </div>
      )}

      {/* Background Color */}
      {canChangeBackgroundColor(appState, targetElements) && (
        <div className="compact-action-item">
          {renderAction("changeBackgroundColor")}
        </div>
      )}

      <CombinedShapeProperties
        appState={appState}
        renderAction={renderAction}
        setAppState={setAppState}
        targetElements={targetElements}
        container={container}
      />

      <CombinedArrowProperties
        appState={appState}
        renderAction={renderAction}
        setAppState={setAppState}
        targetElements={targetElements}
        container={container}
        app={app}
      />
      {/* Linear Editor */}
      {showLineEditorAction && (
        <div className="compact-action-item">
          {renderAction("toggleLinearEditor")}
        </div>
      )}

      {/* Text Properties */}
      {(appState.activeTool.type === "text" ||
        targetElements.some(isTextElement)) && (
        <>
          <div className="compact-action-item">
            {renderAction("changeFontFamily")}
          </div>
          <CombinedTextProperties
            appState={appState}
            renderAction={renderAction}
            setAppState={setAppState}
            targetElements={targetElements}
            container={container}
            elementsMap={elementsMap}
          />
        </>
      )}

      {/* Dedicated Copy Button */}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <div className="compact-action-item">
          {renderAction("duplicateSelection")}
        </div>
      )}

      {/* Dedicated Delete Button */}
      {!isEditingTextOrNewElement && targetElements.length > 0 && (
        <div className="compact-action-item">
          {renderAction("deleteSelectedElements")}
        </div>
      )}

      <CombinedExtraActions
        appState={appState}
        renderAction={renderAction}
        targetElements={targetElements}
        setAppState={setAppState}
        container={container}
        app={app}
      />
    </div>
  );
};

export const MobileShapeActions = ({
  appState,
  elementsMap,
  renderAction,
  app,
  setAppState,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
  app: AppClassProperties;
  setAppState: React.Component<any, AppState>["setState"];
}) => {
  const targetElements = getTargetElements(elementsMap, appState);
  const { container } = useExcalidrawContainer();
  const mobileActionsRef = useRef<HTMLDivElement>(null);

  const ACTIONS_WIDTH =
    mobileActionsRef.current?.getBoundingClientRect()?.width ?? 0;

  // 7 actions + 2 for undo/redo
  const MIN_ACTIONS = 9;

  const GAP = 6;
  const WIDTH = 32;

  const MIN_WIDTH = MIN_ACTIONS * WIDTH + (MIN_ACTIONS - 1) * GAP;

  const ADDITIONAL_WIDTH = WIDTH + GAP;

  const showDeleteOutside = ACTIONS_WIDTH >= MIN_WIDTH + ADDITIONAL_WIDTH;
  const showDuplicateOutside =
    ACTIONS_WIDTH >= MIN_WIDTH + 2 * ADDITIONAL_WIDTH;

  return (
    <Island
      className="compact-shape-actions mobile-shape-actions"
      style={{
        flexDirection: "row",
        boxShadow: "none",
        padding: 0,
        zIndex: 2,
        backgroundColor: "transparent",
        height: WIDTH * 1.35,
        marginBottom: 4,
        alignItems: "center",
        gap: GAP,
        pointerEvents: "none",
      }}
      ref={mobileActionsRef}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: GAP,
          flex: 1,
        }}
      >
        {canChangeStrokeColor(appState, targetElements) && (
          <div className={clsx("compact-action-item")}>
            {renderAction("changeStrokeColor")}
          </div>
        )}
        {canChangeBackgroundColor(appState, targetElements) && (
          <div className="compact-action-item">
            {renderAction("changeBackgroundColor")}
          </div>
        )}
        <CombinedShapeProperties
          appState={appState}
          renderAction={renderAction}
          setAppState={setAppState}
          targetElements={targetElements}
          container={container}
        />
        {/* Combined Arrow Properties */}
        <CombinedArrowProperties
          appState={appState}
          renderAction={renderAction}
          setAppState={setAppState}
          targetElements={targetElements}
          container={container}
          app={app}
        />
        {/* Linear Editor */}
        <LinearEditorAction
          appState={appState}
          renderAction={renderAction}
          targetElements={targetElements}
        />
        {/* Text Properties */}
        {(appState.activeTool.type === "text" ||
          targetElements.some(isTextElement)) && (
          <>
            <div className="compact-action-item">
              {renderAction("changeFontFamily")}
            </div>
            <CombinedTextProperties
              appState={appState}
              renderAction={renderAction}
              setAppState={setAppState}
              targetElements={targetElements}
              container={container}
              elementsMap={elementsMap}
            />
          </>
        )}

        {/* Combined Other Actions */}
        <CombinedExtraActions
          appState={appState}
          renderAction={renderAction}
          targetElements={targetElements}
          setAppState={setAppState}
          container={container}
          app={app}
          showDuplicate={!showDuplicateOutside}
          showDelete={!showDeleteOutside}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: GAP,
        }}
      >
        <div className="compact-action-item">{renderAction("undo")}</div>
        <div className="compact-action-item">{renderAction("redo")}</div>
        {showDuplicateOutside && (
          <div className="compact-action-item">
            {renderAction("duplicateSelection")}
          </div>
        )}
        {showDeleteOutside && (
          <div className="compact-action-item">
            {renderAction("deleteSelectedElements")}
          </div>
        )}
      </div>
    </Island>
  );
};

export const ShapesSwitcher = ({
  activeTool,
  setAppState,
  app,
  UIOptions,
}: {
  activeTool: UIAppState["activeTool"];
  setAppState: React.Component<any, AppState>["setState"];
  app: AppClassProperties;
  UIOptions: AppProps["UIOptions"];
}) => {
  const [isExtraToolsMenuOpen, setIsExtraToolsMenuOpen] = useState(false);

  const SELECTION_TOOLS = [
    {
      type: "selection",
      icon: SelectionIcon,
      title: capitalizeString(t("toolBar.selection")),
    },
    {
      type: "lasso",
      icon: LassoIcon,
      title: capitalizeString(t("toolBar.lasso")),
    },
  ] as const;

  const frameToolSelected = activeTool.type === "frame";
  const laserToolSelected = activeTool.type === "laser";
  const lassoToolSelected =
    app.state.stylesPanelMode === "full" &&
    activeTool.type === "lasso" &&
    app.state.preferredSelectionTool.type !== "lasso";

  const embeddableToolSelected = activeTool.type === "embeddable";

  const { TTDDialogTriggerTunnel } = useTunnels();

  return (
    <>
      {getToolbarTools(app).map(
        ({ value, icon, key, numericKey, fillable }, index) => {
          if (
            UIOptions.tools?.[
              value as Extract<
                typeof value,
                keyof AppProps["UIOptions"]["tools"]
              >
            ] === false
          ) {
            return null;
          }

          const label = t(`toolBar.${value}`);
          const letter =
            key && capitalizeString(typeof key === "string" ? key : key[0]);
          const shortcut = letter
            ? `${letter} ${t("helpDialog.or")} ${numericKey}`
            : `${numericKey}`;
          // when in compact styles panel mode (tablet)
          // use a ToolPopover for selection/lasso toggle as well
          if (
            (value === "selection" || value === "lasso") &&
            app.state.stylesPanelMode === "compact"
          ) {
            return (
              <ToolPopover
                key={"selection-popover"}
                app={app}
                options={SELECTION_TOOLS}
                activeTool={activeTool}
                defaultOption={app.state.preferredSelectionTool.type}
                namePrefix="selectionType"
                title={capitalizeString(t("toolBar.selection"))}
                data-testid="toolbar-selection"
                onToolChange={(type: string) => {
                  if (type === "selection" || type === "lasso") {
                    app.setActiveTool({ type });
                    setAppState({
                      preferredSelectionTool: { type, initialized: true },
                    });
                  }
                }}
                displayedOption={
                  SELECTION_TOOLS.find(
                    (tool) =>
                      tool.type === app.state.preferredSelectionTool.type,
                  ) || SELECTION_TOOLS[0]
                }
                fillable={activeTool.type === "selection"}
              />
            );
          }

          return (
            <ToolButton
              className={clsx("Shape", { fillable })}
              key={value}
              type="radio"
              icon={icon}
              checked={activeTool.type === value}
              name="editor-current-shape"
              title={`${capitalizeString(label)} — ${shortcut}`}
              keyBindingLabel={numericKey || letter}
              aria-label={capitalizeString(label)}
              aria-keyshortcuts={shortcut}
              data-testid={`toolbar-${value}`}
              onPointerDown={({ pointerType }) => {
                if (!app.state.penDetected && pointerType === "pen") {
                  app.togglePenMode(true);
                }

                if (value === "selection") {
                  if (app.state.activeTool.type === "selection") {
                    app.setActiveTool({ type: "lasso" });
                  } else {
                    app.setActiveTool({ type: "selection" });
                  }
                }
              }}
              onChange={({ pointerType }) => {
                if (app.state.activeTool.type !== value) {
                  trackEvent("toolbar", value, "ui");
                }
                if (value === "image") {
                  app.setActiveTool({
                    type: value,
                  });
                } else {
                  app.setActiveTool({ type: value });
                }
              }}
            />
          );
        },
      )}
      <div className="App-toolbar__divider" />

      <DropdownMenu open={isExtraToolsMenuOpen}>
        <DropdownMenu.Trigger
          className={clsx("App-toolbar__extra-tools-trigger", {
            "App-toolbar__extra-tools-trigger--selected":
              frameToolSelected ||
              embeddableToolSelected ||
              lassoToolSelected ||
              // in collab we're already highlighting the laser button
              // outside toolbar, so let's not highlight extra-tools button
              // on top of it
              (laserToolSelected && !app.props.isCollaborating),
          })}
          onToggle={() => {
            setIsExtraToolsMenuOpen(!isExtraToolsMenuOpen);
            setAppState({ openMenu: null, openPopup: null });
          }}
          title={t("toolBar.extraTools")}
        >
          {frameToolSelected
            ? frameToolIcon
            : embeddableToolSelected
            ? EmbedIcon
            : laserToolSelected && !app.props.isCollaborating
            ? laserPointerToolIcon
            : lassoToolSelected
            ? LassoIcon
            : extraToolsIcon}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          onClickOutside={() => setIsExtraToolsMenuOpen(false)}
          onSelect={() => setIsExtraToolsMenuOpen(false)}
          className="App-toolbar__extra-tools-dropdown"
        >
          <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "frame" })}
            icon={frameToolIcon}
            shortcut={KEYS.F.toLocaleUpperCase()}
            data-testid="toolbar-frame"
            selected={frameToolSelected}
          >
            {t("toolBar.frame")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "embeddable" })}
            icon={EmbedIcon}
            data-testid="toolbar-embeddable"
            selected={embeddableToolSelected}
          >
            {t("toolBar.embeddable")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "laser" })}
            icon={laserPointerToolIcon}
            data-testid="toolbar-laser"
            selected={laserToolSelected}
            shortcut={KEYS.K.toLocaleUpperCase()}
          >
            {t("toolBar.laser")}
          </DropdownMenu.Item>
          {app.state.stylesPanelMode === "full" && (
            <DropdownMenu.Item
              onSelect={() => app.setActiveTool({ type: "lasso" })}
              icon={LassoIcon}
              data-testid="toolbar-lasso"
              selected={lassoToolSelected}
            >
              {t("toolBar.lasso")}
            </DropdownMenu.Item>
          )}
          <div style={{ margin: "6px 0", fontSize: 14, fontWeight: 600 }}>
            Generate
          </div>
          {app.props.aiEnabled !== false && <TTDDialogTriggerTunnel.Out />}
          <DropdownMenu.Item
            onSelect={() => app.setOpenDialog({ name: "ttd", tab: "mermaid" })}
            icon={mermaidLogoIcon}
            data-testid="toolbar-embeddable"
          >
            {t("toolBar.mermaidToExcalidraw")}
          </DropdownMenu.Item>
          {app.props.aiEnabled !== false && app.plugins.diagramToCode && (
            <DropdownMenu.Item
              onSelect={() => app.onMagicframeToolSelect()}
              icon={MagicIcon}
              data-testid="toolbar-magicframe"
            >
              {t("toolBar.magicframe")}
              <DropdownMenu.Item.Badge>AI</DropdownMenu.Item.Badge>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu>
    </>
  );
};

export const ZoomActions = ({
  renderAction,
  zoom,
}: {
  renderAction: ActionManager["renderAction"];
  zoom: Zoom;
}) => (
  <Stack.Col gap={1} className={CLASSES.ZOOM_ACTIONS}>
    <Stack.Row align="center">
      {renderAction("zoomOut")}
      {renderAction("resetZoom")}
      {renderAction("zoomIn")}
    </Stack.Row>
  </Stack.Col>
);

export const UndoRedoActions = ({
  renderAction,
  className,
}: {
  renderAction: ActionManager["renderAction"];
  className?: string;
}) => (
  <div className={`undo-redo-buttons ${className}`}>
    <div className="undo-button-container">
      <Tooltip label={t("buttons.undo")}>{renderAction("undo")}</Tooltip>
    </div>
    <div className="redo-button-container">
      <Tooltip label={t("buttons.redo")}> {renderAction("redo")}</Tooltip>
    </div>
  </div>
);

export const ExitZenModeAction = ({
  actionManager,
  showExitZenModeBtn,
}: {
  actionManager: ActionManager;
  showExitZenModeBtn: boolean;
}) => (
  <button
    type="button"
    className={clsx("disable-zen-mode", {
      "disable-zen-mode--visible": showExitZenModeBtn,
    })}
    onClick={() => actionManager.executeAction(actionToggleZenMode)}
  >
    {t("buttons.exitZenMode")}
  </button>
);
