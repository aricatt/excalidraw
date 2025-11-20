import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LogOut, FileText, Trash2, Loader2 } from 'lucide-react';
import { drawingAPI, workspaceAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();

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
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await workspaceAPI.getWorkspaces();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // 获取绘图列表
  const { data: drawingsData, isLoading: isLoadingDrawings } = useQuery({
    queryKey: ['drawings'],
    queryFn: async () => {
      const response = await drawingAPI.getDrawings({ limit: 50 });
      return response.data;
    },
    enabled: isAuthenticated,
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
        title: `Untitled ${new Date().toLocaleString()}`,
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

  const drawings = drawingsData?.drawings || [];
  const workspaces = workspacesData?.workspaces || [];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Excalidraw Plus</h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {user.username}!
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreateDrawing}
                disabled={createMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspaces Info */}
        {workspaces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Workspaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workspaces.map((workspace: any) => (
                <div
                  key={workspace.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="text-sm text-gray-600 mt-1">{workspace.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {workspace._count?.collections || 0} collections
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drawings List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Drawings</h2>

          {isLoadingDrawings ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : drawings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drawings yet</h3>
              <p className="text-gray-600 mb-4">Create your first drawing to get started!</p>
              <button
                onClick={handleCreateDrawing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Drawing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drawings.map((drawing: any) => (
                <Link
                  key={drawing.id}
                  to={`/editor/${drawing.id}`}
                  className="group bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {drawing.thumbnail ? (
                      <img
                        src={drawing.thumbnail}
                        alt={drawing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-gray-400" />
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
                      <button
                        onClick={(e) => handleDeleteDrawing(drawing.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete drawing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tags */}
                    {drawing.tags && drawing.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {drawing.tags.map((tagItem: any) => (
                          <span
                            key={tagItem.tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${tagItem.tag.color}20`,
                              color: tagItem.tag.color,
                            }}
                          >
                            {tagItem.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
