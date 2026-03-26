# 物料系统研究汇总

> 研究时间：2026-03-26
> 研究目标：为低代码设计器设计物料注册机制

## 一、研究概览

### 1.1 研究范围

| 主题 | 来源 | 文档 |
|------|------|------|
| Formily 组件装饰器 | formilyjs.org | 01-formily-component.md |
| VTJ.PRO BlockSchema | vtj.pro | 02-vtj-block.md |
| variant-form Widget | vform666.com | 03-variant-widget.md |
| StdForm 组件适配 | 项目源码 | 04-stdform-adapter.md |

### 1.2 核心概念对比

| 维度 | Formily | VTJ.PRO | VForm 3 | StdForm |
|------|---------|---------|---------|---------|
| 物料定义 | connect + mapProps | MaterialDescription | Widget Schema | componentMap |
| 属性配置 | x-component-props | props + setter | options | componentProps |
| 设计器支持 | designable | 内置 | 内置 | 无 |
| 学习曲线 | 高 | 中 | 低 | 低 |

---

## 二、方案对比分析

### 2.1 Formily 方案

**优点**：
- 声明式联动（x-reactions）
- 完善的校验系统
- 多 UI 库支持

**缺点**：
- 概念复杂，学习成本高
- 设计器需要额外集成
- Vue 3 支持相对弱

**借鉴点**：
```typescript
// connect + mapProps 模式
const Input = connect(ElInput, mapProps({ readOnly: 'readonly' }))
```

### 2.2 VTJ.PRO 方案

**优点**：
- MaterialDescription 接口完整
- 设计器内置
- 嵌套规则（parentIncludes/childIncludes）

**缺点**：
- 文档分散
- 概念较多

**借鉴点**：
```typescript
interface MaterialDescription {
  name: string
  label: string
  props: PropDefinition[]
  snippet: Partial<NodeSchema>
  parentIncludes?: string[]
}
```

### 2.3 VForm 3 方案

**优点**：
- 学习曲线低
- 设计器开箱即用
- 三端布局支持

**缺点**：
- 类型定义弱
- 关系处理弱
- Pro 版收费

**借鉴点**：
```typescript
const widgetSchema = {
  type: 'input',
  options: {
    name: 'username',
    label: '用户名',
    placeholder: '请输入'
  }
}
```

### 2.4 StdForm 现有方案

**优点**：
- RelationRegister 管理主从表
- FieldItem 统一字段包装
- 与业务深度集成

**缺点**：
- 无设计器支持
- 无 Schema 定义
- 组件注册分散

**保留点**：
- RelationRegister 关系管理
- StdFormStore 状态管理
- 业务组件（DialogPicker 等）

---

## 三、推荐方案

### 3.1 物料注册接口设计

综合各方案优点，推荐以下设计：

```typescript
/**
 * 组件元信息（设计器用）
 */
interface ComponentMeta {
  // 基本信息
  name: string              // 组件名（必需）
  title: string             // 显示标题
  icon: string              // 图标
  group: string             // 分组（basic/select/date/advanced）
  
  // 属性定义（用于属性面板）
  props?: PropDefinition[]
  
  // 事件定义
  events?: EventDefinition[]
  
  // 默认 Schema
  defaultSchema: Partial<FieldSchema>
  
  // 嵌套规则
  parentIncludes?: string[]
  childIncludes?: string[]
  
  // 业务扩展
  objectName?: string       // 关联对象名（业务组件用）
}

/**
 * 属性定义
 */
interface PropDefinition {
  name: string
  title: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'object' | 'array'
  defaultValue?: any
  setter?: 'input' | 'switch' | 'select' | 'code' | 'icon'
  options?: { label: string; value: any }[]
}

/**
 * 事件定义
 */
interface EventDefinition {
  name: string
  title: string
  params?: PropDefinition[]
}
```

### 3.2 组件注册表实现

```typescript
/**
 * 组件注册表
 */
class ComponentRegistry {
  private _widgets = new Map<string, WidgetRegistration>()
  private _decorators = new Map<string, DecoratorRegistration>()
  
  // 注册 Widget
  registerWidget(name: string, component: Component, meta: ComponentMeta): this
  
  // 注册 Decorator
  registerDecorator(name: string, component: Component): this
  
  // 获取组件
  getWidget(name: string): Component | null
  
  // 获取元信息
  getWidgetMeta(name: string): ComponentMeta | null
  
  // 按分组获取
  getWidgetMetasByGroup(): Record<string, ComponentMeta[]>
}
```

### 3.3 内置组件注册示例

```typescript
// 基础组件
registry.registerWidget('Input', ElInput, {
  name: 'Input',
  title: '输入框',
  icon: 'EditPen',
  group: 'basic',
  
  props: [
    { name: 'placeholder', title: '占位符', type: 'string', setter: 'input' },
    { name: 'disabled', title: '禁用', type: 'boolean', setter: 'switch' },
    { name: 'maxlength', title: '最大长度', type: 'number', setter: 'input' }
  ],
  
  events: [
    { name: 'change', title: '值变化' },
    { name: 'focus', title: '获得焦点' },
    { name: 'blur', title: '失去焦点' }
  ],
  
  defaultSchema: {
    type: 'string',
    'x-component': 'Input',
    'x-component-props': { placeholder: '请输入' }
  }
})

// 业务组件
registry.registerWidget('DialogPicker', DialogPicker, {
  name: 'DialogPicker',
  title: '弹窗选择器',
  icon: 'Search',
  group: 'advanced',
  
  props: [
    { name: 'objectName', title: '对象名', type: 'string', setter: 'input' },
    { name: 'multi', title: '多选', type: 'boolean', setter: 'switch' },
    { name: 'columns', title: '列配置', type: 'array', setter: 'code' }
  ],
  
  defaultSchema: {
    type: 'string',
    'x-component': 'DialogPicker',
    'x-component-props': { objectName: '', multi: false }
  }
})

// Decorator
registry.registerDecorator('FormItem', FieldItem)
```

---

## 四、与现有系统的集成

### 4.1 保持独立

| 模块 | 说明 |
|------|------|
| RelationRegister | 主从表关系管理，不纳入 Schema |
| StdFormStore | 状态管理，继续使用 |
| useStdForm | 表单逻辑，保持不变 |

### 4.2 桥接适配

```typescript
// StdForm 适配器
export function useStdFormAdapter(stdForm: StdFormStore) {
  const formModel = useFormModel({
    initialValues: stdForm.data,
    readonly: computed(() => stdForm.readonly)
  })
  
  return formModel
}

// Schema 生成器
export function generateSchemaFromConfig(config: FormConfig): PageSchema {
  // 将现有表单配置转换为 Schema
}
```

### 4.3 渐进迁移

```
阶段 1: 创建 Registry，迁移 componentMap
    ↓
阶段 2: 定义 Schema，支持设计器渲染
    ↓
阶段 3: 属性面板自动生成
    ↓
阶段 4: 完整设计器功能
```

---

## 五、下一步行动

### 5.1 短期（1-2 周）

1. **扩展 ComponentRegistry**
   - 添加 props/events 定义
   - 支持 parentIncludes/childIncludes

2. **创建 StdFormRegistry**
   - 迁移现有 componentMap
   - 注册业务组件

3. **属性面板原型**
   - 根据 props 定义自动生成

### 5.2 中期（3-4 周）

1. **Schema 转换工具**
   - 现有配置 → Schema
   - Schema → 现有配置

2. **设计器集成**
   - 物料面板
   - 属性面板
   - 画布渲染

### 5.3 长期（1-2 月）

1. **完整设计器**
   - 拖拽布局
   - 联动配置
   - 校验规则

2. **代码生成**
   - 导出 Vue SFC
   - 导出 JSON Schema

---

## 六、参考文档

### 6.1 研究文档

- [01-formily-component.md](./01-formily-component.md) - Formily 组件装饰器模式
- [02-vtj-block.md](./02-vtj-block.md) - VTJ.PRO BlockSchema 物料
- [03-variant-widget.md](./03-variant-widget.md) - variant-form Widget 注册
- [04-stdform-adapter.md](./04-stdform-adapter.md) - StdForm 组件适配方案

### 6.2 外部链接

- Formily: https://formilyjs.org/
- VTJ.PRO: https://vtj.pro/
- VForm 3: https://www.vform666.com/
- Element Plus: https://element-plus.org/

### 6.3 原型代码

- `prototype/src/types/componentRegistry.ts` - 组件注册表
- `prototype/src/types/schema.ts` - Schema 定义
- `prototype/src/renderer/FieldRenderer.vue` - 字段渲染器