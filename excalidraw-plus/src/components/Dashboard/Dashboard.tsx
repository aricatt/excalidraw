import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LogOut, FileText, Trash2, Loader2, FolderPlus, MoreVertical, FolderInput, Tag as TagIcon, Tags } from 'lucide-react';
import { drawingAPI, workspaceAPI, collectionAPI, tagAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import CollectionDialog from '../CollectionDialog/CollectionDialog';
import CollectionList from '../CollectionList/CollectionList';
import CollectionSelector from '../CollectionSelector/CollectionSelector';
import SearchBar from '../SearchBar/SearchBar';
import TagDialog from '../TagDialog/TagDialog';
import TagList from '../TagList/TagList';
import TagSelector from '../TagSelector/TagSelector';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tag states
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [tagMenuId, setTagMenuId] = useState<string | null>(null);

  // 初始化认证状态
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 如果未登录,重定向到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // 获取工作空间列表
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await workspaceAPI.getWorkspaces();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // 创建默认工作空间
  const createWorkspaceMutation = useMutation({
    mutationFn: () =>
      workspaceAPI.createWorkspace({
        name: 'My Workspace',
        description: 'Default workspace',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const workspaces = workspacesData?.workspaces || [];
  const defaultWorkspaceId = workspaces[0]?.id;

  // 自动创建默认工作空间(如果没有)
  useEffect(() => {
    if (isAuthenticated && !isLoadingWorkspaces && workspaces.length === 0 && !createWorkspaceMutation.isPending) {
      createWorkspaceMutation.mutate();
    }
  }, [isAuthenticated, isLoadingWorkspaces, workspaces.length, createWorkspaceMutation]);

  // 获取集合列表
  const { data: collectionsData } = useQuery({
    queryKey: ['collections', defaultWorkspaceId],
    queryFn: async () => {
      if (!defaultWorkspaceId) return { collections: [] };
      const response = await collectionAPI.getCollections(defaultWorkspaceId);
      return response.data;
    },
    enabled: isAuthenticated && !!defaultWorkspaceId,
  });

  // 获取标签列表
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await tagAPI.getTags();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // 获取绘图列表
  const { data: drawingsData, isLoading: isLoadingDrawings } = useQuery({
    queryKey: ['drawings', selectedCollectionId, selectedTagId, searchQuery],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (selectedCollectionId) {
        params.collectionId = selectedCollectionId;
      }
      if (selectedTagId) {
        params.tagId = selectedTagId;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await drawingAPI.getDrawings(params);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // 创建集合
  const createCollectionMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => {
      if (!defaultWorkspaceId) {
        throw new Error('No workspace available');
      }
      return collectionAPI.createCollection({
        ...data,
        workspaceId: defaultWorkspaceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  // 更新集合
  const updateCollectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      collectionAPI.updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setEditingCollection(null);
    },
  });

  // 删除集合
  const deleteCollectionMutation = useMutation({
    mutationFn: collectionAPI.deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      if (selectedCollectionId) {
        setSelectedCollectionId(null);
      }
    },
  });

  // 删除绘图
  const deleteMutation = useMutation({
    mutationFn: drawingAPI.deleteDrawing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
    },
  });

  // 创建新绘图
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await drawingAPI.createDrawing({
        title: `Untitled ${new Date().toLocaleString()} `,
        collectionId: selectedCollectionId || undefined,
        content: {
          type: 'excalidraw',
          version: 2,
          source: 'https://excalidraw.com',
          elements: [],
          appState: {},
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      navigate(`/editor/${data.drawing.id}`);
    },
  });

  // 移动绘图到集合
  const moveToCollectionMutation = useMutation({
    mutationFn: ({ drawingId, collectionId }: { drawingId: string; collectionId: string | null }) =>
      drawingAPI.updateDrawing(drawingId, { collectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setMoveMenuId(null);
    },
  });

  // 切换绘图标签
  const toggleTagMutation = useMutation({
    mutationFn: async ({ drawingId, tagId, isAssigned }: { drawingId: string; tagId: string; isAssigned: boolean }) => {
      if (isAssigned) {
        // Remove tag
        return drawingAPI.removeTag(drawingId, tagId);
      } else {
        // Assign tag
        return drawingAPI.assignTag(drawingId, tagId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  // 创建标签
  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => tagAPI.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsTagDialogOpen(false);
      setEditingTag(null);
    },
  });

  // 更新标签
  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      tagAPI.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsTagDialogOpen(false);
      setEditingTag(null);
    },
  });

  // 删除标签
  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => tagAPI.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleCreateDrawing = () => {
    createMutation.mutate();
  };

  const handleDeleteDrawing = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this drawing?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateCollection = (data: { name: string; description?: string; color?: string }) => {
    createCollectionMutation.mutate(data);
  };

  const handleEditCollection = (collection: any) => {
    setEditingCollection(collection);
    setIsCollectionDialogOpen(true);
  };

  const handleUpdateCollection = (data: { name: string; description?: string; color?: string }) => {
    if (editingCollection) {
      updateCollectionMutation.mutate({
        id: editingCollection.id,
        data,
      });
    }
  };

  const handleMoveToCollection = (drawingId: string, collectionId: string | null) => {
    moveToCollectionMutation.mutate({ drawingId, collectionId });
  };

  // Handle collection selection - clear tag filter
  const handleSelectCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
    setSelectedTagId(null); // Clear tag selection when selecting a collection
  };

  // Handle tag selection - clear collection filter
  const handleSelectTag = (tagId: string | null) => {
    setSelectedTagId(tagId);
    setSelectedCollectionId(null); // Clear collection selection when selecting a tag
  };

  const drawings = drawingsData?.drawings || [];
  const collections = collectionsData?.collections || [];
  const tags = tagsData?.tags || [];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Excalidraw Plus</h1>
          {user && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              {user.username}
            </p>
          )}
        </div>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Collections</h2>
            <button
              onClick={() => {
                setEditingCollection(null);
                setIsCollectionDialogOpen(true);
              }}
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Create collection"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <CollectionList
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={handleSelectCollection}
            onEditCollection={handleEditCollection}
            onDeleteCollection={(id) => deleteCollectionMutation.mutate(id)}
            onDropDrawing={handleMoveToCollection}
          />

          {/* Tags */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Tags</h2>
              <button
                onClick={() => {
                  setEditingTag(null);
                  setIsTagDialogOpen(true);
                }}
                className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Create tag"
              >
                <Tags className="w-4 h-4" />
              </button>
            </div>

            <TagList
              tags={tags}
              selectedTagId={selectedTagId}
              onSelectTag={handleSelectTag}
              onEditTag={(tag) => {
                setEditingTag(tag);
                setIsTagDialogOpen(true);
              }}
              onDeleteTag={(id) => {
                if (confirm('Are you sure you want to delete this tag?')) {
                  deleteTagMutation.mutate(id);
                }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCollectionId
                    ? collections.find((c: any) => c.id === selectedCollectionId)?.name || 'Collection'
                    : 'All Drawings'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {drawings.length} {drawings.length === 1 ? 'drawing' : 'drawings'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
              <button
                onClick={handleCreateDrawing}
                disabled={createMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    New Drawing
                  </>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search drawings by title..."
              />
            </div>
          </div>
        </header>

        {/* Drawings Grid */}
        <div className="p-6">
          {isLoadingDrawings ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : drawings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drawings yet</h3>
              <p className="text-gray-600 mb-4">
                {selectedCollectionId
                  ? 'This collection is empty. Create your first drawing!'
                  : 'Create your first drawing to get started!'}
              </p>
              <button
                onClick={handleCreateDrawing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Drawing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {drawings.map((drawing: any) => (
                <div
                  key={drawing.id}
                  className="relative"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('drawingId', drawing.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <Link
                    to={`/editor/${drawing.id}`}
                    className="group bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all block cursor-move"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden rounded-t-lg">
                      {drawing.thumbnail ? (
                        <img
                          src={drawing.thumbnail}
                          alt={drawing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-gray-400" />
                      )}

                      {/* Collection Badge */}
                      {drawing.collection && (
                        <div
                          className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: drawing.collection.color || '#3B82F6' }}
                        >
                          {drawing.collection.name}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {drawing.title}
                      </h3>
                      {drawing.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {drawing.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(drawing.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                          {/* Tag Button */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTagMenuId(tagMenuId === drawing.id ? null : drawing.id);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Manage tags"
                            >
                              <TagIcon className="w-4 h-4" />
                            </button>

                            {tagMenuId === drawing.id && (
                              <TagSelector
                                tags={tags}
                                selectedTagIds={drawing.tags?.map((t: any) => t.tag.id) || []}
                                onToggleTag={(tagId) => {
                                  const isAssigned = drawing.tags?.some((t: any) => t.tag.id === tagId);
                                  toggleTagMutation.mutate({
                                    drawingId: drawing.id,
                                    tagId,
                                    isAssigned: !!isAssigned
                                  });
                                }}
                                onClose={() => setTagMenuId(null)}
                              />
                            )}
                          </div>

                          {/* Move to Collection Button */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMoveMenuId(moveMenuId === drawing.id ? null : drawing.id);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Move to collection"
                            >
                              <FolderInput className="w-4 h-4" />
                            </button>

                            {moveMenuId === drawing.id && (
                              <CollectionSelector
                                collections={collections}
                                currentCollectionId={drawing.collectionId}
                                onSelect={(collectionId) => handleMoveToCollection(drawing.id, collectionId)}
                                onClose={() => setMoveMenuId(null)}
                              />
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeleteDrawing(drawing.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete drawing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Collection Dialog */}
      <CollectionDialog
        isOpen={isCollectionDialogOpen}
        onClose={() => {
          setIsCollectionDialogOpen(false);
          setEditingCollection(null);
        }}
        onSubmit={editingCollection ? handleUpdateCollection : handleCreateCollection}
        initialData={editingCollection}
        title={editingCollection ? 'Edit Collection' : 'Create Collection'}
        submitLabel={editingCollection ? 'Update' : 'Create'}
      />

      {/* Tag Dialog */}
      <TagDialog
        isOpen={isTagDialogOpen}
        onClose={() => {
          setIsTagDialogOpen(false);
          setEditingTag(null);
        }}
        onSave={(data) => {
          if (editingTag) {
            // Update existing tag
            updateTagMutation.mutate({ id: editingTag.id, data });
          } else {
            // Create new tag
            createTagMutation.mutate(data);
          }
        }}
        tag={editingTag}
      />
    </div>
  );
};

export default Dashboard;
