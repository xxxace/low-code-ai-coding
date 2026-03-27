---
name: import-schema-feature
overview: 实现低代码设计器的 Schema 导入功能，支持从 JSON 文件加载表单设计，对接现有 designerEngine.loadSchema。
todos:
  - id: add-import-button
    content: 在 LowcodeDesigner.vue 工具栏添加「导入」按钮，置于「导出 Schema」左侧
    status: completed
  - id: implement-handle-import
    content: 实现 handleImport 方法：隐藏 file input + 触发点击 + FileReader 读取 + JSON.parse
    status: completed
    dependencies:
      - add-import-button
  - id: add-schema-validation
    content: 添加 validateImportedSchema 校验函数：校验 version/必填字段/结构完整性
    status: completed
    dependencies:
      - implement-handle-import
  - id: add-overwrite-confirm
    content: 画布有内容时弹出覆盖确认，确认后调用 engine.loadSchema() 并 ElMessage.success 提示
    status: completed
    dependencies:
      - add-schema-validation
  - id: test-import-flow
    content: 手动测试：导出已有表单 → 导入 → 验证画布内容一致
    status: completed
    dependencies:
      - add-overwrite-confirm
---

# XLayout 架构演进计划

## 目标

用 XLayout 替代 FlowLayout + FreeLayout 的双布局系统，实现每个节点独立决定定位类型的统一渲染架构。参考 CSS `position` 模型，达到 DOM 级别的布局自由度。

## 背景

### 当前问题

| Bug | 表现 | 根因 |
| --- | --- | --- |
| Bug1 | 流式布局切换到自由布局，内容不渲染 | 流式字段没有 `x-free-position`，FreeLayout 用 `v-if` 过滤掉了 |
| Bug2 | 节点高亮和工具栏样式异常 | FreeCanvas + FreeLayout 双层 drag/resize 冲突 |
| Bug3 | 失焦后无法选中和高亮 | 同 Bug2 |


### 设计目标

用户要求的最终效果：**和 DOM 的自由度一样高，你中有我、我中有你**。

- 卡片里放一个自由移动的节点
- 绝对定位元素里嵌套相对定位元素
- div 嵌绝对定位元素，绝对定位元素嵌套相对定位元素

## 核心理念：CSS Position 模型

**每个节点独立决定自己的定位方式，容器建立定位上下文。**

```
<form canvas> (position: relative)
├── fieldA           ← position: relative（默认值，正常流式排列）
├── <card>           ← position: relative（建立定位上下文）
│   ├── card-child1  ← position: relative（相对于 card 正常排列）
│   └── card-child2  ← position: absolute（相对于 card 自由移动）
└── fieldB           ← position: absolute（相对于 canvas 自由移动）
```

## Schema 字段设计

```ts
interface FieldSchema {
  // 节点定位类型
  'x-position-type'?: 'relative' | 'absolute'; // 默认 'relative'

  // 坐标信息（absolute 时有效）
  'x-position'?: {
    x?: number;       // 相对于定位上下文的 X
    y?: number;       // 相对于定位上下文的 Y
    width?: number;   // 宽度
    height?: number;  // 高度
  };
}
```

## 设计器交互规则

| 节点类型 | 识别方式 | 交互行为 |
| --- | --- | --- |
| 相对定位节点 | `x-position-type: 'relative'` 或无此字段 | 拖拽排序（插入线），不能自由移动坐标 |
| 绝对定位节点 | `x-position-type: 'absolute'` | 拖拽移动（x/y）、缩放（width/height）、8 向缩放手柄 |


## 实施计划

### Step 1：创建 XLayout.vue（纯渲染，无交互）

**目标**：XLayout 能正确渲染所有节点，不区分 flow/free，统一用 position 定位。

**文件**：`renderer/XLayout.vue`

**核心逻辑**：

```
<div
  v-for="field in allFields"
  :key="field.fieldName"
  :data-field-id="field.fieldName"
  :style="getNodeStyle(field)"
>
  <slot :name="field.fieldName" />
</div>

function getNodeStyle(field: FieldSchema): Record<string, string> {
  if (field['x-position-type'] === 'absolute') {
    return {
      position: 'absolute',
      left: `${field['x-position']?.x ?? 0}px`,
      top: `${field['x-position']?.y ?? 0}px`,
      width: `${field['x-position']?.width ?? 200}px`,
      height: `${field['x-position']?.height ?? 40}px`,
    };
  }
  return { position: 'relative' };
}
```

**验证**：

- [ ] 相对定位节点正常渲染（grid 排列）
- [ ] 绝对定位节点按 x/y/width/height 渲染
- [ ] 两种类型节点可以任意嵌套

### Step 2：替换 LowcodeDesigner.vue 渲染入口

**目标**：把 FormRenderer 的 renderer 指向 XLayout，验证现有设计器 UI 能正常使用。

**文件**：

- `renderer/index.ts`（注册 XLayout）
- `designer/LowcodeDesigner.vue`（修改 FormRenderer 的 renderer 属性）

**验证**：

- [ ] 设计器能正常加载
- [ ] 拖入节点能正确渲染

### Step 3：改造 FreeCanvas（适配 XLayout）

**目标**：FreeCanvas 只追踪 `x-position-type: 'absolute'` 的节点，只对这些节点显示 overlay（高亮框、缩放手柄、工具栏）。

**文件**：`designer/FreeCanvas.vue`

**核心改动**：

```ts
// 筛选绝对定位节点
const absoluteNodes = computed(() => {
  return allNodes.filter(n => n.field['x-position-type'] === 'absolute');
});

// 只对这些节点渲染 overlay-item
```

**交互行为**：

- 选中绝对定位节点：显示高亮框 + 8 向缩放手柄 + 工具栏
- 拖拽节点：更新 x/y
- 拖拽手柄：更新 width/height
- 选中相对定位节点：显示高亮框 + 工具栏，无缩放手柄，拖拽走排序逻辑

**验证**：

- [ ] 绝对定位节点拖拽移动正确
- [ ] 绝对定位节点 8 向缩放正确
- [ ] 相对定位节点拖拽走排序
- [ ] 失焦后可重新选中

### Step 4：批量切换工具栏 + PositionTypeSetter

**目标**：属性面板新增定位类型 Setter，工具栏按钮改为批量切换。

**文件**：

- `designer/property-setters/PositionTypeSetter.vue`（新增）
- `designer/LowcodeDesigner.vue`（工具栏按钮改造）

**PositionTypeSetter 行为**：

- 下拉：relative / absolute
- 切换 relative → absolute：自动生成 x-position（默认 x:0, y:0, width:200, height:40）
- 切换 absolute → relative：清理 x-position，节点进入流式流

**工具栏按钮**：

- 批量切 relative：所有选中字段 → `x-position-type: 'relative'`
- 批量切 absolute：所有选中字段 → `x-position-type: 'absolute'` + 生成默认 x-position

**验证**：

- [ ] 属性面板显示定位类型 Setter
- [ ] 切换类型后位置正确更新
- [ ] 撤销/重做正确记录

### Step 5：旧 Schema 迁移

**目标**：兼容带 `layoutMode` 字段的旧 Schema。

**文件**：`designer/LowcodeDesigner.vue`（validateImportedSchema 改造）

**迁移规则**：

- `layoutMode: 'flow'` → 所有字段 `x-position-type: 'relative'`
- `layoutMode: 'free'` → 所有字段 `x-position-type: 'absolute'` + 生成 x-position

## FlowLayout / FreeLayout 去留

| 组件 | 状态 | 理由 |
| --- | --- | --- |
| `FlowLayout.vue` | 保留，作为物料面板「流式布局容器」的渲染器 | 物料面板仍可用 |
| `FreeLayout.vue` | 保留，作为物料面板「自由布局容器」的渲染器 | 物料面板仍可用 |
| `XLayout.vue` | 新建，作为根级 renderer 默认入口 | 统一渲染层 |


## 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| XLayout 渲染性能 | 中 | computed 过滤，绝对定位节点单独追踪 |
| FreeCanvas 改造复杂 | 高 | Step 3 单独做，每步验证 |
| 旧 schema 迁移遗漏 | 中 | 单元测试覆盖迁移逻辑 |
| 嵌套定位上下文复杂 | 高 | 先实现简单场景（无嵌套），再扩展 |