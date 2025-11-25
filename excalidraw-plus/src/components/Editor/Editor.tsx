import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Excalidraw, DefaultSidebar, Sidebar, Footer, MainMenu, WelcomeScreen, useHandleLibrary } from "@excalidraw/excalidraw";
import { exportToBlob } from '@excalidraw/excalidraw';


import { ArrowLeft, Save, Loader2, Check, Edit2, MessageSquare } from 'lucide-react';
import { drawingAPI } from '../../lib/api';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import FramesPanel from '../FramesPanel/FramesPanel';
import PresentationMode from '../PresentationMode/PresentationMode';
import { CommentsPanel } from '../CommentsPanel';
import { CommentOverlay } from '../CommentOverlay';
import './FooterButtons.css';
import { localStorageLibraryAdapter } from '../../lib/libraryAdapter';



// 配置 Excalidraw 资源路径,修复字体加载
if (typeof window !== 'undefined') {
  (window as any).EXCALIDRAW_ASSET_PATH = '/';
}

export const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [title, setTitle] = useState('Untitled Drawing');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [frameOrder, setFrameOrder] = useState<string[]>([]);
  const [frames, setFrames] = useState<any[]>([]);
  const [isCommentMode, setIsCommentMode] = useState(false);


  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

  // 定位到评论
  const handleSelectComment = useCallback((commentId: string, x: number, y: number) => {
    if (!excalidrawAPI) return;

    const appState = excalidrawAPI.getAppState();
    const { width, height } = appState;

    // 计算居中位置
    // x, y 是评论在画布上的坐标
    // scrollX = x - viewportWidth / 2 / zoom
    const scrollX = x - width / 2 / appState.zoom.value;
    const scrollY = y - height / 2 / appState.zoom.value;

    excalidrawAPI.updateScene({
      appState: {
        ...appState,
        scrollX,
        scrollY,
      }
    });

    setExpandedCommentId(commentId);
  }, [excalidrawAPI]);



  // 设置窗口名称，使素材库能够正确返回到当前窗口
  useEffect(() => {
    window.name = '_excalidraw';
  }, []);

  // Handle library imports from URL (e.g., from excalidraw.com/libraries)
  // 使用官方的 useHandleLibrary hook，它会自动处理所有素材库逻辑
  useHandleLibrary({
    excalidrawAPI,
    adapter: localStorageLibraryAdapter,
  });




  // 获取绘图数据
  const { data: drawingData, isLoading, error } = useQuery({
    queryKey: ['drawing', id],
    queryFn: async () => {
      if (!id) return null;
      console.log('Fetching drawing:', id);
      const response = await drawingAPI.getDrawing(id);
      console.log('Drawing data:', response.data);
      return response.data;
    },
    enabled: !!id,
  });

  // Debug logging
  useEffect(() => {
    console.log('Editor mounted, id:', id);
    console.log('Drawing data:', drawingData);
    console.log('Is loading:', isLoading);
    console.log('Error:', error);
  }, [id, drawingData, isLoading, error]);

  // 加载标题
  useEffect(() => {
    if (drawingData?.drawing?.title) {
      setTitle(drawingData.drawing.title);
    }
  }, [drawingData]);

  // 清理无效的 Frame index (修复旧数据)
  useEffect(() => {
    if (!excalidrawAPI) return;

    const cleanupInvalidIndices = () => {
      const elements = excalidrawAPI.getSceneElements();
      let needsUpdate = false;

      const cleanedElements = elements.map((el: any) => {
        // 检查是否是 Frame 且有无效的 index
        if (el.type === 'frame' && el.index && typeof el.index === 'string') {
          // 检查 index 是否是简单的无效格式 (如 "a0", "b0" 等)
          if (/^[a-z]0$/.test(el.index)) {
            needsUpdate = true;
            // 移除无效的 index,让 Excalidraw 重新生成
            const { index, ...rest } = el;
            return rest;
          }
        }
        return el;
      });

      if (needsUpdate) {
        console.log('Cleaning up invalid frame indices...');
        excalidrawAPI.updateScene({
          elements: cleanedElements,
        });
      }
    };

    // 延迟执行,确保 API 已完全初始化
    const timer = setTimeout(cleanupInvalidIndices, 500);
    return () => clearTimeout(timer);
  }, [excalidrawAPI]);


  // 生成缩略图
  const generateThumbnail = useCallback(async (): Promise<string | null> => {
    if (!excalidrawAPI) return null;

    try {
      // 获取所有元素(包括非删除的)
      const allElements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      // 过滤掉已删除的元素
      const elements = allElements.filter(el => !el.isDeleted);

      // 如果没有元素,返回空白缩略图
      if (elements.length === 0) {
        return null;
      }

      // 导出所有元素
      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: appState.viewBackgroundColor || '#ffffff',
          exportWithDarkMode: false,
        },
        files,
        mimeType: 'image/png',
        quality: 0.8,
        exportPadding: 30,
      });

      // 将 blob 转换为 Image 对象以便调整大小
      const img = new Image();
      const imageUrl = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // 创建 canvas 来调整图片大小
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(imageUrl);
        return null;
      }

      // 设置缩略图最大尺寸 (保持宽高比)
      const maxWidth = 800;
      const maxHeight = 600;
      let width = img.width;
      let height = img.height;

      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, width, height);

      // 清理临时 URL
      URL.revokeObjectURL(imageUrl);

      // 转换为 base64
      const base64 = canvas.toDataURL('image/png', 0.9);

      return base64;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }, [excalidrawAPI]);

  // 保存绘图
  const saveMutation = useMutation({
    mutationFn: async (data: { title?: string; generateThumb?: boolean }) => {
      if (!id || !excalidrawAPI) return;

      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      // 生成缩略图 (如果需要)
      let thumbnail = null;
      if (data.generateThumb !== false) {
        thumbnail = await generateThumbnail();
      }

      const response = await drawingAPI.updateDrawing(id, {
        title: data.title || title,
        thumbnail: thumbnail || undefined,
        content: {
          type: 'excalidraw',
          version: 2,
          source: 'https://excalidraw.com',
          elements: elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            currentItemFillStyle: appState.currentItemFillStyle,
            currentItemStrokeWidth: appState.currentItemStrokeWidth,
            currentItemRoughness: appState.currentItemRoughness,
            currentItemOpacity: appState.currentItemOpacity,
          },
        },
      });
      return response.data;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['drawing', id] });
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
    },
  });

  // 手动保存 (生成缩略图)
  const handleSave = useCallback(() => {
    setIsSaving(true);
    saveMutation.mutate({ title, generateThumb: true }, {
      onSettled: () => {
        setIsSaving(false);
      },
    });
  }, [saveMutation, title]);

  // 保存标题 (不生成缩略图,节省时间)
  const handleSaveTitle = useCallback(() => {
    if (!id) return;
    setIsSaving(true);
    saveMutation.mutate({ title, generateThumb: false }, {
      onSettled: () => {
        setIsSaving(false);
        setIsEditingTitle(false);
      },
    });
  }, [id, title, saveMutation]);

  // 标题编辑处理
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(drawingData?.drawing?.title || '');
    }
  };

  // 自动保存 (每30秒)
  useEffect(() => {
    if (!hasUnsavedChanges || !excalidrawAPI) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, excalidrawAPI, handleSave]);

  // 监听变化
  const handleChange = useCallback((elements: any, appState: any) => {
    setHasUnsavedChanges(true);

    // 保存快照到 LocalStorage,防止意外刷新或跳转导致数据丢失
    if (id && elements && elements.length > 0) {
      try {
        const snapshot = {
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
            zoom: appState.zoom,
          },
          timestamp: Date.now(),
        };
        localStorage.setItem(`excalidraw-snapshot-${id}`, JSON.stringify(snapshot));
      } catch (e) {
        console.error('Failed to save snapshot', e);
      }
    }

    // 更新 frames 列表 - 只在真正改变时更新
    if (excalidrawAPI) {
      // const elements = excalidrawAPI.getSceneElements(); // 已经作为参数传入
      const frameElements = elements.filter((el: any) => el.type === 'frame' && !el.isDeleted);

      // 比较 frame IDs,只在变化时更新
      setFrames(prevFrames => {
        const prevIds = prevFrames.map(f => f.id).sort().join(',');
        const newIds = frameElements.map((f: any) => f.id).sort().join(',');

        // 如果 ID 列表没变,不更新状态
        if (prevIds === newIds) {
          return prevFrames;
        }

        return frameElements;
      });
    }
  }, [excalidrawAPI, id]);


  // 返回 Dashboard
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      navigate('/');
    }
  };

  // 保存并离开
  const handleSaveAndExit = () => {
    setShowExitDialog(false);
    handleSave();
    setTimeout(() => navigate('/'), 500);
  };

  // 不保存直接离开
  const handleDiscardAndExit = () => {
    setShowExitDialog(false);
    navigate('/');
  };

  // 取消,留在编辑器
  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  // 获取所有 Frames
  const getFrames = useCallback(() => {
    if (!excalidrawAPI) return [];
    const elements = excalidrawAPI.getSceneElements();
    return elements.filter((el: any) => el.type === 'frame');
  }, [excalidrawAPI]);

  // 创建新 Frame
  const handleCreateFrame = useCallback(() => {
    if (!excalidrawAPI) return;

    const frameWidth = 1600;
    const frameHeight = 900;
    const spacing = 500; // 间距

    // 获取当前所有 Frames
    const currentElements = excalidrawAPI.getSceneElements();
    const existingFrames = currentElements.filter((el: any) => el.type === 'frame');

    let x: number, y: number;

    if (existingFrames.length > 0) {
      // 如果已有 Frame,在最后一个 Frame 右侧创建
      const lastFrame = existingFrames[existingFrames.length - 1];
      x = lastFrame.x + lastFrame.width + spacing;
      y = lastFrame.y; // 保持相同的 y 坐标
    } else {
      // 如果没有 Frame,在视口中心创建第一个
      const appState = excalidrawAPI.getAppState();
      const { scrollX, scrollY, zoom } = appState;
      const viewportWidth = window.innerWidth / zoom.value;
      const viewportHeight = window.innerHeight / zoom.value;
      const centerX = -scrollX + viewportWidth / 2;
      const centerY = -scrollY + viewportHeight / 2;
      x = centerX - frameWidth / 2;
      y = centerY - frameHeight / 2;
    }

    // 生成唯一 ID
    const id = `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFrame = {
      id,
      type: 'frame',
      x,
      y,
      width: frameWidth,
      height: frameHeight,
      angle: 0,
      strokeColor: '#1e1e1e',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      // 不指定 index,让 Excalidraw 自动生成
      roundness: null,
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      name: `Frame ${existingFrames.length + 1}`,
    };

    console.log('Creating frame:', newFrame);

    // 使用 updateScene 添加新元素,让 Excalidraw 处理 index
    const appState = excalidrawAPI.getAppState();
    excalidrawAPI.updateScene({
      elements: [...currentElements, newFrame as any],
      appState: {
        ...appState,
        // 选中新创建的 Frame
        selectedElementIds: { [id]: true },
      },
    });

    // 自动滚动到新创建的 Frame
    setTimeout(() => {
      // 获取 UI 偏移(包括 Sidebar)
      let canvasOffsets = excalidrawAPI.getEditorUIOffsets?.() || { top: 0, right: 0, bottom: 0, left: 0 };

      // 如果 getEditorUIOffsets 返回全 0,手动计算 Sidebar 宽度
      if (canvasOffsets.right === 0 && excalidrawAPI.getAppState().openSidebar?.name === 'default') {
        const sidebarWidth = 360;
        canvasOffsets = {
          ...canvasOffsets,
          right: sidebarWidth,
        };
      }

      excalidrawAPI.scrollToContent(newFrame as any, {
        fitToViewport: true,
        animate: true,
        canvasOffsets, // 传入偏移量,确保考虑 Sidebar 宽度
      });
      console.log('Scrolled to new frame with offsets:', canvasOffsets);
    }, 100);

    setHasUnsavedChanges(true);
  }, [excalidrawAPI]);


  // 重新排序 Frames
  const handleReorderFrames = useCallback((newOrder: string[]) => {
    setFrameOrder(newOrder);
    setHasUnsavedChanges(true);
  }, []);

  // 跳转到指定 Frame
  const handleFrameClick = useCallback((frameId: string) => {
    if (!excalidrawAPI) return;

    const frames = getFrames();
    const frame = frames.find((f: any) => f.id === frameId);
    if (!frame) return;

    // 获取 UI 偏移(包括 Sidebar)并传递给 scrollToContent
    let canvasOffsets = excalidrawAPI.getEditorUIOffsets?.() || { top: 0, right: 0, bottom: 0, left: 0 };

    // 如果 getEditorUIOffsets 返回全 0,手动计算 Sidebar 宽度
    if (canvasOffsets.right === 0 && excalidrawAPI.getAppState().openSidebar?.name === 'default') {
      // Sidebar 默认宽度约为 360px (320px + padding)
      const sidebarWidth = 360;
      canvasOffsets = {
        ...canvasOffsets,
        right: sidebarWidth,
      };
    }

    console.log('Frame click - Canvas offsets:', canvasOffsets);
    console.log('Frame click - Sidebar state:', excalidrawAPI.getAppState().openSidebar);

    excalidrawAPI.scrollToContent(frame, {
      fitToViewport: true,
      animate: true,
      canvasOffsets, // 传入偏移量,确保考虑 Sidebar 宽度
    });
  }, [excalidrawAPI, getFrames]);

  // 开始演示
  const handleStartPresentation = useCallback(() => {
    const frames = getFrames();
    if (frames.length === 0) {
      alert('Please add at least one frame to start presentation');
      return;
    }

    setCurrentSlide(0);
    setIsPresentationMode(true);

    // 进入全屏
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    }

    // 跳转到第一个 Frame
    const orderedFrames = frameOrder.length > 0
      ? frameOrder.map(id => frames.find((f: any) => f.id === id)).filter(Boolean)
      : frames;

    if (orderedFrames[0]) {
      handleFrameClick(orderedFrames[0].id);
    }
  }, [getFrames, frameOrder, handleFrameClick]);

  // 演示模式导航
  const handlePrevSlide = useCallback(() => {
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);

      const frames = getFrames();
      const orderedFrames = frameOrder.length > 0
        ? frameOrder.map(id => frames.find((f: any) => f.id === id)).filter(Boolean)
        : frames;

      if (orderedFrames[newSlide]) {
        handleFrameClick(orderedFrames[newSlide].id);
      }
    }
  }, [currentSlide, getFrames, frameOrder, handleFrameClick]);

  const handleNextSlide = useCallback(() => {
    const frames = getFrames();
    const orderedFrames = frameOrder.length > 0
      ? frameOrder.map(id => frames.find((f: any) => f.id === id)).filter(Boolean)
      : frames;

    if (currentSlide < orderedFrames.length - 1) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);

      if (orderedFrames[newSlide]) {
        handleFrameClick(orderedFrames[newSlide].id);
      }
    }
  }, [currentSlide, getFrames, frameOrder, handleFrameClick]);

  const handleExitPresentation = useCallback(() => {
    setIsPresentationMode(false);

    // 退出全屏
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Failed to exit fullscreen:', err);
      });
    }
  }, []);



  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 聚焦标题输入框
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const initialData = useMemo(() => {
    let data = drawingData?.drawing?.content || {
      elements: [],
      appState: {
        viewBackgroundColor: '#ffffff',
        openSidebar: null, // 确保初始状态下 Sidebar 是关闭的
      },
    };

    // 尝试从本地快照恢复(用于处理刷新或跳转后的数据恢复)
    if (id) {
      try {
        const snapshotStr = localStorage.getItem(`excalidraw-snapshot-${id}`);
        if (snapshotStr) {
          const snapshot = JSON.parse(snapshotStr);
          // 简单的策略: 如果有快照,就合并快照的 elements 和 appState
          // 这能解决跳转到素材库回来后数据丢失的问题
          console.log('Restoring from local snapshot');
          data = {
            ...data,
            elements: snapshot.elements || data.elements,
            appState: {
              ...data.appState,
              ...snapshot.appState,
              openSidebar: null, // 即使恢复快照,也确保 Sidebar 关闭
            },
          };
        }
      } catch (e) {
        console.error('Failed to restore snapshot', e);
      }
    }
    return data;
  }, [drawingData, id]);


  if (isLoading) {

    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading drawing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {/* Editable Title */}
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                className="text-base font-semibold text-gray-900 border-b-2 border-blue-500 focus:outline-none px-2 py-1 min-w-[200px]"
                placeholder="Untitled"
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-base font-semibold text-gray-900">
                  {title || 'Untitled'}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                  title="Edit title"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
            {lastSaved && !isEditingTitle && (
              <p className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : lastSaved && !hasUnsavedChanges ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showExitDialog}
        title="Unsaved Changes"
        message="You have unsaved changes. What would you like to do?"
        type="warning"
        confirmText="Save & Leave"
        cancelText="Stay"
        showThirdButton={true}
        thirdButtonText="Discard & Leave"
        onConfirm={handleSaveAndExit}
        onCancel={handleCancelExit}
        onThirdAction={handleDiscardAndExit}
      />

      {/* Main Content Area - Excalidraw */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Excalidraw
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
            initialData={initialData}
            onChange={handleChange}
            theme="light"
            name="Excalidraw Plus"
            libraryReturnUrl={window.location.origin + window.location.pathname}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
              },
            }}
          >
            {/* DefaultSidebar with Frames tab - 只在非演示模式显示 */}
            {!isPresentationMode && (
              <DefaultSidebar docked={true}>
                <DefaultSidebar.TabTriggers>
                  <Sidebar.TabTrigger tab="frames">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="16"
                        height="16"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </Sidebar.TabTrigger>
                  <Sidebar.TabTrigger tab="comments">
                    <MessageSquare size={20} />
                  </Sidebar.TabTrigger>
                </DefaultSidebar.TabTriggers>
                <Sidebar.Tab tab="frames">
                  <FramesPanel
                    frames={frames}
                    frameOrder={frameOrder}
                    excalidrawAPI={excalidrawAPI}
                    onCreateFrame={handleCreateFrame}
                    onReorderFrames={handleReorderFrames}
                    onStartPresentation={handleStartPresentation}
                    onFrameClick={handleFrameClick}
                  />
                </Sidebar.Tab>
                <Sidebar.Tab tab="comments">
                  <CommentsPanel
                    drawingId={id!}
                    onSelectComment={handleSelectComment}
                  />
                </Sidebar.Tab>
              </DefaultSidebar>
            )}


            {/* Sidebar Trigger - 显示在工具栏 */}
            {!isPresentationMode && (
              <DefaultSidebar.Trigger
                tab="frames"
                title="Toggle Sidebar"
              />
            )}

            {/* Footer */}
            {!isPresentationMode && (
              <Footer>
                <div className="custom-footer">
                  <button
                    className={`custom-footer-btn ${isCommentMode ? 'active' : ''}`}
                    onClick={() => setIsCommentMode(!isCommentMode)}
                    title="Comment (C)"
                  >
                    <MessageSquare size={20} />
                  </button>
                  <button
                    className="custom-footer-btn"
                    onClick={() => {
                      if (excalidrawAPI) {
                        const currentState = excalidrawAPI.getAppState();
                        excalidrawAPI.updateScene({
                          appState: {
                            openSidebar: currentState.openSidebar
                              ? null
                              : { name: 'default', tab: 'frames' }
                          }
                        });
                      }
                    }}
                    title="Toggle Sidebar"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="16"
                        height="16"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="18"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>
              </Footer>
            )}
          </Excalidraw>

          {/* 画布评论气泡 Overlay */}
          {id && (
            <CommentOverlay
              drawingId={id}
              excalidrawAPI={excalidrawAPI}
              isCommentMode={isCommentMode}
              onExitCommentMode={() => setIsCommentMode(false)}
              expandedCommentId={expandedCommentId}
              setExpandedCommentId={setExpandedCommentId}
            />
          )}
        </div>
      </div>

      {/* Presentation Mode Controls */}
      {
        isPresentationMode && (
          <PresentationMode
            totalSlides={frames.length}
            currentSlide={currentSlide}
            onPrevSlide={handlePrevSlide}
            onNextSlide={handleNextSlide}
            onExit={handleExitPresentation}
          />
        )
      }
    </div >
  );
};

export default Editor;
