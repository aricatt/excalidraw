# 04-Dashboard

## 📋 功能概述

Dashboard 是用户登录后的主要工作界面，提供文件概览、快速访问、团队动态和工作效率统计等功能，帮助用户快速了解工作状态并开始创作。

## 🎯 核心功能

### 4.1 文件概览
- **最近修改**: "Recently modified by you" 显示用户最近编辑的文件
- **最近访问**: "Recently visited by you" 显示用户最近查看的文件
- **文件缩略图**: 显示文件预览图和基本信息
- **快速操作**: 直接从 Dashboard 打开、分享、删除文件

### 4.2 快速创建
- **Start drawing**: 快速创建新绘图按钮
- **Import scenes**: 导入现有文件功能
- **Create scene**: 从模板创建新场景
- **模板选择**: 提供常用模板快速开始

### 4.3 团队动态
- **团队成员活动**: "Team-members currently at..." 显示团队实时活动
- **协作状态**: 显示正在协作的文件和成员
- **活动时间线**: 显示团队最近的操作记录
- **在线状态**: 显示团队成员的在线状态

### 4.4 工作空间导航
- **工作空间切换**: 顶部工作空间选择器
- **侧边栏导航**: Dashboard、Workspace settings、Team members 等
- **快速搜索**: 全局搜索功能
- **收藏夹**: 常用文件和集合快速访问

## 🔧 技术实现

### 4.5 数据模型
```typescript
interface DashboardData {
  recentlyModified: Drawing[];
  recentlyVisited: Drawing[];
  teamActivity: TeamActivity[];
  workspaceStats: WorkspaceStats;
  quickActions: QuickAction[];
}

interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: 'created' | 'modified' | 'shared' | 'commented';
  targetType: 'drawing' | 'collection' | 'workspace';
  targetId: string;
  targetName: string;
  timestamp: Date;
}

interface WorkspaceStats {
  totalDrawings: number;
  totalMembers: number;
  activeCollaborations: number;
  storageUsed: number;
  storageLimit: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  category: 'create' | 'import' | 'template';
}
```

### 4.6 API 端点
```typescript
// Dashboard 数据
GET /api/dashboard                    // 获取 Dashboard 数据
GET /api/dashboard/recent-modified    // 获取最近修改文件
GET /api/dashboard/recent-visited     // 获取最近访问文件
GET /api/dashboard/team-activity      // 获取团队活动
GET /api/dashboard/stats              // 获取工作空间统计

// 快速操作
POST /api/drawings/quick-create       // 快速创建绘图
POST /api/drawings/from-template      // 从模板创建
POST /api/import/quick                // 快速导入文件

// 用户活动记录
POST /api/activities/visit            // 记录文件访问
POST /api/activities/action           // 记录用户操作
GET  /api/activities/timeline         // 获取活动时间线
```

## 📱 用户界面

### 4.7 主要布局
- **顶部导航**: 工作空间选择器、搜索框、用户菜单
- **侧边栏**: Dashboard、设置、团队成员等导航
- **主内容区**: 文件概览、快速操作、统计信息
- **底部状态栏**: 在线状态、存储使用情况

### 4.8 文件卡片
- **缩略图**: 文件预览图片
- **文件信息**: 标题、修改时间、创建者
- **操作按钮**: 编辑、分享、删除等快速操作
- **协作指示**: 显示正在协作的成员头像

### 4.9 快速操作区
- **创建按钮**: "Start drawing" 主要操作按钮
- **导入选项**: "Import scenes" 支持多种格式
- **模板库**: "Create scene" 提供模板选择
- **最近操作**: 显示用户最近的操作历史

## ✅ 验收标准

### 4.10 功能验收
- [ ] Dashboard 数据正确加载和显示
- [ ] 最近修改文件列表准确
- [ ] 最近访问文件列表准确
- [ ] 团队活动实时更新
- [ ] 快速创建功能正常
- [ ] 文件导入功能正常
- [ ] 搜索功能正常工作
- [ ] 统计数据准确显示

### 4.11 性能要求
- Dashboard 加载时间 < 2秒
- 文件缩略图加载 < 1秒
- 团队活动更新延迟 < 5秒
- 搜索响应时间 < 500ms
- 支持 100+ 文件流畅显示

### 4.12 用户体验
- 界面响应迅速流畅
- 文件预览清晰准确
- 操作反馈及时明确
- 布局适应不同屏幕尺寸

## 🔄 数据刷新策略

### 4.13 实时更新
- **WebSocket 连接**: 实时接收团队活动更新
- **定时刷新**: 每 30 秒刷新统计数据
- **用户操作触发**: 操作后立即更新相关数据
- **缓存策略**: 合理缓存减少服务器压力

### 4.14 数据优先级
1. **高优先级**: 用户最近文件、快速操作
2. **中优先级**: 团队活动、统计数据
3. **低优先级**: 推荐内容、使用技巧

## 🔄 个性化功能

### 4.15 自定义布局
- **组件排序**: 用户可调整 Dashboard 组件顺序
- **显示设置**: 选择显示/隐藏特定组件
- **主题设置**: 支持明暗主题切换
- **密度设置**: 紧凑/舒适显示模式

### 4.16 智能推荐
- **推荐模板**: 基于用户历史推荐合适模板
- **相关文件**: 推荐相关或类似的文件
- **协作建议**: 推荐可能需要协作的团队成员
- **使用技巧**: 根据用户行为推荐功能技巧

## 🔄 后续迭代

### Phase 2 功能
- 工作空间使用统计图表
- 个人生产力分析
- 团队协作效率报告
- 自定义 Dashboard 组件

### Phase 3 功能
- AI 驱动的内容推荐
- 智能工作流建议
- 高级数据可视化
- 集成第三方工具

---

*优先级: 🟡 中*
*预估工期: 2-3周*
*依赖: 用户系统、文件管理、协作功能*
