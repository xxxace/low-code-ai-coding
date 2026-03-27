# XLayout 架构演进计划

## 背景

### 问题发现

2026-03-27 下午，发现当前设计器存在三个严重 Bug：

| Bug | 表现 | 根因 |
|---|---|---|
| Bug1 | 流式布局切换到自由布局，内容不渲染 | 流式字段没有 `x-free-position`，FreeLayout 用 `v-if` 过滤掉了 |
| Bug2 | 节点高亮和工具栏样式异常 | FreeCanvas 和 FreeLayout 双层都处理 drag/resize，FreeLayout emit → re-render → 覆盖 FreeCanvas overlay |
| Bug3 | 失焦后无法选中和高亮 | 同 Bug2，交互职责冲突 |

### 原计划 vs 新方向

**原计划**：整合 FreeCanvas + FreeLayout 双层，消除职责冲突
**新方向（用户确认）**：FlowLayout + FreeLayout → XLayout（统一布局），让两种布局类型和谐共存

## 方案设计

### 核心理念：CSS Position 类比

| CSS 概念 | Schema 字段 | 语义 |
|---|---|---|
| `position: relative` | `x-position-type: 'flow'` | 跟随流式布局，自然排列 |
| `position: absolute` | `x-position-type: 'free'` | 自由定位，通过 x/y/width/height 精确定位 |

**每个字段独立决定自己的定位类型，整个画布统一渲染。**

### XLayout 渲染逻辑

```
schema.properties (所有字段，不区分来源)
├── fieldA: x-position-type: 'flow'    ──→ relative + grid 渲染
├── fieldB: x-position-type: 'free'   ──→ absolute + x/y/width/height 渲染
└── fieldC: x-position-type: 'flow'    ──→ relative + grid 渲染

XLayout.vue
  ├── computed flowFields = 所有 x-position-type === 'flow' 的字段
  ├── computed freeFields = 所有 x-position-type === 'free' 的字段
  └── 渲染：
        <div class="x-layout-flow">flowFields 走 FlowLayout 渲染逻辑</div>
        <div class="x-layout-free">freeFields 走 FreeLayout absolute 渲染</div>
```

### 属性面板新增 Setter

```
x-position-type Setter
├── 字段：定位类型
├── 类型：下拉选择
├── 选项：flow（流式定位）/ free（自由定位）
└── 切换时：
    flow → free：自动生成 x/y/width/height（基于当前渲染位置）
    free → flow：清理 x/y/width/height，字段回到流式流
```

### 工具栏「布局模式」按钮

原 `layoutMode` 切换按钮改造为「批量切换」：

| 模式 | 行为 |
|---|---|
| Flow | 选中所有字段 → `x-position-type: 'flow'` |
| Free | 选中所有字段 → `x-position-type: 'free'` + 生成默认 x/y/width/height |
| 混合（默认） | 保持现状，不做批量切换 |

### 新增字段默认类型

默认 `x-position-type: 'flow'`（最安全，新用户无需关心自由定位）

## Phase 1：修 Bug（独立于 XLayout）

### 目标

修复三个 Bug，不改变架构，为后续 XLayout 打基础。

### 改动

#### 1.1 FreeLayout 禁用 designMode drag/resize

- `FreeLayout.vue` 注入 `designerEngine`
- designMode 时：移除 resize-handle、禁用 `handleNodeMouseDown`、根 div 加 `pointer-events: none`
- FreeCanvas 独揽交互层职责

#### 1.2 切换到自由布局时，自动补全 x-position-type

- 在 `handleLayoutModeChange` 中，切换到 free 时给所有字段补：
  - `x-position-type: 'free'`
  - `x-free-position: { x, y, width, height }`（基于当前渲染位置或默认值）

### 验证

- [ ] 流式布局拖入 3 个字段 → 切换到自由布局 → 3 个字段正常渲染
- [ ] 选中节点，显示高亮和工具栏
- [ ] 拖拽节点，位置正确更新
- [ ] Ctrl+Z 撤销

## Phase 2：创建 XLayout

### 目标

用 XLayout 替代独立的 FlowLayout + FreeLayout，成为渲染层统一入口。

### 文件变更

| 操作 | 文件 |
|---|---|
| 新建 | `renderer/XLayout.vue`（FlowLayout + FreeLayout 渲染逻辑合一） |
| 修改 | `renderer/index.ts`（注册 XLayout，替代默认 FlowLayout） |
| 修改 | `designer/FreeCanvas.vue`（适配 XLayout，只管 free 类型字段的交互） |
| 修改 | `designer/LowcodeDesigner.vue`（工具栏批量切换 + 属性面板 Setter） |

### XLayout 核心实现

```vue
<!-- XLayout.vue -->
<template>
  <div class="x-layout" :class="{ 'is-design-mode': isDesignMode }">
    <!-- 流式渲染区 -->
    <div class="x-layout__flow">
      <div
        v-for="field in flowFields"
        :key="field.fieldName"
        :data-field-id="field.fieldName"
        class="x-layout__flow-item"
      >
        <!-- FlowLayout 渲染逻辑：grid 排列 -->
        <slot :name="field.fieldName" />
      </div>
    </div>

    <!-- 自由渲染区 -->
    <div class="x-layout__free">
      <div
        v-for="field in freeFields"
        :key="field.fieldName"
        :data-field-id="field.fieldName"
        class="x-layout__free-item"
        :style="getFreeStyle(field)"
      >
        <!-- FreeLayout 渲染逻辑：absolute + x/y/width/height -->
        <slot :name="field.fieldName" />
      </div>
    </div>
  </div>
</template>
```

### FlowLayout / FreeLayout 去留

| 组件 | 状态 | 理由 |
|---|---|---|
| `FlowLayout.vue` | 保留，但 XLayout 内联其渲染逻辑 | 物料面板「流式布局容器」仍可用 |
| `FreeLayout.vue` | 保留，但 XLayout 内联其渲染逻辑 | 物料面板「自由布局容器」仍可用 |
| `XLayout.vue` | 新建，作为 renderer 默认入口 | 统一渲染层 |

## Phase 3：属性面板 Setter

### 新增 Setter

`designer/property-setters/PositionTypeSetter.vue`

```
x-position-type Setter
├── 下拉：flow / free
├── 切换 flow → free：
│   └── 自动生成 x-free-position（默认 100x40，放在画布左上角）
├── 切换 free → flow：
│   └── 清理 x-free-position，字段进入流式流
└── 联动：切换类型时更新 schema
```

## 验证清单

### Phase 1 验证
- [ ] Bug1 修复：流式→自由，内容渲染
- [ ] Bug2 修复：高亮和工具栏正常
- [ ] Bug3 修复：失焦后可重新选中
- [ ] 拖拽流畅，无 re-render 抖动

### Phase 2 验证
- [ ] XLayout 渲染 flow 类型字段（相对定位，grid 排列）
- [ ] XLayout 渲染 free 类型字段（绝对定位，x/y/width/height）
- [ ] 两种类型字段同时存在，正常渲染
- [ ] 导入 Schema，两种类型字段正确加载

### Phase 3 验证
- [ ] 属性面板显示「定位类型」Setter
- [ ] 切换类型后，字段位置/尺寸正确更新
- [ ] 撤销/重做正确记录类型切换

## 风险与备选

| 风险 | 缓解 |
|---|---|
| XLayout 渲染性能下降（两套渲染路径） | flowFields/freeFields 用 computed，按类型过滤，避免全量比较 |
| 批量切换影响已有字段 | 先确认再执行，ElMessageBox 提示影响范围 |
| 物料面板容器组件废弃 | Phase 2 之后处理，不在本次范围 |
