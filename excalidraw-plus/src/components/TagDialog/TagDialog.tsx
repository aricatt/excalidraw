import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; color: string }) => void;
    tag?: { id: string; name: string; color?: string } | null;
}

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#14B8A6', // Teal
];

const TagDialog: React.FC<TagDialogProps> = ({ isOpen, onClose, onSave, tag }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);

    useEffect(() => {
        if (tag) {
            setName(tag.name);
            setColor(tag.color || PRESET_COLORS[0]);
        } else {
            setName('');
            setColor(PRESET_COLORS[0]);
        }
    }, [tag, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name: name.trim(), color });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {tag ? 'Edit Tag' : 'Create Tag'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Tag Name *
                        </label>
                        <input
                            id="tag-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Work, Personal, Ideas"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                            {PRESET_COLORS.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    onClick={() => setColor(presetColor)}
                                    className={`w-8 h-8 rounded-full transition-all ${color === presetColor
                                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                                            : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: presetColor }}
                                    aria-label={`Select color ${presetColor}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preview
                        </label>
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: color }}
                            >
                                {name || 'Tag Name'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {tag ? 'Save Changes' : 'Create Tag'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TagDialog;
