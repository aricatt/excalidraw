import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PresentationModeProps {
    totalSlides: number;
    currentSlide: number;
    onPrevSlide: () => void;
    onNextSlide: () => void;
    onExit: () => void;
}

const PresentationMode: React.FC<PresentationModeProps> = ({
    totalSlides,
    currentSlide,
    onPrevSlide,
    onNextSlide,
    onExit,
}) => {
    // 键盘快捷键
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                onPrevSlide();
                break;
            case 'ArrowRight':
            case 'PageDown':
            case ' ': // 空格键
                e.preventDefault();
                onNextSlide();
                break;
            case 'Escape':
                e.preventDefault();
                onExit();
                break;
            case 'Home':
                e.preventDefault();
                // 跳转到第一页 - 需要父组件支持
                break;
            case 'End':
                e.preventDefault();
                // 跳转到最后一页 - 需要父组件支持
                break;
        }
    }, [onPrevSlide, onNextSlide, onExit]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {/* 底部控制栏 */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-6 py-3 flex items-center gap-4 border border-gray-200">
                    {/* 上一页按钮 */}
                    <button
                        onClick={onPrevSlide}
                        disabled={currentSlide === 0}
                        className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
                        title="Previous slide (←)"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* 页码 */}
                    <div className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                        {currentSlide + 1} / {totalSlides}
                    </div>

                    {/* 下一页按钮 */}
                    <button
                        onClick={onNextSlide}
                        disabled={currentSlide === totalSlides - 1}
                        className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
                        title="Next slide (→)"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* 分隔线 */}
                    <div className="w-px h-6 bg-gray-300" />

                    {/* 退出按钮 */}
                    <button
                        onClick={onExit}
                        className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Exit presentation (ESC)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 键盘提示 (可选,首次进入时显示) */}
            {/* 可以添加一个淡出的提示: "Use ← → to navigate, ESC to exit" */}
        </>
    );
};

export default PresentationMode;
