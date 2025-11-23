# Presentation Mode 功能实现计划

## 功能概述

实现基于 Frame 的演示模式,类似 PPT 的幻灯片播放功能。

## 核心功能

### 1. 右侧 Frames 面板

**位置**: Editor 右侧,独立的侧边栏

**功能**:
- 显示当前画布中所有 Frame 元素的列表
- 每个 Frame 显示缩略图
- 默认按创建顺序排列
- 支持拖拽调整顺序
- 顶部 "+" 按钮创建新 Frame (1600x900)
- "Play" 按钮进入演示模式

**技术要点**:
- 从 `excalidrawAPI.getSceneElements()` 获取所有 `type: "frame"` 的元素
- 使用 `react-beautiful-dnd` 或 `@dnd-kit/core` 实现拖拽排序
- Frame 缩略图使用 `exportToCanvas` 生成

### 2. 创建 Frame

**触发**: 点击右侧栏顶部 "+" 按钮

**行为**:
- 在当前视图中心附近的空白区域创建 Frame
- 固定尺寸: 1600x900
- 使用 `excalidrawAPI.updateScene()` 添加 Frame 元素

**Frame 元素结构**:
```typescript
{
  type: "frame",
  x: number,
  y: number,
  width: 1600,
  height: 900,
  // ... 其他 Excalidraw 元素属性
}
```

### 3. 演示模式

**入口**: 右侧栏 "Play" 按钮

**UI 状态**:
- 全屏显示 (使用浏览器 Fullscreen API)
- 隐藏所有编辑器 UI
- 只显示画布内容
- 底部浮动控制栏

**控制栏**:
- `< Prev` 按钮 (上一页)
- 页码显示 `X / Y`
- `Next >` 按钮 (下一页)
- `Exit` 按钮 (退出演示)

**交互**:
- 键盘左键: 上一页
- 键盘右键: 下一页
- ESC: 退出演示
- 点击 Exit 按钮: 退出演示

**视图跳转**:
- 使用 `excalidrawAPI.scrollToContent(frameElement)` 跳转到指定 Frame
- 自动缩放以适应 Frame 大小

### 4. Frame 排序

**存储**: 
- 在绘图的 `appState` 中存储 Frame 顺序
- 结构: `frameOrder: string[]` (Frame ID 数组)

**默认顺序**:
- 如果没有自定义顺序,按创建时间排序

**拖拽调整**:
- 用户拖拽右侧栏的 Frame 缩略图
- 更新 `frameOrder` 数组
- 保存到 `appState`

## 技术实现

### 组件结构

```
Editor.tsx
├── FramesPanel.tsx (新建)
│   ├── FramesList.tsx (新建)
│   │   └── FrameItem.tsx (新建)
│   └── CreateFrameButton.tsx (新建)
└── PresentationMode.tsx (新建)
    └── PresentationControls.tsx (新建)
```

### 状态管理

```typescript
// Editor.tsx 新增状态
const [isPresentationMode, setIsPresentationMode] = useState(false);
const [currentSlide, setCurrentSlide] = useState(0);
const [frameOrder, setFrameOrder] = useState<string[]>([]);
```

### API 使用

**获取 Frames**:
```typescript
const frames = excalidrawAPI
  .getSceneElements()
  .filter(el => el.type === 'frame');
```

**创建 Frame**:
```typescript
const newFrame = {
  type: 'frame',
  x: viewportX,
  y: viewportY,
  width: 1600,
  height: 900,
  // ... 其他必需属性
};

excalidrawAPI.updateScene({
  elements: [...currentElements, newFrame]
});
```

**跳转到 Frame**:
```typescript
excalidrawAPI.scrollToContent(frameElement, {
  fitToViewport: true,
  animate: true
});
```

**进入/退出全屏**:
```typescript
// 进入
document.documentElement.requestFullscreen();

// 退出
document.exitFullscreen();
```

## 实现步骤

1. ✅ 创建 `FramesPanel` 组件
2. ✅ 实现 Frame 列表显示
3. ✅ 实现创建 Frame 功能
4. ✅ 实现拖拽排序
5. ✅ 创建 `PresentationMode` 组件
6. ✅ 实现演示模式 UI
7. ✅ 实现视图跳转逻辑
8. ✅ 实现键盘快捷键
9. ✅ 测试和优化

## 注意事项

1. **Frame 缩略图生成**: 可能需要性能优化,考虑使用防抖或虚拟滚动
2. **全屏 API 兼容性**: 需要处理浏览器兼容性和用户拒绝全屏的情况
3. **Frame 顺序持久化**: 需要在保存绘图时包含 `frameOrder`
4. **空 Frame 列表**: 如果没有 Frame,显示提示信息
