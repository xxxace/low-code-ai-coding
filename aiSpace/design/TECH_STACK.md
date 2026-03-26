# 技术选型建议

> 版本：v1.0.0  
> 创建时间：2026-03-26  
> 作者：AI Research Agent  

---

## 一、核心依赖

### 1.1 必选依赖

| 依赖 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| **vue** | ^3.4.0 | 框架基础 | 现有项目技术栈，Composition API 天然契合低代码架构 |
| **typescript** | ^5.4.0 | 类型安全 | 现有项目规范，低代码 Schema 需要强类型约束 |
| **element-plus** | ^2.7.0 | UI 组件库 | 现有项目技术栈，内置大量表单组件可直接复用 |
| **ajv** | ^8.16.0 | JSON Schema 校验 | 行业标准，支持 draft-07，vue-json-schema-form 验证了其可行性 |
| **@vueuse/core** | ^10.0.0 | Vue 工具函数 | 提供 useVirtualList、useDebounceFn 等实用 hooks |

### 1.2 设计器专用依赖

| 依赖 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| **vuedraggable** | ^4.1.0 | 流式布局拖拽 | 基于 SortableJS，Vue 3 原生支持，VForm3 验证了其可行性 |
| **@monaco-editor/vue3** | ^0.5.0 | 代码编辑器 | 支持 JSON Schema 语法高亮和校验，form-generator 验证了其价值 |

### 1.3 可选依赖

| 依赖 | 版本 | 用途 | 引入条件 |
|------|------|------|---------|
| **pinia** | ^2.1.0 | 设计器全局状态 | 设计器复杂状态管理（Schema、历史记录、选中节点） |
| **nanoid** | ^5.0.0 | 生成唯一 ID | Schema 节点 ID 生成（比 uuid 更轻量） |
| **lodash-es** | ^4.17.21 | 深拷贝等工具 | Schema 快照、深层克隆，可用 `cloneDeep` |

---

## 二、不引入的依赖及原因

| 放弃的依赖 | 原因 |
|-----------|------|
| **@formily/reactive** | 与 Vue 3 响应式重复；在 Vue 中引入两套响应式系统会增加调试复杂度；Vue watchEffect 已能满足联动需求 |
| **@formily/core** | 学习曲线陡峭；与现有 StdForm 体系集成困难；许多特性是 React 先设计的，Vue 适配有折扣 |
| **sortable.js（直接使用）** | vuedraggable 已封装，无需直接使用 SortableJS |
| **rxjs** | 过于重量级，Observable 模型在这个场景下过于复杂 |
| **immer** | 不可变数据在 Vue 响应式体系中使用体验差，历史快照用 JSON.stringify/parse 足够 |

---

## 三、与现有 StdForm 的关系

### 3.1 现有 StdForm 核心能力

```
现有 StdForm 体系
├── useStdForm()           - 表单状态机（Init/Submit/Delete/ChangeStatus）
├── RelationRegister       - 1对多/多对多关系注册
├── RefManager             - 单对象状态管理（ref + loader）
├── useArrayRefManager     - 数组状态管理（增删改查）
├── useParamsRefManager    - 查询参数管理
├── useNsI18n              - 命名空间国际化
├── useNsI18nColumns       - 表格列国际化
└── useSetupStdFormMeta    - 表单元数据（路由、权限等）
```

### 3.2 低代码层对 StdForm 的依赖关系

```
低代码渲染器
    │
    ↓ 可选依赖（通过适配层解耦）
    │
lowcode-stdform 适配层
    │
    ├── FormModelAdapter ──→ useStdForm()
    ├── RelationAdapter  ──→ RelationRegister + useArrayRefManager
    ├── I18nAdapter      ──→ useNsI18n
    └── DataSourceAdapter ──→ 现有 API 封装（fetchDataList 等）
```

### 3.3 适配层设计

```typescript
// lowcode-stdform 适配层核心：将低代码 FormModel 桥接到 useStdForm
export function useStdFormAdapter(schema: PageSchema) {
  // 1. 解析 Schema 中的关系字段
  const relations = extractRelations(schema)
  
  // 2. 创建 StdForm 关系注册
  const stdForm = useStdForm({
    relations: relations.map(r => ({
      id: r['x-relation'].target,
      foreignKey: r['x-relation'].foreignKey
    }))
  })
  
  // 3. 创建低代码 FormModel
  const formModel = createFormModel(schema)
  
  // 4. 双向数据同步
  watch(stdForm.refManager.value, (val) => {
    formModel.setValues(val)
  })
  
  watch(formModel.values, (val) => {
    stdForm.refManager.update(val)
  })
  
  return { formModel, stdForm }
}
```

---

## 四、包结构与发布

### 4.1 Monorepo 结构（推荐）

使用 pnpm workspace：

```
lowcode/
├── packages/
│   ├── core/           # @company/lowcode-core（无框架依赖）
│   ├── renderer/       # @company/lowcode-renderer（Vue 3 运行时）
│   ├── designer/       # @company/lowcode-designer（设计器，含 pinia）
│   └── stdform/        # @company/lowcode-stdform（StdForm 适配）
├── apps/
│   └── playground/     # 设计器演示应用
├── pnpm-workspace.yaml
└── package.json
```

### 4.2 包的依赖关系

```
@company/lowcode-designer
    ├── depends on: @company/lowcode-renderer
    ├── depends on: pinia
    └── depends on: vuedraggable

@company/lowcode-renderer
    ├── depends on: @company/lowcode-core
    ├── depends on: vue
    └── depends on: element-plus (peerDependency)

@company/lowcode-core
    ├── depends on: ajv
    └── NO vue dependency (纯 TS)

@company/lowcode-stdform
    ├── depends on: @company/lowcode-renderer
    └── depends on: existing StdForm hooks
```

### 4.3 构建工具

| 工具 | 用途 |
|------|------|
| **Vite** | 开发服务器 + 打包（包模式） |
| **vite-plugin-dts** | 生成 TypeScript 声明文件 |
| **unbuild** | 可选，更适合库的构建 |

---

## 五、开发工具链

### 5.1 代码质量

| 工具 | 配置 | 说明 |
|------|------|------|
| **ESLint** | 继承现有项目配置 | 代码规范检查 |
| **TypeScript strict** | `"strict": true` | 严格类型检查 |
| **Prettier** | 继承现有项目配置 | 代码格式化 |

### 5.2 测试

| 工具 | 用途 |
|------|------|
| **Vitest** | 单元测试（Schema 解析、联动引擎、校验器） |
| **@vue/test-utils** | 组件测试（Renderer、Widget） |
| **Playwright** | E2E 测试（设计器交互） |

### 5.3 文档

- **Storybook**（可选）：组件文档和 Widget 展示
- **VitePress**（可选）：设计文档和使用指南

---

## 六、关键技术决策

### 6.1 为什么用 Vue 3 watchEffect 而非自研响应式

Formily 自研了 `@formily/reactive` 来实现 O(1) 精确渲染。我们不这样做，原因：

1. **Vue 3 的 watchEffect 已经足够精准**：配合 shallowRef + triggerRef，可以精确控制更新粒度
2. **避免两套响应式系统**：项目全体是 Vue 3，引入另一套 reactive 会增加认知负担
3. **调试体验更好**：Vue DevTools 可以直接追踪依赖，自研 reactive 无法享受此福利
4. **MES 场景表单规模**：通常不超过 100 个字段，全量 rerender 性能也在可接受范围内

### 6.2 为什么 Schema 基于 JSON Schema 而非完全自定义

参考 vue-json-schema-form 和 Formily 的做法：

**JSON Schema 优势**：
- 后端 Java/Python 世界有成熟的 Schema 生成工具（springdoc、pydantic）
- ajv 提供开箱即用的校验
- IDE/VS Code 有 JSON Schema 语法提示插件
- 学习成本低（前端开发者已普遍了解 JSON Schema）

**自定义扩展**：
- `x-*` 前缀的扩展属性不会干扰 JSON Schema 标准校验
- 所有特定业务能力（联动、关系、i18n）通过 `x-*` 属性扩展

### 6.3 为什么设计器用 pinia 管理状态

设计器的状态很复杂：

```
DesignerState
├── schema: PageSchema        （当前编辑的 Schema，数 KB～数十 KB）
├── selectedNodeId: string    （选中的字段 ID）
├── history: Snapshot[]       （撤销/重做栈，可能数十个快照）
├── dragState: DragState      （拖拽进行中的状态）
├── clipboard: FieldSchema    （剪贴板中的字段）
└── registeredMaterials: Map  （注册的物料列表）
```

这些状态跨越多个组件（Palette ↔ Canvas ↔ Properties），用 props/emit 传递会产生大量 drilling。Pinia 的 devtools 支持也便于调试。

### 6.4 自由布局为什么不用第三方库

调研了 `moveable`、`interact.js` 等库：

- `moveable`：功能完整但体积大（100KB+），且 API 较复杂
- `interact.js`：较轻量，但与 Vue 3 响应式整合需要额外工作
- **自研**：参考 visual-drag-demo 的原理，核心代码不超过 200 行，完全可控

自研自由布局核心：

```typescript
// 核心不超过 200 行
const useFreeLayout = (container: Ref<HTMLElement>) => {
  const onDragStart = (e: MouseEvent, nodeId: string) => { /* ... */ }
  const onDrag = (e: MouseEvent) => { /* ... */ }
  const onDragEnd = (e: MouseEvent) => { /* ... */ }
  const checkSnap = (position: FreePosition) => { /* 吸附检测 */ }
  return { onDragStart, onDrag, onDragEnd }
}
```

---

## 七、迁移/集成方案

### 7.1 阶段一：无感接入（0 改动）

不修改任何现有代码，新增低代码能力：

```vue
<!-- 现有代码不变 -->
<template>
  <StdFormWrapper>
    <el-form-item label="字段A">
      <el-input v-model="form.fieldA" />
    </el-form-item>
  </StdFormWrapper>
</template>

<!-- 新表单可选用低代码 Renderer -->
<template>
  <LowcodeRenderer :schema="schema" @submit="handleSubmit" />
</template>
```

### 7.2 阶段二：设计器生成 Schema

1. 使用设计器创建/编辑表单 Schema
2. Schema 存储到数据库或文件
3. Renderer 动态加载并渲染

```typescript
// 动态加载远程 Schema
const schema = await fetchFormSchema('inquiry-order-form')
// <LowcodeRenderer :schema="schema" />
```

### 7.3 阶段三：Schema ↔ SFC 双向转换（参考 VTJ.PRO）

```typescript
// Schema → Vue SFC 代码（用于代码生成场景）
const sfcCode = generateVueSFC(schema)

// Vue SFC → Schema（用于导入现有表单到设计器）
const schema = parseVueSFC(sfcSource)
```

### 7.4 现有 StdForm 代码的 Schema 化迁移工具

提供 CLI 工具，分析现有 StdForm 代码，生成初步 Schema：

```bash
npx lowcode-migrate analyze --input ./views/form1/form/index.vue --output schema.json
```

工具会：
1. 解析模板中的 `el-form-item` 和 `el-input` 等
2. 读取 `validationRules.ts` 生成 `x-validator`
3. 读取 `relations/` 目录生成 `x-relation`
4. 输出 Schema JSON（需要人工审核和补充联动规则）

---

## 八、风险与应对

| 风险 | 概率 | 影响 | 应对方案 |
|------|------|------|---------|
| Schema 设计不合理，需要大幅变更 | 中 | 高 | 先用原型验证，小步快跑；版本迁移工具 |
| 自由布局性能问题（大量组件） | 低 | 中 | 分层渲染（Canvas API 或 WebGL 候选方案） |
| 与 Element Plus 版本耦合 | 低 | 中 | Widget 注册机制解耦，可适配多版本 |
| StdForm 适配层维护成本 | 中 | 中 | 单独包隔离，StdForm 接口不变则无影响 |
| 联动表达式安全问题 | 低 | 高 | 使用 new Function 沙箱限制可用变量；禁止访问 window/document |
