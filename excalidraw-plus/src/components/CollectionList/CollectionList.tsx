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
}

const CollectionList: React.FC<CollectionListProps> = ({
    collections,
    selectedCollectionId,
    onSelectCollection,
    onEditCollection,
    onDeleteCollection,
}) => {
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${selectedCollectionId === null
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    <span className="font-medium">All Drawings</span>
                </div>
            </button>

            {/* Collections */}
            {collections.map((collection) => (
                <div key={collection.id} className="relative">
                    <div
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors group cursor-pointer ${selectedCollectionId === collection.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <div
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => onSelectCollection(collection.id)}
                        >
                            <div
                                className="w-4 h-4 rounded flex-shrink-0"
                                style={{ backgroundColor: collection.color || '#3B82F6' }}
                            />
                            <span className="font-medium truncate">{collection.name}</span>
                            {collection._count && collection._count.drawings > 0 && (
                                <span className="text-xs text-gray-500">
                                    ({collection._count.drawings})
                                </span>
                            )}
                        </div>

                        <div
                            onClick={(e) => handleMenuToggle(e, collection.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity cursor-pointer"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    {openMenuId === collection.id && (
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
