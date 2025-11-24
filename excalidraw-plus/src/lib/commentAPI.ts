import { api } from './api';
import type { Comment, CreateCommentInput, UpdateCommentInput } from '../types/comment';

export const commentAPI = {
    // 获取绘图的所有评论
    getComments: async (drawingId: string): Promise<Comment[]> => {
        const response = await api.get(`/drawings/${drawingId}/comments`);
        return response.data;
    },

    // 创建新评论
    createComment: async (input: CreateCommentInput): Promise<Comment> => {
        const response = await api.post(
            `/drawings/${input.drawingId}/comments`,
            input
        );
        return response.data;
    },

    // 更新评论
    updateComment: async (id: string, input: UpdateCommentInput): Promise<Comment> => {
        const response = await api.put(`/comments/${id}`, input);
        return response.data;
    },

    // 删除评论
    deleteComment: async (id: string): Promise<void> => {
        await api.delete(`/comments/${id}`);
    },
};

