# 标签管理功能 - 基础组件已完成

## 🎯 功能概述

标签管理功能允许用户创建、编辑、删除标签,并为绘图分配标签,以及按标签过滤绘图。

## ✅ 已完成组件

### 1. TagDialog 组件
**文件**: `src/components/TagDialog/TagDialog.tsx`

**功能**:
- 创建新标签
- 编辑现有标签
- 标签名称输入
- 8种预设颜色选择器
- 实时预览标签外观

**预设颜色**:
- 红色 (#EF4444)
- 琥珀色 (#F59E0B)
- 绿色 (#10B981)
- 蓝色 (#3B82F6)
- 紫色 (#8B5CF6)
- 粉色 (#EC4899)
- 灰色 (#6B7280)
- 青色 (#14B8A6)

### 2. TagSelector 组件
**文件**: `src/components/TagSelector/TagSelector.tsx`

**功能**:
- 下拉菜单显示所有标签
- 多选标签(勾选标记)
- 点击外部自动关闭
- 滚动支持(最大高度 320px)

### 3. TagList 组件
**文件**: `src/components/TagList/TagList.tsx`

**功能**:
- 侧边栏显示标签列表
- 显示每个标签的绘图数量
- 点击标签过滤绘图
- 编辑和删除标签选项
- 下拉菜单

### 4. API 客户端更新
**文件**: `src/lib/api.ts`

**新增方法**:
```typescript
// 标签 CRUD
tagAPI.getTags()
tagAPI.createTag({ name, color })
tagAPI.updateTag(id, { name, color })
tagAPI.deleteTag(id)

// 绘图标签分配
drawingAPI.assignTags(drawingId, tagIds)
drawingAPI.removeTag(drawingId, tagId)

// 按标签过滤
drawingAPI.getDrawings({ tagId })
```

## 🔄 集成步骤 (待完成)

由于标签功能的复杂性,完整集成需要以下步骤:

### 步骤 1: 获取标签数据
```typescript
const { data: tagsData } = useQuery({
  queryKey: ['tags'],
  queryFn: async () => {
    const response = await tagAPI.getTags();
    return response.data;
  },
  enabled: isAuthenticated,
});
```

### 步骤 2: 标签 CRUD Mutations
```typescript
const createTagMutation = useMutation({
  mutationFn: tagAPI.createTag,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  },
});

const updateTagMutation = useMutation({
  mutationFn: ({ id, data }) => tagAPI.updateTag(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  },
});

const deleteTagMutation = useMutation({
  mutationFn: tagAPI.deleteTag,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['drawings'] });
  },
});
```

### 步骤 3: 绘图标签分配
```typescript
const assignTagsMutation = useMutation({
  mutationFn: ({ drawingId, tagIds }) => 
    drawingAPI.assignTags(drawingId, tagIds),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['drawings'] });
  },
});
```

### 步骤 4: 侧边栏集成
在 Dashboard 侧边栏添加标签部分:
```tsx
{/* Tags Section */}
<div className="px-4 mt-6">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold text-gray-700 uppercase">Tags</h2>
    <button onClick={() => setIsTagDialogOpen(true)}>
      <Tags className="w-4 h-4" />
    </button>
  </div>
  
  <TagList
    tags={tags}
    selectedTagId={selectedTagId}
    onSelectTag={setSelectedTagId}
    onEditTag={handleEditTag}
    onDeleteTag={(id) => deleteTagMutation.mutate(id)}
  />
</div>
```

### 步骤 5: 绘图卡片标签显示
在绘图卡片上显示标签:
```tsx
{/* Tags */}
{drawing.tags && drawing.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {drawing.tags.map((tag) => (
      <span
        key={tag.id}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: tag.color || '#3B82F6' }}
      >
        {tag.name}
      </span>
    ))}
  </div>
)}
```

### 步骤 6: 标签选择器集成
在绘图卡片添加标签按钮:
```tsx
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setTagMenuId(tagMenuId === drawing.id ? null : drawing.id);
  }}
  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
  title="Manage tags"
>
  <TagIcon className="w-4 h-4" />
</button>

{tagMenuId === drawing.id && (
  <TagSelector
    tags={tags}
    selectedTagIds={drawing.tags?.map(t => t.id) || []}
    onToggleTag={(tagId) => handleToggleTag(drawing.id, tagId)}
    onClose={() => setTagMenuId(null)}
  />
)}
```

### 步骤 7: 按标签过滤
更新绘图查询以支持标签过滤:
```typescript
const { data: drawingsData } = useQuery({
  queryKey: ['drawings', selectedCollectionId, selectedTagId, searchQuery],
  queryFn: async () => {
    const params: any = { limit: 50 };
    if (selectedCollectionId) params.collectionId = selectedCollectionId;
    if (selectedTagId) params.tagId = selectedTagId;
    if (searchQuery) params.search = searchQuery;
    const response = await drawingAPI.getDrawings(params);
    return response.data;
  },
});
```

## 📊 数据结构

### Tag
```typescript
interface Tag {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    drawings: number;
  };
}
```

### Drawing with Tags
```typescript
interface Drawing {
  id: string;
  title: string;
  // ... other fields
  tags?: Tag[];
}
```

## 🎨 UI 设计

### 标签徽章
- 圆角胶囊形状
- 白色文字
- 自定义背景颜色
- 小号字体 (text-xs)

### 标签列表
- 侧边栏显示
- 显示绘图计数
- 悬停显示编辑/删除菜单
- 选中时蓝色高亮

### 标签选择器
- 下拉菜单
- 多选支持
- 勾选标记表示已选
- 最大高度 320px,滚动

## 🔧 后端 API

### 标签 CRUD
- `GET /tags` - 获取用户的所有标签
- `POST /tags` - 创建新标签
- `PUT /tags/:id` - 更新标签
- `DELETE /tags/:id` - 删除标签

### 绘图标签关联
- `POST /drawings/:id/tags` - 为绘图分配标签
- `DELETE /drawings/:id/tags/:tagId` - 从绘图移除标签
- `GET /drawings?tagId=xxx` - 按标签过滤绘图

## 💡 使用场景

1. **组织绘图**: 使用标签如 "Work", "Personal", "Ideas"
2. **项目分类**: "Project A", "Project B"
3. **状态标记**: "Draft", "In Progress", "Complete"
4. **优先级**: "High Priority", "Low Priority"
5. **主题**: "Design", "Architecture", "Wireframe"

## 🎯 下一步

要完成标签功能的完整集成,需要:

1. 在 Dashboard 中添加标签查询和 mutations
2. 在侧边栏添加标签部分
3. 在绘图卡片上显示标签
4. 添加标签选择器按钮
5. 实现标签过滤逻辑
6. 添加标签对话框触发器

**预计时间**: 30-45 分钟

## 📁 文件结构

```
excalidraw-plus/src/components/
├── TagDialog/
│   └── TagDialog.tsx          # ✅ 已完成
├── TagSelector/
│   └── TagSelector.tsx        # ✅ 已完成
├── TagList/
│   └── TagList.tsx            # ✅ 已完成
└── Dashboard/
    └── Dashboard.tsx          # ⏳ 需要集成
```

---

**组件完成度**: 100%  
**集成完成度**: 20%  
**总体完成度**: 60%  
**最后更新**: 2025-11-21 23:40
