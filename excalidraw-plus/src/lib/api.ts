import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6602';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (userData: { email: string; username: string; password: string }) =>
    api.post('/auth/register', userData),

  logout: () => api.post('/auth/logout'),

  refreshToken: () => api.post('/auth/refresh'),
};

// 用户相关 API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: { username?: string; email?: string }) =>
    api.put('/users/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/profile', data),

  updateAvatar: (avatarUrl: string) =>
    api.put('/users/avatar', { avatar: avatarUrl }),

  getStats: () => api.get('/users/stats'),
};

// 绘图相关 API
export const drawingAPI = {
  getDrawings: (params?: { page?: number; limit?: number; search?: string; collectionId?: string; tagId?: string }) =>
    api.get('/drawings', { params }),

  getDrawing: (id: string) => api.get(`/drawings/${id}`),

  createDrawing: (data: { title: string; content?: any; isPublic?: boolean; thumbnail?: string; collectionId?: string; tagIds?: string[] }) =>
    api.post('/drawings', data),

  updateDrawing: (id: string, data: { title?: string; content?: any; isPublic?: boolean; thumbnail?: string; collectionId?: string | null }) =>
    api.put(`/drawings/${id}`, data),

  deleteDrawing: (id: string) => api.delete(`/drawings/${id}`),

  exportDrawing: (id: string, format: 'json' | 'png' | 'svg' = 'json') =>
    api.get(`/drawings/${id}/export`, { params: { format } }),

  // 标签管理
  assignTags: (id: string, tagIds: string[]) =>
    api.post(`/drawings/${id}/tags`, { tagIds }),

  assignTag: (id: string, tagId: string) =>
    api.post(`/drawings/${id}/tags`, { tagIds: [tagId] }),

  removeTag: (id: string, tagId: string) =>
    api.delete(`/drawings/${id}/tags/${tagId}`),
};

// 文件相关 API
export const fileAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getFiles: (params?: { page?: number; limit?: number }) =>
    api.get('/files', { params }),

  getFile: (id: string) => api.get(`/files/${id}`),

  deleteFile: (id: string) => api.delete(`/files/${id}`),
};

// 协作相关 API (预留接口)
export const collaborationAPI = {
  getCollaborators: (drawingId: string) =>
    api.get(`/collaboration/${drawingId}/collaborators`),

  inviteCollaborator: (drawingId: string, data: { email: string; permission: string }) =>
    api.post(`/collaboration/${drawingId}/invite`, data),

  updatePermission: (drawingId: string, userId: string, permission: string) =>
    api.put(`/collaboration/${drawingId}/collaborators/${userId}`, { permission }),

  removeCollaborator: (drawingId: string, userId: string) =>
    api.delete(`/collaboration/${drawingId}/collaborators/${userId}`),

  getActivity: (drawingId: string) =>
    api.get(`/collaboration/${drawingId}/activity`),
};

// 工作空间相关 API
export const workspaceAPI = {
  getWorkspaces: () => api.get('/workspaces'),

  getWorkspace: (id: string) => api.get(`/workspaces/${id}`),

  createWorkspace: (data: { name: string; description?: string; logo?: string }) =>
    api.post('/workspaces', data),

  updateWorkspace: (id: string, data: { name?: string; description?: string; logo?: string }) =>
    api.put(`/workspaces/${id}`, data),

  deleteWorkspace: (id: string) => api.delete(`/workspaces/${id}`),

  getMembers: (id: string) => api.get(`/workspaces/${id}/members`),

  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post(`/workspaces/${id}/invite`, data),
};

// 集合相关 API
export const collectionAPI = {
  getCollections: (workspaceId: string) =>
    api.get('/collections', { params: { workspaceId } }),

  getCollection: (id: string) => api.get(`/collections/${id}`),

  createCollection: (data: {
    name: string;
    description?: string;
    workspaceId: string;
    visibility?: 'private' | 'team' | 'public';
    color?: string;
  }) => api.post('/collections', data),

  updateCollection: (id: string, data: {
    name?: string;
    description?: string;
    visibility?: 'private' | 'team' | 'public';
    color?: string;
  }) => api.put(`/collections/${id}`, data),

  deleteCollection: (id: string) => api.delete(`/collections/${id}`),
};

// 标签相关 API
export const tagAPI = {
  getTags: () => api.get('/tags'),

  getTag: (id: string) => api.get(`/tags/${id}`),

  createTag: (data: { name: string; color?: string }) =>
    api.post('/tags', data),

  updateTag: (id: string, data: { name?: string; color?: string }) =>
    api.put(`/tags/${id}`, data),

  deleteTag: (id: string) => api.delete(`/tags/${id}`),
};
