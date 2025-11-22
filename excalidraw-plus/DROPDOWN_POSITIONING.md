# 下拉菜单定位优化

## 问题描述

在 Dashboard 的绘图卡片上,点击标签或集合按钮时:
1. 使用 `right-0` 定位时,靠左的卡片菜单会被侧边栏遮挡
2. 使用 `left-0` 定位时,靠右的卡片菜单会超出浏览器窗口

## 最终解决方案: 智能定位 ✅

实现了一个智能定位系统,根据下拉菜单在视口中的位置,动态调整对齐方式:

1. **默认**: 使用 `left-0`,从按钮左侧开始向右展开
2. **智能调整**: 如果菜单会超出视口右边缘,自动切换为 `right-0`

### 实现代码

```typescript
React.useEffect(() => {
    // Smart positioning: check if dropdown would overflow viewport
    if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // If dropdown overflows right edge, align it to the right
        if (rect.right > viewportWidth) {
            ref.current.style.left = 'auto';
            ref.current.style.right = '0';
        }
    }
}, []);
```

### 工作原理

```
视口检测逻辑:
┌─────────────────────────────────────────┐
│ 侧边栏 | [左侧卡片]  [中间卡片]  [右侧卡片] │
│        |   [按钮]      [按钮]      [按钮]   │
│        |   [菜单→]     [菜单→]     [←菜单]  │
│        |   left-0      left-0      right-0  │
└─────────────────────────────────────────┘
         ↑             ↑             ↑
      默认向右      默认向右      检测到溢出,
                                  自动切换向左
```

## 修改的文件

### 1. TagSelector.tsx

**添加的功能**:
- ✅ 使用 `useRef` 获取 DOM 元素引用
- ✅ 在 `useEffect` 中检测视口溢出
- ✅ 动态调整 CSS 样式

### 2. CollectionSelector.tsx

**添加的功能**:
- ✅ 添加 `useRef` 和 `useEffect`
- ✅ 实现相同的智能定位逻辑

## 优势

✅ **自适应**: 自动适应不同屏幕尺寸和卡片位置
✅ **简单**: 不需要复杂的位置计算
✅ **高效**: 只在组件挂载时检测一次
✅ **可靠**: 适用于所有网格布局场景

## 测试场景

### ✅ 场景1: 靠左的卡片
- 菜单从左侧展开(`left-0`)
- 不会被侧边栏遮挡

### ✅ 场景2: 中间的卡片
- 菜单从左侧展开(`left-0`)
- 完整显示在视口内

### ✅ 场景3: 靠右的卡片
- 检测到会溢出视口
- 自动切换为从右侧展开(`right-0`)
- 不会超出浏览器窗口

## 其他考虑的方案

### 方案1: 统一使用 left-0(已废弃)

**问题**: 右侧卡片的菜单会超出视口

### 方案2: 统一使用 right-0(已废弃)

**问题**: 左侧卡片的菜单会被侧边栏遮挡

### 方案3: 智能定位(已采用) ✅

**优点**: 
- 自动适应所有位置
- 实现简单
- 性能良好

## 性能考虑

- ✅ 只在组件挂载时执行一次检测
- ✅ 使用原生 `getBoundingClientRect()` API
- ✅ 没有额外的事件监听器
- ✅ 不影响渲染性能
