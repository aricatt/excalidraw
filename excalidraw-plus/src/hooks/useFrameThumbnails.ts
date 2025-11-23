import { useState, useEffect, useRef, useCallback } from 'react';
import { exportToCanvas } from '@excalidraw/excalidraw';

interface Frame {
    id: string;
    [key: string]: any;
}

interface UseFrameThumbnailsOptions {
    frames: Frame[];
    excalidrawAPI: any;
    enabled?: boolean;
    refreshInterval?: number; // 刷新间隔(毫秒)
}

export const useFrameThumbnails = ({
    frames,
    excalidrawAPI,
    enabled = true,
    refreshInterval = 3000, // 默认 3 秒
}: UseFrameThumbnailsOptions) => {
    const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState<Set<string>>(new Set());
    const cacheRef = useRef<Map<string, string>>(new Map());
    const generatingRef = useRef<Set<string>>(new Set());

    // 记录每个 Frame 的内容哈希,用于检测变化
    const frameHashRef = useRef<Map<string, string>>(new Map());

    // 生成 Frame 内容的哈希值
    const getFrameHash = useCallback((frame: Frame, elements: any[]) => {
        const frameElements = elements.filter((el: any) =>
            el.frameId === frame.id && !el.isDeleted
        );

        // 使用元素数量、类型和 versionNonce 生成简单哈希
        const hash = frameElements
            .map((el: any) => `${el.type}-${el.versionNonce}`)
            .sort()
            .join('|');

        return `${frameElements.length}:${hash}`;
    }, []);

    // 生成单个 Frame 的缩略图
    const generateThumbnail = useCallback(async (frame: Frame, force = false) => {
        if (!excalidrawAPI) return;

        // 避免重复生成
        if (generatingRef.current.has(frame.id)) return;

        try {
            const allElements = excalidrawAPI.getSceneElements();
            const files = excalidrawAPI.getFiles();

            // 计算当前哈希
            const currentHash = getFrameHash(frame, allElements);
            const previousHash = frameHashRef.current.get(frame.id);

            // 如果内容没变且不是强制刷新,跳过
            if (!force && previousHash === currentHash && cacheRef.current.has(frame.id)) {
                return;
            }

            // 记录新哈希
            frameHashRef.current.set(frame.id, currentHash);

            generatingRef.current.add(frame.id);
            setLoading(prev => new Set(prev).add(frame.id));

            // 获取 Frame 内的所有元素
            const frameElements = allElements.filter((el: any) =>
                el.frameId === frame.id && !el.isDeleted
            );

            // 导出为 canvas
            const canvas = await exportToCanvas({
                elements: [frame, ...frameElements],
                files,
                maxWidthOrHeight: 300,
                exportPadding: 10,
            });

            const dataURL = canvas.toDataURL('image/png');

            // 更新缓存和状态
            cacheRef.current.set(frame.id, dataURL);
            setThumbnails(prev => new Map(prev).set(frame.id, dataURL));

            console.log(`Thumbnail updated for frame: ${frame.id}`);
        } catch (error) {
            console.error('Failed to generate thumbnail for frame:', frame.id, error);
        } finally {
            generatingRef.current.delete(frame.id);
            setLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(frame.id);
                return newSet;
            });
        }
    }, [excalidrawAPI, getFrameHash]);

    // 初始生成所有缩略图
    useEffect(() => {
        if (!enabled || !excalidrawAPI || frames.length === 0) return;

        frames.forEach(frame => {
            generateThumbnail(frame, true);
        });
    }, [frames.length, excalidrawAPI, enabled]); // 只在 Frame 数量变化时触发

    // 定期检查并更新有变化的 Frame
    useEffect(() => {
        if (!enabled || !excalidrawAPI || frames.length === 0 || !refreshInterval) return;

        const checkAndUpdate = () => {
            frames.forEach(frame => {
                generateThumbnail(frame, false);
            });
        };

        const intervalId = setInterval(checkAndUpdate, refreshInterval);

        return () => clearInterval(intervalId);
    }, [frames, excalidrawAPI, enabled, refreshInterval, generateThumbnail]);

    // 手动刷新指定 Frame
    const refreshThumbnail = useCallback((frameId: string) => {
        const frame = frames.find(f => f.id === frameId);
        if (frame) {
            generateThumbnail(frame, true);
        }
    }, [frames, generateThumbnail]);

    // 刷新所有缩略图
    const refreshAll = useCallback(() => {
        frames.forEach(frame => {
            generateThumbnail(frame, true);
        });
    }, [frames, generateThumbnail]);

    return {
        thumbnails,
        loading,
        getThumbnail: (frameId: string) => thumbnails.get(frameId),
        isLoading: (frameId: string) => loading.has(frameId),
        refreshThumbnail,
        refreshAll,
    };
};
