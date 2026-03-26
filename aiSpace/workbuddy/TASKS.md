# 低代码设计器未完成任务清单

**生成日期**: 2026-03-26
**状态**: MVP 已达成，待完善功能

---

## 目录

1. [核心功能缺失（P1 - 高优先级）](#核心功能缺失p1---高优先级)
2. [体验优化（P2 - 中优先级）](#体验优化p2---中优先级)
3. [类型错误（非阻塞性）](#类型错误非阻塞性)
4. [代码质量（P2/P3）](#代码质量p2p3)
5. [业务功能（P3 - 低优先级）](#业务功能p3---低优先级)
6. [建议的下一轮任务优先级](#建议的下一轮任务优先级)

---

## 核心功能缺失（P1 - 高优先级）

### 1.1 ValidatorRegistry（自定义校验规则）

**状态**: ❌ 未实现

**描述**: 
- 目前只有内置的 required、pattern、type 校验
- 缺少自定义校验规则注册机制
- 无法在属性面板中编辑校验规则

**实现方案**:
```typescript
// types/validatorRegistry.ts
export interface ValidatorRegistry {
  register(name: string, validator: Validator): void
  get(name: string): Validator | undefined
  has(name: string): boolean
}

export interface Validator {
  validate(value: any, rule: any): boolean | Promise<boolean>
  message: string | ((value: any) => string)
}
```

**文件位置**:
- 新建: `prototype/src/types/validatorRegistry.ts`
- 修改: `designer/FieldProperties.vue` - 添加校验规则编辑器

**依赖**: 无

**预估工作量**: 2-3 小时

---

### 1.2 自定义校验器 UI

**状态**: ❌ 未实现

**描述**:
- 在字段属性面板中添加校验规则编辑器
- 支持动态添加/删除/编辑校验规则
- 支持自定义校验规则的下拉选择

**实现方案**:
在 `FieldProperties.vue` 中添加：
```vue
<el-form-item label="校验规则">
  <div v-for="(rule, index) in rules" :key="index" class="validator-rule">
    <el-select v-model="rule.type" placeholder="规则类型">
      <el-option label="必填" value="required" />
      <el-option label="正则" value="pattern" />
      <el-option label="自定义" value="custom" />
    </el-select>
    <el-input v-if="rule.type === 'pattern'" v-model="rule.pattern" />
    <el-button @click="removeRule(index)" icon="Delete" />
  </div>
  <el-button @click="addRule" icon="Plus">添加规则</el-button>
</el-form-item>
```

**文件位置**:
- 修改: `designer/FieldProperties.vue`

**依赖**: 1.1 ValidatorRegistry

**预估工作量**: 3-4 小时

---

## 体验优化（P2 - 中优先级）

### 2.1 StdForm 适配层

**状态**: ❌ 未实现

**描述**:
- 连接现有 MES 项目的 `RelationRegister`
- 连接现有 MES 项目的 `useArrayRefManager`
- 支持关系字段 x-relation 扩展

**实现方案**:
```typescript
// stdform/adapter.ts
export function createStdFormAdapter({
  relationRegister,
  arrayRefManager,
}: StdFormDeps) {
  return {
    resolveRelation: (relationKey: string) => {
      return relationRegister.get(relationKey)
    },
    createArrayField: (relationKey: string) => {
      return useArrayRefManager(relationKey)
    },
  }
}
```

**文件位置**:
- 新建: `prototype/src/stdform/adapter.ts`
- 新建: `prototype/src/stdform/RelationField.vue`
- 修改: `types/schema.ts` - 添加 x-relation 类型定义

**依赖**: 无（需 MES 项目源码）

**预估工作量**: 4-6 小时

---

### 2.2 吸附检测修复

**状态**: ⚠️ 部分实现

**描述**:
- `updateOtherPositions` 未调用，导致吸附检测不生效
- 自由布局拖拽体验差，无对齐辅助线

**问题定位**:
在 `FreeCanvas.vue` 的 `handleMouseMove` 中：
```typescript
// 需要调用这个函数更新其他节点位置
updateOtherPositions(selectedNodeId.value, { x: newX, y: newY })
```

**实现方案**:
1. 实现 `updateOtherPositions` 函数（计算吸附点）
2. 在拖拽时实时计算吸附距离
3. 在画布上绘制辅助线和吸附点

**文件位置**:
- 修改: `designer/FreeCanvas.vue`
- 修改: `designer/SnapLines.vue` - 已存在但未正确使用

**依赖**: 无

**预估工作量**: 2-3 小时

---

### 2.3 FreeCanvas.vue emit 类型修复

**状态**: ⚠️ 类型问题

**描述**:
- 运行时功能正常，但 TypeScript 报错
- emit 重载问题导致类型推断失败

**错误信息**:
```
src/designer/FreeCanvas.vue(88,28): error TS2769: No overload matches this call.
src/designer/FreeCanvas.vue(97,28): error TS2769: No overload matches this call.
```

**修复方案**:
检查 emit 调用位置，确保参数类型匹配 emit 定义：
```typescript
// 当前可能的问题
emit('update-node-position', props.selectedNodeId, {
  x: newX,
  y: newY,
  // 可能有额外属性导致类型不匹配
})

// 应该明确类型
emit('update-node-position', props.selectedNodeId!, { x: newX, y: newY })
```

**文件位置**:
- 修改: `designer/FreeCanvas.vue`

**依赖**: 无

**预估工作量**: 30 分钟

---

### 2.4 i18n 运行时支持

**状态**: ❌ 未实现

**描述**:
- Schema 已支持 i18n key 结构
- 但运行时缺少动态语言切换机制
- 与项目现有 `useNsI18n` 未集成

**实现方案**:
1. 创建 `I18nProvider` 组件
2. 使用 Vue provide/inject 注入翻译函数
3. 在 FieldRenderer 中自动翻译 title/description

```typescript
// renderer/I18nProvider.vue
const i18n = inject('i18n')
const t = (key: string, fallback?: string) => {
  return i18n?.t(key) ?? fallback
}
provide('translate', t)
```

**文件位置**:
- 新建: `prototype/src/renderer/I18nProvider.vue`
- 修改: `renderer/FieldRenderer.vue` - 集成翻译
- 修改: `App.vue` - 包裹 I18nProvider

**依赖**: 项目现有 `useNsI18n` 源码

**预估工作量**: 3-4 小时

---

## 类型错误（非阻塞性）

### 3.1 Designer.vue 类型错误

**状态**: ⚠️ 类型错误

**描述**: 简化版设计器（非主入口 App.vue），组件 props 类型不匹配

**错误信息**:
```
src/designer/Designer.vue(103,10): error TS2345: Argument of type '{ nodes: Record<string, FieldSchema>; ... }' 
is not assignable to parameter of type '{ readonly schema: PageSchema; ... }'.
```

**影响**: 不影响主入口（App.vue 使用 LowcodeDesigner）

**修复方案**:
检查 Designer.vue 第 103 行的 props 传递，确保类型匹配

**文件位置**:
- 修改: `designer/Designer.vue`

**优先级**: P3（低）

**预估工作量**: 30 分钟

---

### 3.2 FieldRenderer.vue 类型错误

**状态**: ⚠️ 类型错误

**描述**: 
1. FormItemRule 类型不匹配
2. display 属性比较类型错误
3. 表达式可能为 null 的误报

**错误信息**:
```
src/renderer/FieldRenderer.vue(33,10): Type '...' is not assignable to type 'Arrayable<FormItemRule> | undefined'.
src/renderer/FieldRenderer.vue(118,41): This comparison appears to be unintentional.
src/renderer/FieldRenderer.vue(226,5): This expression is never nullish.
```

**修复方案**:
1. 使用 `as any` 临时绕过 Element Plus 类型问题
2. 修复 display 属性比较逻辑
3. 添加明确的 null 检查或使用非空断言

**文件位置**:
- 修改: `renderer/FieldRenderer.vue`

**优先级**: P3（低）

**预估工作量**: 1-2 小时

---

### 3.3 FlowLayout.vue 类型错误

**状态**: ⚠️ 类型错误

**描述**: FormModel 可选类型问题

**错误信息**:
```
src/renderer/FlowLayout.vue(16,10): Type 'FormModel | null' is not assignable to type 'FormModel'.
src/renderer/FlowLayout.vue(26,10): Type 'FormModel | null' is not assignable to type 'FormModel'.
```

**修复方案**:
在传递给子组件时添加非空断言或可选链：
```typescript
<FormItem v-bind="item" :form-model="formModel!" />
```

**文件位置**:
- 修改: `renderer/FlowLayout.vue`

**优先级**: P3（低）

**预估工作量**: 30 分钟

---

### 3.4 FormRenderer.vue 类型错误

**状态**: ⚠️ 类型错误

**描述**:
1. boolean 类型访问 value 属性
2. 返回值类型不完整

**错误信息**:
```
src/renderer/FormRenderer.vue(22,37): Property 'value' does not exist on type 'boolean'.
src/renderer/FormRenderer.vue(28,10): Type '{ ... }' is missing the following properties: _fields, _initFromSchema, ...
```

**修复方案**:
1. 检查设计模式 prop 的类型定义
2. 修复 FormModel 返回值类型

**文件位置**:
- 修改: `renderer/FormRenderer.vue`

**优先级**: P3（低）

**预估工作量**: 1-2 小时

---

### 3.5 Element Plus locale 类型

**状态**: ⚠️ 类型错误（第三方库）

**描述**: Element Plus locale 模块缺少类型定义

**错误信息**:
```
src/App.vue(65,18): error TS7016: Could not find a declaration file for module 'element-plus/dist/locale/zh-cn.mjs'.
```

**修复方案**:
添加类型声明文件：
```typescript
// types/element-plus.d.ts
declare module 'element-plus/dist/locale/zh-cn.mjs'
```

**文件位置**:
- 新建: `prototype/src/types/element-plus.d.ts`

**优先级**: P3（低）

**预估工作量**: 10 分钟

---

## 代码质量（P2/P3）

### 4.1 单元测试

**状态**: ❌ 未编写

**描述**: 
- ReactionsEngine 核心逻辑未测试
- FormModel 状态管理未测试
- 高回归风险

**测试覆盖目标**:
- `types/model.ts` - FormModel 所有公开方法
- `types/reactions.ts` - ReactionsEngine 核心逻辑
- `types/componentRegistry.ts` - 组件注册表
- `designer/designerEngine.ts` - 设计器引擎

**测试框架**: Vitest + Vue Test Utils

**文件位置**:
- 新建: `prototype/src/__tests__/model.test.ts`
- 新建: `prototype/src/__tests__/reactions.test.ts`
- 新建: `prototype/src/__tests__/componentRegistry.test.ts`
- 新建: `prototype/src/__tests__/designerEngine.test.ts`

**优先级**: P2（中）

**预估工作量**: 8-12 小时

---

### 4.2 Schema AJV 校验

**状态**: ❌ 未实现

**描述**: 
- 缺少运行时 Schema 格式验证
- 错误的 Schema 可能导致崩溃
- 需要使用 AJV (Another JSON Schema Validator)

**实现方案**:
```typescript
import Ajv from 'ajv'
import type { PageSchema } from './schema'

const ajv = new Ajv({ allErrors: true })

export function validatePageSchema(schema: unknown): PageSchema {
  const validate = ajv.compile(pageSchemaDefinition)
  const valid = validate(schema)
  
  if (!valid) {
    throw new Error('Schema 校验失败: ' + ajv.errorsText(validate.errors))
  }
  
  return schema as PageSchema
}
```

**文件位置**:
- 新建: `prototype/src/types/schemaValidator.ts`
- 修改: `designer/designerEngine.ts` - 在 loadSchema 时校验

**优先级**: P2（中）

**预估工作量**: 2-3 小时

---

### 4.3 错误边界

**状态**: ❌ 未实现

**描述**:
- 缺少全局错误处理
- 渲染错误可能导致白屏
- 需要使用 Vue Error Handler

**实现方案**:
```typescript
// main.ts
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', err, instance, info)
  ElMessage.error('发生错误: ' + err.message)
}

// ErrorBoundary.vue
export default {
  name: 'ErrorBoundary',
  setup(props, { slots, emit }) {
    onErrorCaptured((err) => {
      emit('error', err)
      return false // 阻止错误继续向上传播
    })
    return () => slots.default?.()
  },
}
```

**文件位置**:
- 修改: `prototype/src/main.ts`
- 新建: `prototype/src/renderer/ErrorBoundary.vue`

**优先级**: P2（中）

**预估工作量**: 1-2 小时

---

### 4.4 ComponentRegistry 懒加载

**状态**: ❌ 未实现

**描述**:
- 目前所有组件同步加载
- 首屏性能可优化
- 需要实现按需加载

**实现方案**:
```typescript
// types/componentRegistry.ts
export function registerAsyncWidget(
  name: string,
  loader: () => Promise<{ default: Component }>
) {
  const asyncComponent = defineAsyncComponent({
    loader,
    loading: LoadingSpinner,
    error: ErrorPlaceholder,
  })
  registerWidget(name, asyncComponent)
}
```

**文件位置**:
- 修改: `prototype/src/types/componentRegistry.ts`

**优先级**: P3（低）

**预估工作量**: 2-3 小时

---

### 4.5 代码分割

**状态**: ❌ 未实现

**描述**:
- 当前打包为单个文件
- 需要按路由或模块分割

**实现方案**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'designer': ['./src/designer/index'],
          'renderer': ['./src/renderer/index'],
        },
      },
    },
  },
})
```

**文件位置**:
- 修改: `prototype/vite.config.ts`

**优先级**: P3（低）

**预估工作量**: 1 小时

---

## 业务功能（P3 - 低优先级）

### 5.1 关系字段 x-relation

**状态**: ❌ 未实现

**描述**:
- Schema 已定义 x-relation 扩展结构
- 缺少 RelationField 组件
- 缺少与 RelationRegister 的集成

**实现方案**:
```typescript
// renderer/RelationField.vue
const relation = computed(() => {
  if (!props.schema['x-relation']) return null
  return useRelation(props.schema['x-relation'])
})
```

**文件位置**:
- 新建: `prototype/src/renderer/RelationField.vue`
- 修改: `types/schema.ts` - 完善 x-relation 类型

**依赖**: 2.1 StdForm 适配层

**优先级**: P3（低）

**预估工作量**: 4-6 小时

---

### 5.2 代码生成增强

**状态**: ⚠️ 基础完成

**描述**:
- 已实现基础 Vue SFC 生成
- 可进一步增强：
  - 添加更多代码模板
  - 支持 Options API / Composition API 选择
  - 支持自定义代码生成规则

**增强方向**:
1. 添加 TypeScript 类型导出
2. 生成完整的表单组件（含校验）
3. 生成 API 接口类型

**文件位置**:
- 修改: `designer/designerEngine.ts` - enhance `generateCode()` 方法

**优先级**: P3（低）

**预估工作量**: 2-3 小时

---

### 5.3 主题定制

**状态**: ❌ 未实现

**描述**:
- 缺少 CSS 变量注入机制
- 无法动态切换主题

**实现方案**:
```typescript
// renderer/ThemeProvider.vue
const theme = ref({
  primaryColor: '#409eff',
  borderRadius: '4px',
  // ...
})

provide('theme', theme)
```

**文件位置**:
- 新建: `prototype/src/renderer/ThemeProvider.vue`
- 新建: `prototype/src/renderer/theme.css`

**优先级**: P3（低）

**预估工作量**: 2-3 小时

---

### 5.4 多语言 Schema 运行时

**状态**: ⚠️ 结构已定义

**描述**:
- Schema 已支持 i18n key 结构
- 但运行时未实现

**参考**: 2.4 i18n 运行时支持

**优先级**: P3（低）

**预估工作量**: 见 2.4

---

## 建议的下一轮任务优先级

### 立即执行（本周）

| 优先级 | 任务 | 预估时间 | 理由 |
|--------|------|----------|------|
| 🔴 P1 | FreeCanvas.vue emit 类型修复 | 30分钟 | 清理 TypeScript 警告 |
| 🔴 P1 | 2.3 吸附检测修复 | 2-3小时 | 提升自由布局体验 |
| 🔴 P1 | 1.1 ValidatorRegistry | 2-3小时 | 支持自定义校验 |
| 🔴 P1 | 1.2 自定义校验器 UI | 3-4小时 | 完善校验功能 |

### 短期任务（下周）

| 优先级 | 任务 | 预估时间 | 理由 |
|--------|------|----------|------|
| 🟡 P2 | 2.1 StdForm 适配层 | 4-6小时 | 打通现有 MES 系统 |
| 🟡 P2 | 4.1 单元测试（核心模块） | 8-12小时 | 降低回归风险 |
| 🟡 P2 | 3.x 类型错误批量修复 | 3-5小时 | 提升代码质量 |

### 中期任务（迭代中）

| 优先级 | 任务 | 预估时间 | 理由 |
|--------|------|----------|------|
| 🟢 P3 | 2.4 i18n 运行时 | 3-4小时 | 完善多语言支持 |
| 🟢 P3 | 4.2 Schema AJV 校验 | 2-3小时 | 提升稳定性 |
| 🟢 P3 | 4.3 错误边界 | 1-2小时 | 防止白屏 |
| 🟢 P3 | 4.4 ComponentRegistry 懒加载 | 2-3小时 | 性能优化 |

---

## 任务依赖关系图

```
1.1 ValidatorRegistry
       ↓
   1.2 自定义校验器 UI
       ↓
   [校验功能完整]

2.3 吸附检测修复
       ↓
   [自由布局体验完整]

2.1 StdForm 适配层
       ↓
   5.1 关系字段 x-relation
       ↓
   [MES 业务集成完整]

4.1 单元测试
       ↓
   4.2 Schema AJV 校验
       ↓
   4.3 错误边界
       ↓
   [质量保障完整]

2.4 i18n 运行时
       ↓
   5.4 多语言 Schema
       ↓
   [国际化完整]
```

---

## 附录

### A. MVP 已完成功能

✅ 物料面板
✅ 画布拖放
✅ 属性面板
✅ 流式布局
✅ 自由布局（拖拽/缩放）
✅ 预览
✅ 导出 Schema
✅ 撤销/重做
✅ 复制/删除
✅ 上移/下移

### B. 技术债务

| 债务 | 优先级 | 预估修复时间 |
|------|--------|--------------|
| 滥用 `as any` | P3 | 重构时 |
| 缺少注释 | P3 | 按需 |
| 代码风格不一致 | P3 | 按需 |
| 性能监控缺失 | P3 | 按需 |

### C. 相关文档

- MVP 修复计划: `D:\demo\ai\aiSpace\design\mvp-fix-plan-2026-03-26.md`
- 开发进展报告: `D:\demo\ai\aiSpace\design\dev-progress-2026-03-26.md`
- 代码审查报告: `D:\demo\ai\aiSpace\design\code-review-issues-2026-03-26.md`
- 质检报告: `D:\demo\ai\aiSpace\qa-reports\2026-03-26-prototype-qa-report.md`

---

**文档版本**: 1.0
**最后更新**: 2026-03-26 12:26
**维护者**: workbuddy agent
