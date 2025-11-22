import React from 'react';
import { Check, Folder } from 'lucide-react';

interface Collection {
    id: string;
    name: string;
    color?: string;
}

interface CollectionSelectorProps {
    collections: Collection[];
    currentCollectionId?: string | null;
    onSelect: (collectionId: string | null) => void;
    onClose: () => void;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
    collections,
    currentCollectionId,
    onSelect,
    onClose,
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Smart positioning: check if dropdown would overflow viewport
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // If dropdown overflows right edge, align it to the right
            if (rect.right > viewportWidth) {
                ref.current.style.left = 'auto';
                ref.current.style.right = '0';
            }
        }
    }, []);

    const handleSelect = (collectionId: string | null) => {
        onSelect(collectionId);
        onClose();
    };

    return (
        <div
            ref={ref}
            className="absolute left-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20 max-h-64 overflow-y-auto"
        >
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Move to Collection
            </div>

            {/* No Collection Option */}
            <button
                onClick={() => handleSelect(null)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
                <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span>No Collection</span>
                </div>
                {currentCollectionId === null && (
                    <Check className="w-4 h-4 text-blue-600" />
                )}
            </button>

            <div className="border-t border-gray-200 my-1" />

            {/* Collections */}
            {collections.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No collections available
                </div>
            ) : (
                collections.map((collection) => (
                    <button
                        key={collection.id}
                        onClick={() => handleSelect(collection.id)}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded flex-shrink-0"
                                style={{ backgroundColor: collection.color || '#3B82F6' }}
                            />
                            <span className="truncate">{collection.name}</span>
                        </div>
                        {currentCollectionId === collection.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                        )}
                    </button>
                ))
            )}
        </div>
    );
};

export default CollectionSelector;
