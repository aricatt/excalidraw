# 自定义确认对话框实现

## 概述

将编辑器的退出确认从浏览器原生 `confirm()` 对话框升级为自定义 React 组件对话框。

## 优势

### 浏览器原生 confirm() 的问题
- ❌ 样式无法自定义,与应用风格不统一
- ❌ 只能有两个按钮(OK/Cancel)
- ❌ 阻塞整个浏览器窗口
- ❌ 用户体验较差
- ❌ 无法添加图标和丰富的UI元素

### 自定义对话框的优势
- ✅ 完全自定义样式,与应用风格一致
- ✅ 支持多个按钮(最多3个)
- ✅ 只阻塞应用,不影响浏览器
- ✅ 更好的用户体验
- ✅ 可以添加图标、颜色、动画等
- ✅ 响应式设计,适配移动端

## 组件设计

### ConfirmDialog 组件

**位置**: `src/components/ConfirmDialog/ConfirmDialog.tsx`

**特性**:
- 支持 3 种类型: `warning`, `danger`, `info`
- 支持最多 3 个按钮
- 背景遮罩层(点击关闭)
- 淡入动画效果
- 响应式设计

**Props**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;              // 是否显示
  title: string;                // 标题
  message: string;              // 消息内容
  type?: 'warning' | 'danger' | 'info';  // 类型
  confirmText?: string;         // 确认按钮文本
  cancelText?: string;          // 取消按钮文本
  showThirdButton?: boolean;    // 是否显示第三个按钮
  thirdButtonText?: string;     // 第三个按钮文本
  onConfirm: () => void;        // 确认回调
  onCancel: () => void;         // 取消回调
  onThirdAction?: () => void;   // 第三个按钮回调
}
```

## 使用示例

### 编辑器退出确认

```tsx
<ConfirmDialog
  isOpen={showExitDialog}
  title="Unsaved Changes"
  message="You have unsaved changes. What would you like to do?"
  type="warning"
  confirmText="Save & Leave"
  cancelText="Stay"
  showThirdButton={true}
  thirdButtonText="Discard & Leave"
  onConfirm={handleSaveAndExit}
  onCancel={handleCancelExit}
  onThirdAction={handleDiscardAndExit}
/>
```

### 删除确认

```tsx
<ConfirmDialog
  isOpen={showDeleteDialog}
  title="Delete Drawing"
  message="Are you sure you want to delete this drawing? This action cannot be undone."
  type="danger"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteDialog(false)}
/>
```

## 工作流程

### 编辑器退出流程

1. 用户点击 Back 按钮
2. 检查是否有未保存的更改
   - **无更改**: 直接返回 Dashboard
   - **有更改**: 显示确认对话框

3. 对话框提供 3 个选项:
   - **Save & Leave**: 保存更改并返回
   - **Discard & Leave**: 放弃更改并返回  
   - **Stay**: 留在编辑器继续编辑

## 样式设计

### 颜色方案

- **Warning (警告)**: 黄色主题
  - 图标: `text-yellow-600`
  - 按钮: `bg-yellow-600 hover:bg-yellow-700`

- **Danger (危险)**: 红色主题
  - 图标: `text-red-600`
  - 按钮: `bg-red-600 hover:bg-red-700`

- **Info (信息)**: 蓝色主题
  - 图标: `text-blue-600`
  - 按钮: `bg-blue-600 hover:bg-blue-700`

### 动画效果

- 淡入效果: `fade-in`
- 缩放效果: `zoom-in`
- 过渡时间: `duration-200`

## 可复用性

这个对话框组件可以在整个应用中复用,用于:

1. ✅ 编辑器退出确认
2. ✅ 删除绘图确认
3. ✅ 删除集合确认
4. ✅ 删除标签确认
5. ✅ 重要操作的二次确认

## 未来优化

1. 添加更多对话框类型(success, error)
2. 支持自定义图标
3. 支持富文本内容
4. 添加键盘快捷键(ESC关闭, Enter确认)
5. 添加更多动画效果
6. 支持拖拽移动对话框
