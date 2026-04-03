# 代码质检报告（2026-03-30）

> 覆盖范围：`prototype/src/` 全量源码（core / renderer / designer）  
> 质检维度：冗余代码、死代码、坏代码、设计缺陷、潜在 Bug

---

## 一、冗余代码（Redundant Code）

| # | 文件 | 问题描述 | 影响 |
|---|------|----------|------|
| R-01 | `renderer/FlowLayout.vue` | **整个文件是死路径**：`FormRenderer.vue` 直接使用 `XLayout`，`FlowLayout` 已无任何地方 import 或使用 | 历史遗留，文件可删 |
| R-02 | `designer/engine/designerEngine.ts` 第 426 行 | `export { HistoryManager } from './HistoryManager'` —— HistoryManager 已从 `index.ts` 直接导出，此处重复 | 多余导出 |
| R-03 | `designer/LowcodeDesigner.vue` 中的 `handleFieldPropsUpdate` | 内部实现了一个 `findAndUpdate` 闭包，完全重复了 `engine.updateNodeProps(nodeId, updates)` 的功能，但绕过了引擎（深拷贝、更新、saveSnapshot 都由自己处理），没有使用已存在的 API | 代码重复，逻辑不一致 |
| R-04 | `renderer/FormRenderer.vue` 第 88 行 | `formModelForTemplate` 只是做了一次 `computed<FormModel | null>(() => formModel.value as ...)` 的类型转换，无任何逻辑价值，注释说"类型锚点"——这是类型系统的坏味道，应从根本上修正泛型签名 | 形式主义冗余 |
| R-05 | `renderer/FormRenderer.vue` 第 92-95 行 | `cssVariables` 计算属性始终返回 `{}`，函数体只有一行注释"可在这里注入 CSS 变量"，从未被使用到实际值 | 空函数，纯冗余 |
| R-06 | `designer/DesignOverlay.vue` Props 第 151-153 行 | emit 中定义了 `update-node-position` 和 `update-node-size` 两个事件类型，但在整个 `DesignOverlay.vue` 的模板和 script 中**从未 emit** 这两个事件（由 `AbsoluteNodeOverlay` 负责）。这两个类型定义在 DesignOverlay 中是死代码 | 类型污染，误导阅读者 |
| R-07 | `schema.ts` 第 371-406 行 | `ContainerNode` 接口和 `isContainerNode` 函数——`ContainerNode.type === 'container'` 在运行时**从未生成**（所有容器用 `type: 'void'` 实现），这套类型体系是架构探索阶段的遗留占位，目前实质上是死类型 | 认知负担，易误导 |

---

## 二、死代码（Dead Code）

| # | 文件 | 问题描述 |
|---|------|----------|
| D-01 | `renderer/FlowLayout.vue` | 整文件（同 R-01），永不被调用 |
| D-02 | `renderer/FieldRenderer.vue` 第 17-32 行 | `type === 'container'` 的 template 分支：同上，`ContainerNode` 永远不会出现在 Schema 中。TODO 注释表明 GroupRenderer 从未实现，这段 HTML 永远不会渲染 |
| D-03 | `renderer/FieldRenderer.vue` 第 305-306 行 | `sizeAutoFitted = ref(false)` —— 值被写入但从未被外部读取（仅 `onMounted` 内部自读），且逻辑本身有问题（见 B-02） |
| D-04 | `designer/engine/designerEngine.ts` `isDragging` / `dragNodeId` | 这两个响应式变量在引擎 return 对象中暴露（第 393-394 行），但在整个 codebase 中**从未被消费**（`AbsoluteNodeOverlay` 有自己的 `isDragging`，`DesignOverlay` 有自己的 `dragNodeId`）|
| D-05 | `core/schema.ts` `AllFieldTypes` 类型别名（第 367 行） | `type AllFieldTypes = FieldSchema['type'] \| 'void'`——void 本就包含在 FieldSchema 的 type 联合中，加 `\| 'void'` 是冗余表达；且此类型在任何文件中均未被 import 使用 |
| D-06 | `core/model.ts` 第 157-163 行 | array 字段子 schema 处理块——整块代码是一个空的 `if` 检查，注释说"不在此初始化独立字段"，但 if 块内什么也没做，纯粹是死代码块 |
| D-07 | `core/registry/defaultRegistry.ts` `getGlobalRegistry` / `setGlobalRegistry` | 全局单例函数在所有使用场景中，用的都是 `createDefaultRegistry()` + `provide`，全局单例路径从未被使用到 |
| D-08 | `index.ts` 导出 `FlowLayout` （第 90 行） | `FlowLayout` 实际已是死文件（R-01），但仍从公共入口导出，外部无法感知这个组件已废弃 |

---

## 三、坏代码（Bad Code / Code Smells）

| # | 文件 | 问题描述 | 严重程度 |
|---|------|----------|---------|
| B-01 | `types/` 目录下 4 个垫片文件 | `types/schema.ts`、`types/model.ts`、`types/componentRegistry.ts`、`types/reactions.ts` 全是 `export * from '../core/...'` 的一行垫片。垫片本身合理，但**20+ 个组件仍在从 `../types/xxx` 导入**而不是直接从 `../core/xxx` 导入（`DesignOverlay.vue`、`FieldRenderer.vue`、`VoidContainer.vue`、`FieldProperties.vue` 等）。垫片存在的意义是过渡，但没有在推进迁移 | 中 |
| B-02 | `renderer/FieldRenderer.vue` `onMounted` 逻辑 | `if (!designMode || !isAbsoluteMode.value ...)` —— `designMode` 是 `ComputedRef<boolean>`，应该写 `!designMode.value`；当前写法相当于判断 `ComputedRef` 对象本身是否 truthy（始终 truthy），条件永远为 false，导致**自动适配尺寸逻辑从未执行** | 高（逻辑 Bug） |
| B-03 | `renderer/VoidContainer.vue` `onMounted` 逻辑 | 同 B-02，第 267 行 `if (!designMode \|\| !isAbsoluteMode.value) return` —— `designMode` 是 `ComputedRef`，对象永远 truthy，条件第一个子句永远为 false，守卫失效。但 `syncContainerSize()` 内部有自己的守卫（第 242 行用 `!designMode`，同样有问题） | 高（逻辑 Bug） |
| B-04 | `designer/LowcodeDesigner.vue` `handleFieldPropsUpdate` | 重新实现了一个 `findAndUpdate` 的深度遍历（第 303-314 行），然后直接写 `engine.schema.value = newSchema`，绕过了 `engine.updateNodeProps()`，也没有 emit `designerBus` 的 `node:updated` 事件。这打破了引擎的封装边界，导致总线事件不完整 | 中 |
| B-05 | `designer/DesignOverlay.vue` `getActionsStyle` 函数（第 197-209 行） | 水平方向判断逻辑有重复分支：`rightEdge - DESIGN_CONSTANTS.ACTIONS_W < 0` 等同于 `rightEdge < DESIGN_CONSTANTS.ACTIONS_W`，但前面的 `else if` 已经处理了这个情况（第 200 行）。进入 `else` 分支时这个条件永远不会成立，是死分支 | 低（逻辑噪声） |
| B-06 | `designer/DesignOverlay.vue` 状态管理 | `refreshTimerId` 是普通 `let` 变量（第 284 行），而 `mountedTimerRef`、`schemaWatchTimerRef` 是 `ref()`（第 360-361 行）。同样是 setTimeout ID，用两种不同方式管理，不一致 | 低 |
| B-07 | `renderer/FieldRenderer.vue` 中有**两套完全相同的 Widget 渲染逻辑** | `isAbsoluteMode` 下一套（第 64-126 行），`el-form-item` 下一套（第 156-216 行）。Select / CheckboxGroup / RadioGroup 的 options 渲染代码一字不差地重复了两遍 | 中（DRY 违规） |
| B-08 | `core/reactions.ts` `execExpression` 和 `evalExpression` | 两个函数实现几乎完全一样（相差最后一行 `return` 有无），完全可以合并为一个通用 `runInSandbox(expr, ctx, returnValue)` 函数 | 低 |
| B-09 | `designer/FieldProperties.vue` `emitUpdate` | 第 534-538 行过滤 `componentPropsForm` 时，条件 `v !== null && v !== undefined && v !== ''` 会把 `false`、`0` 等合法 falsy 值也过滤掉（如 `clearable: false`、`multiple: false`、`step: 0`）。这是一个隐蔽的数据丢失 Bug | 高（逻辑 Bug） |
| B-10 | `designer/engine/designerEngine.ts` `canUndo`/`canRedo` 计算属性 | 第 102-109 行使用 `void history.indexRef.value` 作为依赖订阅，这是一种 hack 写法。应该将 `canUndo`/`canRedo` 的计算逻辑改为直接引用 `history.indexRef.value` | 低（hack） |
| B-11 | `core/schema.ts` `I18nConfig` 接口 | 整个 `I18nConfig` 接口和 `I18nString` 相关的所有代码（第 43-73 行）在运行时均未被任何组件消费——没有任何渲染器读取 `x-i18n` 字段 | 中（预留功能未标注） |

---

## 四、设计与架构问题

| # | 文件 | 问题描述 | 严重程度 |
|---|------|----------|---------|
| A-01 | `renderer/FieldRenderer.vue` — inject `formRenderer` | 第 292-294 行通过 `inject<{onFieldChange:...}>('formRenderer')` 使用字符串 key，而其他注入都用了类型安全的 `InjectionKey`（`DESIGN_MODE_KEY` 等）。这一处不一致破坏了类型安全，若提供者变更接口，编译不会报错 | 中 |
| A-02 | `renderer/FormRenderer.vue` — 双重 `provide` SELECTED_NODE_ID_KEY | FormRenderer 在第 205 行 provide `SELECTED_NODE_ID_KEY, computed(() => null)`，XLayout 在第 100-102 行再次 provide 覆盖。逻辑是对的，但代码注释说明这是"防穿透"，这个覆盖逻辑对维护者极不直观 | 低（文档问题） |
| A-03 | `designer/engine/schemaUtils.ts` — `moveNodeToContainer` 和 `moveNodeAcrossContainers` 代码重复 | 两个函数都有 `findSource` 内联闭包，几乎完全一样的逻辑。`moveNodeAcrossContainers` 已经包含了 `moveNodeToContainer` 的功能（末尾调用 `sortNodesInSchema`），两者应统一或提取公共工具函数 | 中 |
| A-04 | `designer/engine/designerEngine.ts` — 深拷贝滥用 | `addNode`、`removeNode`、`updateNodeProps`、`duplicateNode`、`moveNode`、`sortNodes`、`moveNodeToContainer`、`moveNodeAcrossContainers` 每次都执行 `JSON.parse(JSON.stringify(...))` 深拷贝。在节点数量多时（几十甚至几百个字段）这是性能热点 | 中（性能） |

---

## 五、问题清单汇总（按优先级）

### 🔴 高优（逻辑 Bug，影响运行时行为）

| 编号 | 问题 | 文件 |
|------|------|------|
| B-02 | `designMode` 未加 `.value` 导致 auto-fit 尺寸逻辑从不执行 | `FieldRenderer.vue` onMounted |
| B-03 | 同 B-02，容器高度自动同步守卫失效 | `VoidContainer.vue` onMounted + syncContainerSize |
| B-09 | `emitUpdate` 过滤掉 `false`/`0` 等合法 falsy 值，导致 boolean/number 组件属性丢失 | `FieldProperties.vue` |

### 🟡 中优（代码质量/可维护性问题）

| 编号 | 问题 | 文件 |
|------|------|------|
| R-03 | `handleFieldPropsUpdate` 绕过引擎封装，手动重写节点更新逻辑 | `LowcodeDesigner.vue` |
| B-07 | Widget 渲染逻辑重复两遍（absolute 模式和 flow 模式） | `FieldRenderer.vue` |
| A-01 | 字符串 key inject（`'formRenderer'`）破坏类型安全 | `FieldRenderer.vue` |
| A-03 | `findSource` 闭包在两个函数中重复实现 | `schemaUtils.ts` |
| B-04 | `handleFieldPropsUpdate` 不 emit `designerBus` 的 `node:updated` 事件 | `LowcodeDesigner.vue` |
| B-01 | 20+ 处组件仍从 `types/` 而非 `core/` 导入 | 全局 |

### 🟢 低优（清理类，不影响功能）

| 编号 | 问题 | 建议操作 |
|------|------|--------|
| R-01 / D-01 / D-08 | `FlowLayout.vue` 是死文件 | 删除文件，从 `index.ts` 移除导出 |
| R-06 | `DesignOverlay` emit 定义了未使用的 `update-node-position` / `update-node-size` | 删除这两个 emit 类型 |
| D-04 | `designerEngine` 的 `isDragging` / `dragNodeId` 从未被消费 | 从 return 对象移除（或标注为内部状态） |
| D-07 | `getGlobalRegistry` / `setGlobalRegistry` 从未被用 | 评估是否保留（插件 API 预留？）或删除 |
| R-07 | `ContainerNode` 类型体系从未在运行时被使用 | 增加 `@deprecated` 注释，说明实际用 `VoidField` 替代 |
| D-05 | `AllFieldTypes` 未被 import | 删除 |
| D-06 | model.ts 空 if 块 | 删除 |
| B-05 | `getActionsStyle` 死分支 | 清理条件逻辑 |
| B-06 | `refreshTimerId` 与其他 timer ref 不一致 | 统一用 ref |
| B-08 | `evalExpression` 和 `execExpression` 几乎完全相同 | 提取公共函数 |
| B-10 | `void history.indexRef.value` hack | 改为直接 `history.indexRef.value > 0` |
| R-04 / R-05 | `formModelForTemplate` 类型 hack，`cssVariables` 永远返回 `{}` | 修正类型，删除空计算属性 |

---

## 六、修复方案

### Bug 修复（高优先）

**B-02 + B-03：`designMode` 未加 `.value`**

```typescript
// FieldRenderer.vue onMounted —— 第 320 行
// 错误：
if (!designMode || !isAbsoluteMode.value || sizeAutoFitted.value) return
// 修正：
if (!designMode.value || !isAbsoluteMode.value || sizeAutoFitted.value) return

// VoidContainer.vue onMounted —— 第 267 行
// 错误：
if (!designMode || !isAbsoluteMode.value) return;
// 修正：
if (!designMode.value || !isAbsoluteMode.value) return;

// VoidContainer.vue syncContainerSize —— 第 242 行
// 错误：
if (!designMode || !isAbsoluteMode.value) return;
// 修正：
if (!designMode.value || !isAbsoluteMode.value) return;
```

**B-09：emitUpdate 过滤 falsy 值**

```typescript
// FieldProperties.vue emitUpdate —— 第 534-538 行
// 错误：
if (v !== null && v !== undefined && v !== '') {
  mergedComponentProps[k] = v;
}
// 修正：只过滤 undefined，null 和空字符串也保留（但需分情况，建议改为：
if (v !== undefined) {
  mergedComponentProps[k] = v;
}
// 或者更精确：不过滤，直接合并，让组件自己决定如何处理
```

### 代码清理（中优先）

**R-03 / B-04：LowcodeDesigner 的 `handleFieldPropsUpdate` 应委托引擎**

```typescript
// 现状（手动深拷贝 + 遍历 + 直接修改 schema）：
function handleFieldPropsUpdate(nodeId: string, updates: Partial<FieldSchema>): void {
  // 40行手写遍历...
}

// 修正：直接调用引擎 API
function handleFieldPropsUpdate(nodeId: string, updates: Partial<FieldSchema>): void {
  engine.updateNodeProps(nodeId, updates)
  // engine.updateNodeProps 已处理：深拷贝、saveSnapshot、emit designerBus
}
```

**B-07：FieldRenderer 中 Widget 渲染逻辑重复**

提取 `<WidgetContent>` 子组件或 Composable，消除 absolute/flow 双模式下的代码重复。

**A-01：字符串 inject key 改为 InjectionKey**

```typescript
// core/injectionKeys.ts 中增加：
export const FORM_RENDERER_KEY: InjectionKey<{
  onFieldChange: (path: string, value: any) => void
}> = Symbol('formRenderer')

// FormRenderer.vue：
provide(FORM_RENDERER_KEY, { onFieldChange: ... })

// FieldRenderer.vue：
const formRendererCtx = inject(FORM_RENDERER_KEY)
```

### 文件删除（低优先，清理死代码）

1. 删除 `renderer/FlowLayout.vue`，从 `index.ts` 移除相关导出
2. 删除 `renderer/FieldRenderer.vue` 中 `type === 'container'` 的 template 分支（D-02）
3. 删除 `designerEngine.ts` 末尾的重复 `export { HistoryManager }` （R-02）
4. 删除 `designerEngine.ts` 返回值中的 `isDragging`、`dragNodeId`（D-04）
5. 删除 `DesignOverlay.vue` emit 中的 `update-node-position` / `update-node-size` 声明（R-06）
6. 删除 `core/schema.ts` 中的 `AllFieldTypes`（D-05）
7. 删除 `core/model.ts` 中的空 if 块（D-06）

---

*报告生成时间：2026-03-30*
