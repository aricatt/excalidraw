import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Trash2 } from 'lucide-react';
import { commentAPI } from '../../lib/commentAPI';
import './CommentsPanel.css';

interface CommentsPanelProps {
    drawingId: string;
    onSelectComment?: (commentId: string, x: number, y: number) => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ drawingId, onSelectComment }) => {
    const queryClient = useQueryClient();
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

    // 获取评论列表
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['comments', drawingId],
        queryFn: () => commentAPI.getComments(drawingId),
        enabled: !!drawingId,
    });

    // 删除评论
    const deleteMutation = useMutation({
        mutationFn: commentAPI.deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
            setDeleteConfirmId(null);
        },
    });

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

    // 只显示顶级评论（没有 parentId 的）
    const topLevelComments = comments.filter(comment => !comment.parentId);

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
                <span className="comments-count">{topLevelComments.length}</span>
            </div>

            <div className="comments-list">
                {topLevelComments.length === 0 ? (
                    <div className="comments-empty">
                        <MessageSquare size={48} />
                        <p>No comments yet</p>
                        <span>Click on the canvas to add a comment</span>
                    </div>
                ) : (
                    topLevelComments.map((comment) => (
                        <div
                            key={comment.id}
                            className="comment-item cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => {
                                if (comment.x !== undefined && comment.y !== undefined && onSelectComment) {
                                    onSelectComment(comment.id, comment.x, comment.y);
                                }
                            }}
                        >
                            <div className="comment-header">
                                <div className="comment-avatar">
                                    {comment.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="comment-meta">
                                    <span className="comment-author">{comment.userName}</span>
                                    <span className="comment-time">{formatDate(comment.createdAt)}</span>
                                </div>
                                <div className="comment-actions">
                                    {deleteConfirmId === comment.id ? (
                                        <div className="comment-delete-confirm" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => deleteMutation.mutate(comment.id)}
                                                className="comment-confirm-btn comment-confirm-yes"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="comment-confirm-btn comment-confirm-no"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmId(comment.id);
                                            }}
                                            className="comment-action-btn comment-delete"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="comment-content line-clamp-2">
                                {comment.content}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

