import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface Tag {
    id: string;
    name: string;
    color?: string;
}

interface TagSelectorProps {
    tags: Tag[];
    selectedTagIds: string[];
    onToggleTag: (tagId: string) => void;
    onClose: () => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
    tags,
    selectedTagIds,
    onToggleTag,
    onClose,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-20 max-h-80 overflow-y-auto"
        >
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Select Tags</span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tag List */}
            <div className="py-1">
                {tags.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No tags available
                    </div>
                ) : (
                    tags.map((tag) => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                            <button
                                key={tag.id}
                                onClick={() => onToggleTag(tag.id)}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white truncate"
                                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                                    >
                                        {tag.name}
                                    </span>
                                </div>
                                {isSelected && (
                                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TagSelector;
