import React, { useState } from 'react';
import { Play, Plus, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Frame {
    id: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FramesPanelProps {
    frames: Frame[];
    frameOrder: string[];
    onCreateFrame: () => void;
    onReorderFrames: (newOrder: string[]) => void;
    onStartPresentation: () => void;
    onFrameClick: (frameId: string) => void;
}

interface SortableFrameItemProps {
    frame: Frame;
    index: number;
    onClick: () => void;
}

const SortableFrameItem: React.FC<SortableFrameItemProps> = ({ frame, index, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: frame.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer"
            onClick={onClick}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1 bg-white/80 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            {/* Frame Number */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                {index + 1}
            </div>

            {/* Thumbnail Placeholder */}
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-sm">
                    {frame.name || `Frame ${index + 1}`}
                </div>
            </div>

            {/* Frame Info */}
            <div className="p-2 text-xs text-gray-600 truncate">
                {frame.width} × {frame.height}
            </div>
        </div>
    );
};

const FramesPanel: React.FC<FramesPanelProps> = ({
    frames,
    frameOrder,
    onCreateFrame,
    onReorderFrames,
    onStartPresentation,
    onFrameClick,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 按照 frameOrder 排序 frames
    const orderedFrames = frameOrder
        .map(id => frames.find(f => f.id === id))
        .filter(Boolean) as Frame[];

    // 添加不在 frameOrder 中的新 frames
    const newFrames = frames.filter(f => !frameOrder.includes(f.id));
    const allFrames = [...orderedFrames, ...newFrames];

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = allFrames.findIndex(f => f.id === active.id);
            const newIndex = allFrames.findIndex(f => f.id === over.id);
            const newOrder = arrayMove(allFrames, oldIndex, newIndex).map(f => f.id);
            onReorderFrames(newOrder);
        }
    };

    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Frames</h3>
                    <button
                        onClick={onCreateFrame}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Add frame"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Play Button */}
                <button
                    onClick={onStartPresentation}
                    disabled={frames.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Play className="w-4 h-4" />
                    Play
                </button>
            </div>

            {/* Frames List */}
            <div className="flex-1 overflow-y-auto p-3">
                {allFrames.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <p>No frames yet</p>
                        <p className="mt-1">Click + to add a frame</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={allFrames.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {allFrames.map((frame, index) => (
                                    <SortableFrameItem
                                        key={frame.id}
                                        frame={frame}
                                        index={index}
                                        onClick={() => onFrameClick(frame.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
};

export default FramesPanel;
