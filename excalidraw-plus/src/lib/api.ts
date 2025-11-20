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
  getDrawings: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/drawings', { params }),
  
  getDrawing: (id: string) => api.get(`/drawings/${id}`),
  
  createDrawing: (data: { title: string; content?: any; isPublic?: boolean }) =>
    api.post('/drawings', data),
  
  updateDrawing: (id: string, data: { title?: string; content?: any; isPublic?: boolean }) =>
    api.put(`/drawings/${id}`, data),
  
  deleteDrawing: (id: string) => api.delete(`/drawings/${id}`),
  
  exportDrawing: (id: string, format: 'json' | 'png' | 'svg' = 'json') =>
    api.get(`/drawings/${id}/export`, { params: { format } }),
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
