import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FolderPlus, Tags, LogOut, ChevronLeft, ChevronRight,
    FileText, Home
} from 'lucide-react';
import { collectionAPI, tagAPI, drawingAPI, workspaceAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import CollectionList from '../CollectionList/CollectionList';
import TagList from '../TagList/TagList';

interface AppSidebarProps {
    mode?: 'dashboard' | 'editor';
    currentDrawingId?: string;
    // Dashboard props
    selectedCollectionId?: string | null;
    selectedTagId?: string | null;
    onSelectCollection?: (id: string | null) => void;
    onSelectTag?: (id: string | null) => void;
    onEditCollection?: (collection: any) => void;
    onEditTag?: (tag: any) => void;
    onCreateCollection?: () => void;
    onCreateTag?: () => void;
    // Layout props
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
    mode = 'dashboard',
    currentDrawingId,
    selectedCollectionId,
    selectedTagId,
    onSelectCollection,
    onSelectTag,
    onEditCollection,
    onEditTag,
    onCreateCollection,
    onCreateTag,
    isCollapsed,
    onToggleCollapse
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout } = useAuthStore();
    // const [isCollapsed, setIsCollapsed] = useState(false); // Removed internal state

    // --- Data Fetching (Reused from Dashboard) ---

    // 1. Workspaces (needed for default workspace ID)
    const { data: workspacesData } = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const response = await workspaceAPI.getWorkspaces();
            return response.data;
        },
        enabled: !!user,
    });
    const defaultWorkspaceId = workspacesData?.workspaces?.[0]?.id;

    // 2. Collections
    const { data: collectionsData } = useQuery({
        queryKey: ['collections', defaultWorkspaceId],
        queryFn: async () => {
            if (!defaultWorkspaceId) return { collections: [] };
            const response = await collectionAPI.getCollections(defaultWorkspaceId);
            return response.data;
        },
        enabled: !!defaultWorkspaceId,
    });
    const collections = collectionsData?.collections || [];

    // 3. Tags
    const { data: tagsData } = useQuery({
        queryKey: ['tags'],
        queryFn: async () => {
            const response = await tagAPI.getTags();
            return response.data;
        },
        enabled: !!user,
    });
    const tags = tagsData?.tags || [];

    // 4. Current Drawing (for Editor Mode - to get collectionId)
    const { data: currentDrawingData } = useQuery({
        queryKey: ['drawing', currentDrawingId],
        queryFn: async () => {
            if (!currentDrawingId) return null;
            const response = await drawingAPI.getDrawing(currentDrawingId);
            return response.data;
        },
        enabled: mode === 'editor' && !!currentDrawingId,
    });
    const currentDrawing = currentDrawingData?.drawing;
    const currentCollectionId = currentDrawing?.collectionId;

    // 5. Drawings in current collection (for Editor Mode)
    const { data: collectionDrawingsData } = useQuery({
        queryKey: ['drawings', currentCollectionId],
        queryFn: async () => {
            const params: any = { limit: 100 }; // Fetch reasonable amount
            if (currentCollectionId) {
                params.collectionId = currentCollectionId;
            }
            const response = await drawingAPI.getDrawings(params);
            return response.data;
        },
        enabled: mode === 'editor',
    });
    const collectionDrawings = collectionDrawingsData?.drawings || [];

    // --- Mutations ---
    const deleteCollectionMutation = useMutation({
        mutationFn: collectionAPI.deleteCollection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            if (selectedCollectionId && onSelectCollection) {
                onSelectCollection(null);
            }
        },
    });

    const deleteTagMutation = useMutation({
        mutationFn: (id: string) => tagAPI.deleteTag(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['drawings'] });
        },
    });

    const moveToCollectionMutation = useMutation({
        mutationFn: ({ drawingId, collectionId }: { drawingId: string; collectionId: string | null }) =>
            drawingAPI.updateDrawing(drawingId, { collectionId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drawings'] });
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });


    // --- Handlers ---
    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    // --- Render Helpers ---

    const renderDashboardContent = () => (
        <>
            {/* Collections */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                    {!isCollapsed && <h2 className="text-sm font-semibold text-gray-700 uppercase">Collections</h2>}
                    <button
                        onClick={onCreateCollection}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Create collection"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>

                <CollectionList
                    collections={collections}
                    selectedCollectionId={selectedCollectionId || null}
                    onSelectCollection={onSelectCollection || (() => { })}
                    onEditCollection={onEditCollection || (() => { })}
                    onDeleteCollection={(id) => deleteCollectionMutation.mutate(id)}
                    onDropDrawing={(dId, cId) => moveToCollectionMutation.mutate({ drawingId: dId, collectionId: cId })}
                    isCollapsed={isCollapsed}
                />

                {/* Tags */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        {!isCollapsed && <h2 className="text-sm font-semibold text-gray-700 uppercase">Tags</h2>}
                        <button
                            onClick={onCreateTag}
                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Create tag"
                        >
                            <Tags className="w-4 h-4" />
                        </button>
                    </div>

                    <TagList
                        tags={tags}
                        selectedTagId={selectedTagId || null}
                        onSelectTag={onSelectTag || (() => { })}
                        onEditTag={(tag) => onEditTag && onEditTag(tag)}
                        onDeleteTag={(id) => {
                            if (confirm('Are you sure you want to delete this tag?')) {
                                deleteTagMutation.mutate(id);
                            }
                        }}
                        isCollapsed={isCollapsed}
                    />
                </div>
            </div>
        </>
    );

    const renderEditorContent = () => {
        const collectionName = collections.find((c: any) => c.id === currentCollectionId)?.name || 'All Drawings';

        return (
            <div className="flex-1 overflow-y-auto p-2">
                <div className="mb-4 px-2">
                    <Link to="/" className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4">
                        <Home className="w-4 h-4 mr-2" />
                        {!isCollapsed && "Back to Dashboard"}
                    </Link>

                    {!isCollapsed && (
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {collectionName}
                        </h2>
                    )}
                </div>

                <div className="space-y-1">
                    {collectionDrawings.map((drawing: any) => (
                        <Link
                            key={drawing.id}
                            to={`/editor/${drawing.id}`}
                            className={`flex items-center px-2 py-2 text-sm rounded-md transition-colors ${drawing.id === currentDrawingId
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            title={drawing.title}
                        >
                            <FileText className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-2'}`} />
                            {!isCollapsed && (
                                <span className="truncate">{drawing.title || 'Untitled'}</span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <aside
            className={`bg-white border-r flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                } h-screen fixed left-0 top-0 z-50 shadow-lg`}
        >
            {/* Header / Toggle */}
            <div className="p-4 border-b flex items-center justify-between h-16">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                            EP
                        </div>
                        <h1 className="text-lg font-bold text-gray-900 truncate">Excalidraw+</h1>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto text-white font-bold text-xs">
                        EP
                    </div>
                )}

                <button
                    onClick={onToggleCollapse}
                    className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </div>

            {/* Content based on mode */}
            {mode === 'dashboard' ? renderDashboardContent() : renderEditorContent()}

            {/* Footer */}
            <div className="p-4 border-t mt-auto">
                <button
                    onClick={handleLogout}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : ''} w-full gap-2 px-2 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors`}
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default AppSidebar;
