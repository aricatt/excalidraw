import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentBubble } from '../CommentBubble/CommentBubble';
import { commentAPI } from '../../lib/commentAPI';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import './CommentOverlay.css';

interface CommentOverlayProps {
    drawingId: string;
    excalidrawAPI: any;
    isCommentMode: boolean;
    onExitCommentMode: () => void;
    expandedCommentId: string | null;
    setExpandedCommentId: (id: string | null) => void;
}

export const CommentOverlay: React.FC<CommentOverlayProps> = ({
    drawingId,
    excalidrawAPI,
    isCommentMode,
    onExitCommentMode,
    expandedCommentId,
    setExpandedCommentId,
}) => {
    // const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null); // Removed
    const [viewportState, setViewportState] = useState({ zoom: 1, offsetX: 0, offsetY: 0 });
    const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number } | null>(null);
    const [newCommentText, setNewCommentText] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // 获取评论列表
    const { data: comments = [] } = useQuery({
        queryKey: ['comments', drawingId],
        queryFn: () => commentAPI.getComments(drawingId),
        enabled: !!drawingId,
    });

    // 创建评论
    const createMutation = useMutation({
        mutationFn: commentAPI.createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
            setNewCommentPos(null);
            setNewCommentText('');
        },
    });

    // 删除评论
    const deleteMutation = useMutation({
        mutationFn: commentAPI.deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
        },
    });

    // 创建回复
    const replyMutation = useMutation({
        mutationFn: commentAPI.createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', drawingId] });
        },
    });

    // 监听画布状态变化（缩放、平移）
    useEffect(() => {
        if (!excalidrawAPI) return;

        const updateViewport = () => {
            const appState = excalidrawAPI.getAppState();
            setViewportState({
                zoom: appState.zoom.value,
                offsetX: appState.scrollX,
                offsetY: appState.scrollY,
            });
        };

        updateViewport();
        const interval = setInterval(updateViewport, 100);
        return () => clearInterval(interval);
    }, [excalidrawAPI]);

    // 处理遮罩层点击
    const handleOverlayClick = (event: React.MouseEvent) => {
        if (!excalidrawAPI) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;

        // 转换为画布坐标
        const appState = excalidrawAPI.getAppState();
        const canvasX = (screenX - appState.scrollX) / appState.zoom.value;
        const canvasY = (screenY - appState.scrollY) / appState.zoom.value;

        // 显示输入框
        setNewCommentPos({ x: canvasX, y: canvasY });
        onExitCommentMode();
    };

    // 画布坐标转屏幕坐标
    const canvasToScreen = (canvasX: number, canvasY: number) => {
        const { zoom, offsetX, offsetY } = viewportState;
        return {
            x: canvasX * zoom + offsetX,
            y: canvasY * zoom + offsetY,
        };
    };

    // 获取评论的回复
    const getReplies = (commentId: string) => {
        return comments.filter((c) => c.parentId === commentId);
    };

    // 处理创建评论
    const handleCreateComment = () => {
        if (newCommentText.trim() && newCommentPos) {
            createMutation.mutate({
                drawingId,
                content: newCommentText.trim(),
                x: newCommentPos.x,
                y: newCommentPos.y,
            });
        }
    };

    // 只显示有坐标的顶级评论
    const topLevelComments = comments.filter((c) => !c.parentId && c.x != null && c.y != null);

    return (
        <>
            {/* 评论模式下的点击遮罩层 */}
            {isCommentMode && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999, // 确保在最上层
                        cursor: 'crosshair', // 十字光标提示
                        background: 'rgba(0, 0, 0, 0.05)', // 轻微背景提示
                    }}
                    onClick={handleOverlayClick}
                />
            )}

            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 100,
                }}
            >
                {topLevelComments.map((comment) => {
                    const screenPos = canvasToScreen(comment.x!, comment.y!);
                    const replies = getReplies(comment.id);

                    return (
                        <CommentBubble
                            key={comment.id}
                            comment={comment}
                            x={screenPos.x}
                            y={screenPos.y}
                            isExpanded={expandedCommentId === comment.id}
                            onToggle={() =>
                                setExpandedCommentId((prev) =>
                                    prev === comment.id ? null : comment.id
                                )
                            }
                            onReply={(content) => {
                                replyMutation.mutate({
                                    drawingId,
                                    content,
                                    parentId: comment.id,
                                });
                            }}
                            onDelete={() => {
                                setDeleteConfirmId(comment.id);
                            }}
                            replies={replies}
                        />
                    );
                })}

                {/* 新评论输入框 */}
                {newCommentPos && (
                    <div
                        className="new-comment-input"
                        style={{
                            position: 'absolute',
                            left: `${canvasToScreen(newCommentPos.x, newCommentPos.y).x}px`,
                            top: `${canvasToScreen(newCommentPos.x, newCommentPos.y).y}px`,
                            transform: 'translate(-50%, -100%)',
                            pointerEvents: 'auto',
                        }}
                    >
                        <textarea
                            autoFocus
                            placeholder="Add a comment..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreateComment();
                                } else if (e.key === 'Escape') {
                                    setNewCommentPos(null);
                                    setNewCommentText('');
                                }
                            }}
                        />
                        <div className="new-comment-actions">
                            <button onClick={handleCreateComment} disabled={!newCommentText.trim()}>
                                Add Comment
                            </button>
                            <button
                                onClick={() => {
                                    setNewCommentPos(null);
                                    setNewCommentText('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog - Rendered via Portal to avoid z-index issues */}
            {deleteConfirmId !== null && ReactDOM.createPortal(
                <ConfirmDialog
                    isOpen={true}
                    title="Delete Comment"
                    message="Are you sure you want to delete this comment? This action cannot be undone."
                    type="danger"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => {
                        if (deleteConfirmId) {
                            deleteMutation.mutate(deleteConfirmId);
                            setDeleteConfirmId(null);
                        }
                    }}
                    onCancel={() => setDeleteConfirmId(null)}
                />,
                document.body
            )}
        </>
    );
};
