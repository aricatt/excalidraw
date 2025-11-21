import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { exportToBlob } from '@excalidraw/excalidraw';
import { ArrowLeft, Save, Loader2, Check, Edit2 } from 'lucide-react';
import { drawingAPI } from '../../lib/api';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 获取绘图数据
  const { data: drawingData, isLoading } = useQuery({
    queryKey: ['drawing', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await drawingAPI.getDrawing(id);
      return response.data;
    },
    enabled: !!id,
  });

  // 加载标题
  useEffect(() => {
    if (drawingData?.drawing?.title) {
      setTitle(drawingData.drawing.title);
    }
  }, [drawingData]);

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
  const handleChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // 返回 Dashboard
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Do you want to save before leaving?')) {
        handleSave();
        setTimeout(() => navigate('/'), 500);
        return;
      }
    }
    navigate('/');
  };

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

  const initialData = drawingData?.drawing?.content || {
    elements: [],
    appState: {
      viewBackgroundColor: '#ffffff',
    },
  };

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

      {/* Excalidraw Editor */}
      <div className="flex-1 overflow-hidden">
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          theme="light"
          name="Excalidraw Plus"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
            },
          }}
        />
      </div>
    </div>
  );
};

export default Editor;
