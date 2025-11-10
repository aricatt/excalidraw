# 📝 文本编辑器用户体验改进

## 🎯 问题描述

**之前的问题**：
- 新创建的空文本组件完全不可见
- 用户不知道文本框在哪里
- 只有开始输入文字才能看到组件存在
- 用户体验不够直观

## ✅ 解决方案

### 1. **可视化边框**
- 添加虚线边框 `1px dashed var(--color-gray-40)`
- 使用主题变量，支持明暗模式
- 边框清晰但不突兀

### 2. **背景色**
- 添加半透明背景 `var(--color-surface-lowest)`
- 与应用主题保持一致
- 明暗模式自动适配

### 3. **占位符文本**
- 显示 "点击输入文字..." 提示
- 斜体样式，区别于正常文本
- 支持主题色彩适配

### 4. **内边距和圆角**
- 添加 `2px 4px` 内边距
- `2px` 圆角，现代化外观
- 提升视觉体验

## 🎨 视觉效果

### 明亮模式
```css
.excalidraw-wysiwyg {
  background: var(--color-surface-lowest);
  border: 1px dashed var(--color-gray-40);
  border-radius: 2px;
  padding: 2px 4px;
}

.excalidraw-wysiwyg::placeholder {
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
}
```

### 暗色模式
```css
.theme--dark .excalidraw-wysiwyg::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
```

## 🔧 技术实现

### 修改的文件
1. **`wysiwyg/textWysiwyg.tsx`**
   - 添加边框、背景色、内边距
   - 添加占位符文本逻辑

2. **`css/styles.scss`**
   - 添加占位符样式
   - 支持明暗主题

### 核心代码变更
```typescript
// 添加可视化样式
Object.assign(editable.style, {
  padding: "2px 4px",
  border: "1px dashed var(--color-gray-40)",
  background: "var(--color-surface-lowest)",
  borderRadius: "2px",
  // ... 其他样式
});

// 添加占位符
if (!element.originalText) {
  editable.placeholder = "点击输入文字...";
}
```

## 📱 用户体验改进

### ✅ 改进后的体验
- **立即可见**：空文本框有清晰的视觉边界
- **直观提示**：占位符文字引导用户操作
- **主题一致**：与应用整体设计风格统一
- **现代化**：圆角和适当的内边距

### 🎯 适用场景
- 新建文本组件时
- 编辑空文本时
- 所有文本编辑操作

## 🚀 其他建议

如果需要进一步改进，还可以考虑：

1. **动画效果**
   - 边框颜色渐变
   - 聚焦时的微动画

2. **更多视觉提示**
   - 光标闪烁优化
   - 选中状态高亮

3. **快捷操作**
   - 双击快速选中
   - 右键菜单优化

4. **多语言支持**
   - 占位符文本国际化
   - 根据语言调整提示内容
