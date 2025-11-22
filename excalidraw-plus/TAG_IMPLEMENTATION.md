# 标签功能实现总结

## 已完成的功能

### 1. 后端修复 ✅

#### 修复标签计数问题
**文件**: `servers/api-service/src/routes/tags.ts`

**问题**: 标签计数显示的是所有用户的绘图数量,导致点击标签后显示空列表

**解决方案**: 修改 `GET /tags` API,只计算当前登录用户的绘图数量

```typescript
// 为每个标签计算当前用户的绘图数量
const tagsWithCount = await Promise.all(
    tags.map(async (tag) => {
        const count = await fastify.prisma.drawingTag.count({
            where: {
                tagId: tag.id,
                drawing: {
                    userId: userId,  // 只计算当前用户的绘图
                },
            },
        });
        return {
            ...tag,
            _count: { drawings: count },
        };
    })
);
```

### 2. 前端功能实现 ✅

#### 2.1 标签按钮添加到绘图卡片
**文件**: `src/components/Dashboard/Dashboard.tsx`

在每个绘图卡片的底部添加了标签图标按钮,位于移动到集合按钮之前:

```tsx
{/* Tag Button */}
<div className="relative">
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setTagMenuId(tagMenuId === drawing.id ? null : drawing.id);
    }}
    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
    title="Manage tags"
  >
    <TagIcon className="w-4 h-4" />
  </button>

  {tagMenuId === drawing.id && (
    <TagSelector
      tags={tags}
      selectedTagIds={drawing.tags?.map((t: any) => t.tag.id) || []}
      onToggleTag={handleToggleTag}
      onClose={() => setTagMenuId(null)}
    />
  )}
</div>
```

#### 2.2 标签切换功能
添加了 `toggleTagMutation` 来处理标签的分配和移除:

```typescript
const toggleTagMutation = useMutation({
  mutationFn: async ({ drawingId, tagId, isAssigned }) => {
    if (isAssigned) {
      return drawingAPI.removeTag(drawingId, tagId);
    } else {
      return drawingAPI.assignTag(drawingId, tagId);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['drawings'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  },
});
```

#### 2.3 API 方法扩展
**文件**: `src/lib/api.ts`

添加了单个标签分配方法:

```typescript
assignTag: (id: string, tagId: string) =>
  api.post(`/drawings/${id}/tags`, { tagIds: [tagId] }),
```

### 3. 已修复的 Bug ✅

#### Bug 1: 标签和集合筛选冲突
**问题**: 选择标签后切换到集合,绘图列表为空

**解决方案**: 添加了互斥逻辑
- 选择集合时自动清除标签筛选
- 选择标签时自动清除集合筛选

```typescript
const handleSelectCollection = (collectionId: string | null) => {
  setSelectedCollectionId(collectionId);
  setSelectedTagId(null); // 清除标签选择
};

const handleSelectTag = (tagId: string | null) => {
  setSelectedTagId(tagId);
  setSelectedCollectionId(null); // 清除集合选择
};
```

#### Bug 2: 标签计数不准确
**问题**: 标签显示的数字包含其他用户的绘图

**解决方案**: 后端API只计算当前用户的绘图数量

## 如何使用

### 给绘图添加标签

1. 在 Dashboard 上找到任意绘图卡片
2. 在卡片底部右侧,点击**标签图标**按钮(绿色悬停效果)
3. 在弹出的下拉菜单中,点击要添加的标签
4. 已分配的标签会显示勾选标记 ✓
5. 再次点击已选中的标签可以移除它

### 通过标签筛选绘图

1. 在左侧边栏的 **TAGS** 部分
2. 点击任意标签名称
3. 主区域会只显示包含该标签的绘图
4. 标签名称后的数字 `(n)` 表示你有多少个绘图使用了该标签

### 创建新标签

1. 在左侧边栏 **TAGS** 部分,点击 **+** 按钮
2. 输入标签名称
3. 选择标签颜色
4. 点击 **Create** 按钮

## Collections vs Tags 的区别

| 特性 | Collection (集合) | Tag (标签) |
|------|------------------|-----------|
| **关系** | 一对一 (每个绘图只能属于一个集合) | 多对多 (每个绘图可以有多个标签) |
| **用途** | 主要组织方式,类似文件夹 | 辅助分类,交叉标记 |
| **所有权** | 属于 workspace | 全局共享 |
| **类比** | 文件夹/项目 | 标签/分类 |
| **筛选** | 互斥(选择集合时清除标签筛选) | 互斥(选择标签时清除集合筛选) |

## 技术细节

### 数据库关系
- `Drawing` ↔ `Collection`: 多对一关系(通过 `collectionId`)
- `Drawing` ↔ `Tag`: 多对多关系(通过 `DrawingTag` 中间表)

### API 端点
- `GET /tags` - 获取所有标签(包含当前用户的绘图计数)
- `POST /drawings/:id/tags` - 为绘图分配标签
- `DELETE /drawings/:id/tags/:tagId` - 从绘图移除标签

### 状态管理
- 使用 React Query 进行数据获取和缓存
- 使用 `useMutation` 处理标签的增删操作
- 操作成功后自动刷新相关查询(`drawings` 和 `tags`)

## 待完善功能

1. **创建标签的 Mutation** - 目前创建标签对话框已有UI,但缺少后端调用
2. **删除标签的 Mutation** - TagList 中的删除按钮需要实现
3. **编辑标签的 Mutation** - 修改标签名称和颜色
4. **在绘图卡片上显示标签** - 可以在缩略图上显示标签徽章
5. **批量标签操作** - 一次为多个绘图添加/移除标签

## 测试建议

1. 创建几个不同颜色的标签
2. 为不同的绘图分配不同的标签组合
3. 测试标签筛选功能
4. 验证标签计数是否正确
5. 测试标签和集合筛选的互斥行为
