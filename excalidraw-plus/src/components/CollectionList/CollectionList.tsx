import React from 'react';
import { Folder, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface Collection {
    id: string;
    name: string;
    description?: string;
    color?: string;
    _count?: {
        drawings: number;
    };
}

interface CollectionListProps {
    collections: Collection[];
    selectedCollectionId?: string | null;
    onSelectCollection: (collectionId: string | null) => void;
    onEditCollection: (collection: Collection) => void;
    onDeleteCollection: (collectionId: string) => void;
    onDropDrawing?: (drawingId: string, collectionId: string | null) => void;
    isCollapsed?: boolean;
}

const CollectionList: React.FC<CollectionListProps> = ({
    collections,
    selectedCollectionId,
    onSelectCollection,
    onEditCollection,
    onDeleteCollection,
    onDropDrawing,
    isCollapsed = false,
}) => {
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
    const [dragOverId, setDragOverId] = React.useState<string | null>(null);

    const handleMenuToggle = (e: React.MouseEvent, collectionId: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === collectionId ? null : collectionId);
    };

    const handleEdit = (e: React.MouseEvent, collection: Collection) => {
        e.stopPropagation();
        setOpenMenuId(null);
        onEditCollection(collection);
    };

    const handleDelete = (e: React.MouseEvent, collectionId: string) => {
        e.stopPropagation();
        setOpenMenuId(null);
        if (confirm('Are you sure you want to delete this collection? Drawings will not be deleted.')) {
            onDeleteCollection(collectionId);
        }
    };

    const handleDragOver = (e: React.DragEvent, collectionId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(collectionId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, collectionId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);

        const drawingId = e.dataTransfer.getData('drawingId');
        if (drawingId && onDropDrawing) {
            onDropDrawing(drawingId, collectionId);
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

    return (
        <div className="space-y-1">
            {/* All Drawings */}
            <button
                onClick={() => onSelectCollection(null)}
                onDragOver={(e) => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md transition-colors ${dragOverId === null ? 'ring-2 ring-blue-500 bg-blue-100' : ''
                    } ${selectedCollectionId === null
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                title={isCollapsed ? "All Drawings" : undefined}
            >
                <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    {!isCollapsed && <span className="font-medium">All Drawings</span>}
                </div>
            </button>

            {/* Collections */}
            {collections.map((collection) => (
                <div key={collection.id} className="relative">
                    <div
                        onDragOver={(e) => handleDragOver(e, collection.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, collection.id)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md transition-colors group cursor-pointer ${dragOverId === collection.id ? 'ring-2 ring-blue-500 bg-blue-100' : ''
                            } ${selectedCollectionId === collection.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        title={isCollapsed ? collection.name : undefined}
                    >
                        <div
                            className={`flex items-center gap-2 flex-1 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}
                            onClick={() => onSelectCollection(collection.id)}
                        >
                            <div
                                className="w-4 h-4 rounded flex-shrink-0"
                                style={{ backgroundColor: collection.color || '#3B82F6' }}
                            />
                            {!isCollapsed && (
                                <>
                                    <span className="font-medium truncate">{collection.name}</span>
                                    {collection._count && collection._count.drawings > 0 && (
                                        <span className="text-xs text-gray-500">
                                            ({collection._count.drawings})
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {!isCollapsed && (
                            <div
                                onClick={(e) => handleMenuToggle(e, collection.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity cursor-pointer"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    {/* Dropdown Menu */}
                    {openMenuId === collection.id && !isCollapsed && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                            <button
                                onClick={(e) => handleEdit(e, collection)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Collection
                            </button>
                            <button
                                onClick={(e) => handleDelete(e, collection.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Collection
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CollectionList;
