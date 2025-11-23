# 技术债务清单

> 本文档记录项目中已知的技术债务，按优先级排序。

## 🔴 高优先级（影响可维护性）

### 1. 语音输入功能需要迁移到外部

**当前状态**：
- 位置：`packages/excalidraw/voice-input/` 和 `packages/excalidraw/components/FloatingVoiceButton.tsx`
- 问题：直接修改了 Excalidraw 核心库代码，包括：
  - 修改了 `components/footer/Footer.tsx`（第 76 行）
  - 直接操作 `app.scene.insertElement()` 和 `app.state`（绕过了公开 API）
  - 依赖内部类型 `AppClassProperties`

**影响**：
- ❌ 合并上游 Excalidraw 更新时会产生 Git 冲突
- ❌ 依赖不稳定的内部 API，官方可能随时修改
- ❌ 无法在其他项目中复用语音功能

**重构方案**：
1. 将 `voice-input/` 目录移动到 `excalidraw-plus/src/plugins/voice-input/`
2. 创建 `excalidraw-plus/src/plugins/VoiceInputPlugin.tsx`
3. 使用 `excalidrawAPI.updateScene()` 替代直接操作 `app.scene`
4. 通过 React Portal 或固定定位渲染按钮，而非修改 `Footer.tsx`

**预计工作量**：2-3 小时

**触发条件**（满足任一即需重构）：
- [ ] 遇到第一次 Git merge 冲突
- [ ] Excalidraw 官方修改了 `app.scene` 或 `app.state` API
- [ ] 需要添加第二个类似的"侵入式功能"
- [ ] 外部核心功能开发完成，有时间优化架构

**参考文档**：
- `doc/00-二次开发指南.md` - 第 4.4 节（与现有功能的集成）
- 重构代码示例见该文档

---

## 🟡 中优先级（影响性能或用户体验）

### 2. （待补充）

---

## 🟢 低优先级（优化项）

### 3. （待补充）

---

## 已解决的技术债

### ✅ （待补充）

---

**更新日期**：2025-11-23  
**维护者**：项目开发团队
