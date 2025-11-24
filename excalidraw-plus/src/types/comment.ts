export interface Comment {
    id: string;
    drawingId: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    x?: number;        // 画布 X 坐标
    y?: number;        // 画布 Y 坐标
    // 可选：关联到特定元素
    elementId?: string;
    // 可选：回复功能
    parentId?: string;
}

export interface CreateCommentInput {
    drawingId: string;
    content: string;
    x?: number;        // 画布 X 坐标
    y?: number;        // 画布 Y 坐标
    elementId?: string;
    parentId?: string;
}

export interface UpdateCommentInput {
    content: string;
}
