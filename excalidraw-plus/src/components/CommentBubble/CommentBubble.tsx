import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import type { Comment } from '../../types/comment';
import './CommentBubble.css';

interface CommentBubbleProps {
    comment: Comment;
    x: number; // 屏幕坐标
    y: number; // 屏幕坐标
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

    const handleReply = () => {
        if (replyText.trim()) {
            onReply(replyText.trim());
            setReplyText('');
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
            {/* 头像（收起状态） */}
            {!isExpanded && (
                <div className="comment-avatar-collapsed" onClick={onToggle}>
                    <div className="comment-avatar-circle">
                        {comment.userName.charAt(0).toUpperCase()}
                    </div>
                    {replies.length > 0 && (
                        <div className="comment-badge">{replies.length + 1}</div>
                    )}
                </div>
            )}

            {/* 展开的评论卡片 */}
            {isExpanded && (
                <div className="comment-card">
                    <div className="comment-card-header">
                        <div className="comment-avatar-small">
                            {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="comment-meta">
                            <span className="comment-author">{comment.userName}</span>
                            <span className="comment-time">{formatDate(comment.createdAt)}</span>
                        </div>
                        <button className="comment-close-btn" onClick={onToggle}>
                            <X size={16} />
                        </button>
                    </div>

                    <div className="comment-content">{comment.content}</div>

                    {/* 回复列表 */}
                    {replies.length > 0 && (
                        <div className="comment-replies">
                            {replies.map((reply) => (
                                <div key={reply.id} className="comment-reply">
                                    <div className="comment-avatar-tiny">
                                        {reply.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="comment-reply-content">
                                        <div className="comment-reply-header">
                                            <span className="comment-author">{reply.userName}</span>
                                            <span className="comment-time">{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <div className="comment-text">{reply.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 回复输入框 */}
                    <div className="comment-reply-input">
                        <input
                            type="text"
                            placeholder="Add a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleReply();
                                }
                            }}
                        />
                        <button
                            onClick={handleReply}
                            disabled={!replyText.trim()}
                            className="comment-send-btn"
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    {/* 删除按钮 */}
                    <button className="comment-delete-btn" onClick={onDelete}>
                        Delete Comment
                    </button>
                </div>
            )}
        </div>
    );
};
