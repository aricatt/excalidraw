import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Trash2, Edit2, X } from 'lucide-react';
import { commentAPI } from '../../lib/commentAPI';
import type { Comment } from '../../types/comment';
import './CommentsPanel.css';

interface CommentsPanelProps {
    drawingId: string;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ drawingId }) => {
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const queryClient = useQueryClient();

    // 获取评论列表
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['comments', drawingId],
        queryFn: () => commentAPI.getComments(drawingId),
        enabled: !!drawingId,
    });

    // 创建评论
    const createMutation = useMutation({
        mutationFn: commentAPI.createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
            setNewComment('');
        },
    });

    // 更新评论
    const updateMutation = useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) =>
            commentAPI.updateComment(id, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
            setEditingId(null);
            setEditContent('');
        },
    });

    // 删除评论
    const deleteMutation = useMutation({
        mutationFn: commentAPI.deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            createMutation.mutate({
                drawingId,
                content: newComment.trim(),
            });
        }
    };

    const handleEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const handleUpdate = (id: string) => {
        if (editContent.trim()) {
            updateMutation.mutate({ id, content: editContent.trim() });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="comments-panel">
                <div className="comments-loading">Loading comments...</div>
            </div>
        );
    }

    return (
        <div className="comments-panel">
            <div className="comments-header">
                <MessageSquare size={20} />
                <h3>Comments</h3>
                <span className="comments-count">{comments.length}</span>
            </div>

            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="comments-empty">
                        <MessageSquare size={48} />
                        <p>No comments yet</p>
                        <span>Be the first to add a comment</span>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-avatar">
                                    {comment.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="comment-meta">
                                    <span className="comment-author">{comment.userName}</span>
                                    <span className="comment-time">{formatDate(comment.createdAt)}</span>
                                </div>
                                <div className="comment-actions">
                                    <button
                                        onClick={() => handleEdit(comment)}
                                        className="comment-action-btn"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteMutation.mutate(comment.id)}
                                        className="comment-action-btn comment-delete"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {editingId === comment.id ? (
                                <div className="comment-edit">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="comment-edit-input"
                                        autoFocus
                                    />
                                    <div className="comment-edit-actions">
                                        <button
                                            onClick={() => handleUpdate(comment.id)}
                                            className="comment-edit-save"
                                            disabled={!editContent.trim()}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="comment-edit-cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="comment-content">{comment.content}</div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="comment-input-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                    rows={3}
                />
                <button
                    type="submit"
                    className="comment-submit"
                    disabled={!newComment.trim() || createMutation.isPending}
                >
                    <Send size={16} />
                    <span>{createMutation.isPending ? 'Sending...' : 'Send'}</span>
                </button>
            </form>
        </div>
    );
};
