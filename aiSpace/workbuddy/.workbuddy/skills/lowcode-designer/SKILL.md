---
name: lowcode-designer
description: >
  This skill should be used when working on the MES low-code form designer project
  (also called "低代码设计器" or "StdForm 低代码扩展"). It provides the full project
  architecture, Schema conventions, ADR decisions, coding style rules, and
  step-by-step workflows for implementing new features. Load this skill at the
  start of any session involving this codebase.
---

# 低代码设计器领域知识

## 快速定位

- **项目根目录**：`D:\ai\low-code-ai-coding\aiSpace\`
- **原型代码**：`D:\ai\low-code-ai-coding\aiSpace\prototype\src\`
- **设计文档**：`D:\ai\low-code-ai-coding\aiSpace\design\`
- **功能清单**：`D:\ai\low-code-ai-coding\aiSpace\FEATURE_CHECKLIST.md`（每阶段完成后更新）
- **开发服务器**：`cd prototype && npx vite`（端口 5173）
- **运行测试**：`cd prototype && npx vitest run`

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3 + TypeScript |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia（页面级），Vue 3 reactive（设计器内部） |
| 构建工具 | Vite |
| 单元测试 | Vitest 4.1.2 + @vue/test-utils + happy-dom |
| 事件总线 | mitt |

## 架构分层（单向依赖）

```
core/          ← 零外部依赖，纯 TS 逻辑
  ├── schema.ts            JSON Schema draft-07 + x-* 扩展类型
  ├── model.ts             FormModel（reactive 响应式）
  ├── reactions.ts         ReactionsEngine（watchEffect 联动引擎）
  └── registry/            ComponentRegistry（Widget/Decorator 注册）
        ├── ComponentRegistry.ts
        ├── defaultRegistry.ts   内置 Element Plus 20+ 组件
        └── registryTypes.ts

renderer/      ← 依赖 core，纯渲染，无设计器逻辑
  ├── XLayout.vue          统一布局渲染层（flow + absolute 共存）
  ├── FieldRenderer.vue    字段渲染（接入 ComponentRegistry）
  ├── VoidContainer.vue    容器渲染（Card/Tabs/Collapse/Divider）
  ├── FlowLayout.vue       流式布局（flex + flex-wrap）
  └── FreeLayout.vue       自由布局（保留，暂不作为主入口）

designer/      ← 依赖 renderer，设计器 UI 和交互
  ├── engine/
  │     ├── designerEngine.ts     ~300 行，委托 schemaUtils
  │     ├── schemaUtils.ts        9 个纯函数，可独立测试
  │     ├── HistoryManager.ts     JSON 快照 undo/redo
  │     └── designerBus.ts        mitt 事件总线
  ├── composables/
  │     ├── useMaterialDrag.ts    物料拖入画布
  │     └── useKeyboardShortcuts.ts  键盘快捷键
  ├── LowcodeDesigner.vue   顶层设计器容器
  ├── Designer.vue          中层画布容器
  ├── DesignOverlay.vue     流式布局交互叠加层
  ├── AbsoluteNodeOverlay.vue   自由定位交互叠加层
  ├── FieldProperties.vue   字段属性面板
  ├── PageProperties.vue    页面属性面板
  ├── MaterialPalette.vue   物料面板
  ├── ReactionEditorDialog.vue  联动规则编辑弹窗
  ├── PropGroup.vue         带折叠的属性分组
  └── OptionsEditor.vue     枚举选项编辑器

types/         ← 垫片层，全部 re-export from core/，零运行时代价
plugin-api.d.ts ← 插件 API 类型契约
```

## Schema 核心规范

### 顶层 PageSchema

```typescript
interface PageSchema {
  version: string       // 当前 "1.0"
  id: string
  name: string
  layoutMode: 'flow' | 'free'   // 只影响新增节点默认类型
  formConfig: FormConfig        // labelWidth/columns/disabled 等
  schema: ObjectFieldSchema     // 根节点，properties 存所有字段
  cssCode?: string
  lifeCycles?: LifeCycles
}
```

### 字段类型体系

| type | 含义 |
|---|---|
| `string/number/boolean/integer/null` | 标量字段（ScalarFieldSchema） |
| `object` | 对象字段，有 properties |
| `array` | 数组字段，有 items + x-relation |
| `void` | 虚字段，纯 UI 容器（Card/Tabs/Collapse/Divider） |

### x-* 扩展属性速查

| 属性 | 类型 | 用途 |
|---|---|---|
| `x-component` | string | Widget 组件名，见 defaultRegistry |
| `x-component-props` | Record | 组件 Props |
| `x-decorator` | string | 装饰器组件名（默认 FormItem） |
| `x-display` | `'visible'\|'hidden'\|'none'` | 显示状态（联动目标） |
| `x-pattern` | `'editable'\|'disabled'\|'readOnly'\|'readPretty'` | 交互模式 |
| `x-reactions` | Reaction[] | 联动规则 |
| `x-span` | number 1-24 | 流式布局列宽 |
| `x-order` | number | 字段排序权重 |
| `x-position-type` | `'relative'\|'absolute'` | 定位类型（XLayout 核心） |
| `x-position` | {x,y,width,height,zIndex} | 绝对定位坐标 |
| `x-id` | string | 节点唯一 ID（设计器生成） |
| `x-relation` | RelationConfig | 关系字段（1对多/多对多） |
| `x-datasource` | DataSourceConfig | 动态数据源（TODO） |

### x-position-type 布局模型（XLayout 核心）

类比 CSS position 模型：

| x-position-type | 渲染行为 | 类比 |
|---|---|---|
| `'relative'`（默认） | FlowLayout 流式排列，x-span 控制宽度 | CSS `position: relative` |
| `'absolute'` | absolute 定位，x/y/width/height 精确定位 | CSS `position: absolute` |

- 容器（VoidContainer）根元素带 `position: relative`，建立 absolute 子节点的 containing block
- AbsoluteNodeOverlay 只处理 `x-position-type === 'absolute'` 的节点
- DesignOverlay 只处理 `x-position-type !== 'absolute'` 的节点（流式）

### Reaction 联动规则结构

```typescript
interface Reaction {
  name?: string          // 规则名（UI 识别用）
  remark?: string        // 备注
  enabled?: boolean      // 默认 true，false 时引擎跳过
  dependencies?: string[] // 依赖字段路径，$deps[n] 对应
  when?: string          // 条件表达式（沙箱求值）
  fulfill?: ReactionEffect    // when=true 时执行
  otherwise?: ReactionEffect  // when=false 时执行
  target?: string | string[]  // 主动联动目标字段
}
// 沙箱内置变量：$self $form $deps $values
```

## 关键技术决策（ADR）

| 决策 | 结论 | 理由 |
|---|---|---|
| 响应式系统 | Vue 3 原生 reactive/watchEffect | 不引入第三方响应式，减少学习成本 |
| Schema 基础 | JSON Schema draft-07 + x-* 扩展 | 标准化，后端友好，部分兼容 Formily |
| 布局模型 | x-position-type per-field（XLayout） | 每字段独立决定定位类型，flow/free 和谐共存 |
| 关系字段 | x-relation + RelationRegister | MES 业务特有，已有 StdForm 基础设施 |
| 历史记录 | JSON 快照模式（snapshots[] + index） | 简单可靠，visual-drag-demo 验证过 |
| 架构分层 | core → renderer → designer 单向依赖 | 零循环引用，可独立测试 |
| 兼容层 | types/ 4 文件 re-export | 零破坏性变更，20+ 引用文件无需改动 |

## 编码规范（项目专属）

- **文件命名**：Vue 组件大驼峰，TS 文件小驼峰
- **事件处理**：`handle` 前缀（`handleSearch`, `handleNodeClick`）
- **Ref 变量**：`Ref` 后缀（`tableRef`, `dialogRef`）
- **Manager 类**：`Manager` 后缀（`HistoryManager`, `FormModel`）
- **异步**：async/await + try-catch（禁用 `.then()` 链）
- **禁止**：var 声明、直接 DOM 操作、魔法数字
- **错误提示**：ElMessage / ElMessageBox
- **类型命名**：大驼峰 + VO 后缀（`FieldSchema`, `PageSchema`）

## 常见开发场景工作流

### 新增物料（Widget）

1. 在 `defaultRegistry.ts` 注册 WidgetMeta（name/label/category/defaultSchema）
2. 如需自定义渲染，在 `FieldRenderer.vue` 对应分支处理
3. 在 `FieldProperties.vue` 补充属性面板 Setter

### 新增属性 Setter

1. 在 `FieldProperties.vue` 对应 PropGroup 中添加输入控件
2. 绑定到 `selectedNode['x-xxx']`，通过 `engine.updateFieldSchema` 写入
3. 在 `schemaUtils.ts` 添加对应纯函数（如需）
4. 补 `schemaUtils.test.ts` 单元测试

### 新增联动效果类型

1. 在 `schema.ts` 的 `ReactionEffect.state` 添加新字段
2. 在 `reactions.ts` 的 `applyEffect` 函数处理新字段
3. 在 `ReactionEditorDialog.vue` 添加对应 UI

### 修改 XLayout / AbsoluteNodeOverlay

- **containing block 原则**：XLayout 根元素是所有 absolute 子节点的定位上下文
- **坐标一致性**：AbsoluteNodeOverlay 和 FieldRenderer 的坐标原点必须相同
- **overflow**：absolute 节点的 FieldRenderer 根元素加 `overflow: hidden; padding: 0`

### 写单元测试注意事项

- ResizeObserver 需在 `test/setup.ts` mock
- provide/inject 通过 `mountWithSetup` 辅助函数注入
- 异步联动测试需 `await nextTick()` 或 `flushPromises()`
- 快照测试时注意 x-id 是随机生成的，需 stub

## 测试护城河

目前 154 个单元测试，分布：
- `schemaUtils.test.ts`：43 个（纯函数，最可靠）
- `FormModel.test.ts`：52 个
- `ComponentRegistry.test.ts`：24 个
- `ReactionsEngine.test.ts`：17 个
- `HistoryManager.test.ts`：16 个
- `smoke.test.ts`：2 个

**每次新功能必须同步补测试，不允许测试数量下降。**

## 参考文档

- Schema 完整类型：`references/schema-types.md`
- 当前功能进度：`references/feature-checklist.md`（从 FEATURE_CHECKLIST.md 同步）
- XLayout 架构设计：`references/xlayout-architecture.md`
