import React, { useState, useRef, useEffect } from 'react';
import {
    X, ChevronLeft, ChevronRight, Check, Link as LinkIcon,
    Trash2, Smile, MoreVertical, AtSign, ArrowUp
} from 'lucide-react';
import type { Comment } from '../../types/comment';
import './CommentBubble.css';

interface CommentBubbleProps {
    comment: Comment;
    x: number;
    y: number;
    isExpanded: boolean;
    onToggle: () => void;
    onReply: (content: string) => void;
    onDelete: () => void;
    replies?: Comment[];
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({
    comment,
    x,
    y,
    isExpanded,
    onToggle,
    onReply,
    onDelete,
    replies = [],
}) => {
    const [replyText, setReplyText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 自动调整 textarea 高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [replyText]);

    const handleReply = () => {
        if (replyText.trim()) {
            onReply(replyText.trim());
            setReplyText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleReply();
        }
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

    // 渲染单个评论项
    const renderCommentItem = (item: Comment, isReply: boolean = false) => (
        <div key={item.id} className={`comment-item ${isReply ? 'is-reply' : ''}`}>
            <div className="comment-item-header">
                <div className="comment-user-info">
                    <div className="comment-avatar-small">
                        {item.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="comment-author">{item.userName}</span>
                    <span className="comment-dot">•</span>
                    <span className="comment-time">{formatDate(item.createdAt)}</span>
                </div>
                <button className="comment-more-btn">
                    <MoreVertical size={14} />
                </button>
            </div>
            <div className="comment-content">{item.content}</div>
            <div className="comment-reactions">
                <button className="comment-reaction-add">
                    <Smile size={14} />
                </button>
            </div>
        </div>
    );

    return (
        <div
            className="comment-bubble"
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -100%)',
            }}
        >
            {/* 收起状态的头像 - 始终显示 */}
            <div className="comment-avatar-collapsed" onClick={onToggle}>
                <div className="comment-avatar-circle">
                    {comment.userName.charAt(0).toUpperCase()}
                </div>
                {replies.length > 0 && (
                    <div className="comment-badge">{replies.length + 1}</div>
                )}
            </div>

            {/* 展开的评论卡片 - 显示在头像旁边 */}
            {isExpanded && (
                <div className="comment-card">
                    {/* 顶部工具栏 */}
                    <div className="comment-toolbar">
                        <div className="comment-toolbar-title">
                            {replies.length > 0 ? `${replies.length + 1} comments` : '1 comment'}
                        </div>
                    </div>

                    {/* 绝对定位的动作按钮 */}
                    <div className="comment-actions-absolute">
                        <button
                            className="comment-action-btn delete"
                            onClick={onDelete}
                            title="Delete Thread"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button
                            className="comment-action-btn"
                            onClick={onToggle}
                            title="Close"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    {/* 评论列表 */}
                    <div className="comment-thread">
                        {renderCommentItem(comment)}
                        {replies.map(reply => renderCommentItem(reply, true))}
                    </div>

                    {/* 底部输入框 */}
                    <div className="comment-footer">
                        <div className="comment-input-wrapper">
                            <textarea
                                ref={textareaRef}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Reply, @mention someone..."
                                rows={1}
                            />
                            <div className="comment-input-tools">
                                <div className="comment-input-left">
                                    <button className="comment-tool-btn"><Smile size={16} /></button>
                                    <button className="comment-tool-btn"><AtSign size={16} /></button>
                                </div>
                                <button
                                    className="comment-send-btn"
                                    onClick={handleReply}
                                    disabled={!replyText.trim()}
                                >
                                    <ArrowUp size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
