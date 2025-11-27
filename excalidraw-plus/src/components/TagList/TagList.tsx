import React from 'react';
import { Tag, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface TagItem {
    id: string;
    name: string;
    color?: string;
    _count?: {
        drawings: number;
    };
}

interface TagListProps {
    tags: TagItem[];
    selectedTagId?: string | null;
    onSelectTag: (tagId: string | null) => void;
    onEditTag: (tag: TagItem) => void;
    onDeleteTag: (tagId: string) => void;
    isCollapsed?: boolean;
}

const TagList: React.FC<TagListProps> = ({
    tags,
    selectedTagId,
    onSelectTag,
    onEditTag,
    onDeleteTag,
    isCollapsed = false,
}) => {
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    const handleMenuToggle = (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === tagId ? null : tagId);
    };

    const handleEdit = (e: React.MouseEvent, tag: TagItem) => {
        e.stopPropagation();
        setOpenMenuId(null);
        onEditTag(tag);
    };

    const handleDelete = (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation();
        setOpenMenuId(null);
        if (confirm('Are you sure you want to delete this tag? It will be removed from all drawings.')) {
            onDeleteTag(tagId);
        }
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    if (tags.length === 0) {
        return (
            <div className={`px-3 py-4 text-center text-sm text-gray-500 ${isCollapsed ? 'hidden' : ''}`}>
                No tags yet
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {tags.map((tag) => (
                <div key={tag.id} className="relative">
                    <div
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md transition-colors group cursor-pointer ${selectedTagId === tag.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        title={isCollapsed ? tag.name : undefined}
                    >
                        <div
                            className={`flex items-center gap-2 flex-1 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}
                            onClick={() => onSelectTag(tag.id)}
                        >
                            <span
                                className={`inline-flex items-center ${isCollapsed ? 'w-3 h-3 rounded-full p-0' : 'px-2 py-0.5 rounded-full text-xs font-medium'} text-white`}
                                style={{ backgroundColor: tag.color || '#3B82F6' }}
                            >
                                {!isCollapsed && tag.name}
                            </span>
                            {!isCollapsed && tag._count && tag._count.drawings > 0 && (
                                <span className="text-xs text-gray-500">
                                    ({tag._count.drawings})
                                </span>
                            )}
                        </div>

                        {!isCollapsed && (
                            <div
                                onClick={(e) => handleMenuToggle(e, tag.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity cursor-pointer"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    {/* Dropdown Menu */}
                    {openMenuId === tag.id && !isCollapsed && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                            <button
                                onClick={(e) => handleEdit(e, tag)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Tag
                            </button>
                            <button
                                onClick={(e) => handleDelete(e, tag.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Tag
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TagList;
