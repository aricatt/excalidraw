import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { ArrowLeft, Save, Loader2, Check } from 'lucide-react';
import { drawingAPI } from '../../lib/api';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // 保存绘图
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id || !excalidrawAPI) return;

      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      const response = await drawingAPI.updateDrawing(id, {
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
    },
  });

  // 手动保存
  const handleSave = useCallback(() => {
    setIsSaving(true);
    saveMutation.mutate(undefined, {
      onSettled: () => {
        setIsSaving(false);
      },
    });
  }, [saveMutation]);

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
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {drawingData?.drawing?.title || 'Untitled'}
            </h1>
            {lastSaved && (
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
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
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
