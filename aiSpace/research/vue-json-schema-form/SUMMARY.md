# vue-json-schema-form 研究总结

> 研究时间：2026-03-25
> GitHub：https://github.com/lljj-x/vue-json-schema-form
> Stars：2.3k
> 当前版本：v1.19.1

## 一、项目定位

**vue-json-schema-form** 是基于 **标准 JSON Schema** 的表单生成器，核心理念是 **"一份 Schema，多端适配"**。

### 特点

| 特性 | vue-json-schema-form | Formily |
|------|----------------------|---------|
| Schema | 标准 JSON Schema | JSON Schema 扩展 |
| UI 库 | 多库适配 | 需要特定适配包 |
| 学习成本 | 中等 | 较高 |
| 跨框架 | Vue 2/Vue 3 | React/Vue |
| 校验 | ajv | 内置校验系统 |

---

## 二、支持的 UI 库

| Vue 版本 | UI 库 | 包名 |
|----------|-------|------|
| Vue 2 | Element UI | @lljj/vue-json-schema-form |
| Vue 2 | iView 3 | @lljj/vue2-form-iview3 |
| Vue 3 | Element Plus | @lljj/vue3-form-element |
| Vue 3 | Ant Design Vue | @lljj/vue3-form-ant |
| Vue 3 | Naive UI | @lljj/vue3-form-naive |

---

## 三、核心架构

### 3.1 基本概念

```
JSON Schema → 递归解析 → Field → Widget
```

- **Field**：渲染每个节点的组件，包含 FormItem
- **Widget**：用户输入组件（Input、Select 等），被 FormItem 包裹

### 3.2 架构图

```
┌─────────────────────────────────────────┐
│            VueForm (入口组件)             │
├─────────────────────────────────────────┤
│            Schema 解析层                  │
├─────────────────────────────────────────┤
│   Field (字段组件)                       │
│   ├── FormItem (装饰器)                  │
│   └── Widget (输入组件)                  │
├─────────────────────────────────────────┤
│            ajv 校验层                     │
└─────────────────────────────────────────┘
```

### 3.3 组件递归渲染

```
Object Schema
├── Field (ObjectField)
│   ├── Field (StringField)
│   │   └── Widget (InputWidget)
│   ├── Field (NumberField)
│   │   └── Widget (InputNumberWidget)
│   └── Field (ArrayField)
│       └── Field (ItemField) × N
```

---

## 四、JSON Schema 使用

### 4.1 基本示例

```vue
<template>
  <VueForm
    :schema="schema"
    :formData="formData"
    @onFormDataChange="handleChange"
  />
</template>

<script>
export default {
  data() {
    return {
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            title: '姓名',
            minLength: 2
          },
          age: {
            type: 'number',
            title: '年龄',
            minimum: 0
          }
        }
      },
      formData: {}
    }
  }
}
</script>
```

### 4.2 ui-schema 配置

通过 `ui-schema` 自定义 UI 表现：

```javascript
const uiSchema = {
  name: {
    'ui:title': '用户名',           // 自定义标题
    'ui:description': '请输入姓名', // 自定义描述
    'ui:placeholder': '请输入',     // 占位符
    'ui:widget': 'InputWidget',    // 指定组件
    'ui:options': {                 // 组件属性
      clearable: true,
      showWordLimit: true
    },
    'ui:disabled': false,          // 是否禁用
    'ui:hidden': false             // 是否隐藏
  }
}
```

### 4.3 自定义 Widget

```vue
<template>
  <el-input v-model="value" v-bind="widgetProps" />
</template>

<script>
export default {
  props: ['value', 'widgetProps'],
  emits: ['input'],
  computed: {
    value: {
      get() { return this.value },
      set(val) { this.$emit('input', val) }
    }
  }
}
</script>
```

注册自定义 Widget：
```javascript
const uiSchema = {
  customField: {
    'ui:widget': 'CustomWidget'
  }
}

// 全局注册
app.component('CustomWidget', CustomWidget)
```

### 4.4 自定义 Field

```vue
<template>
  <div class="custom-field">
    <slot />
  </div>
</template>

<script>
export default {
  props: ['schema', 'formData', 'rootSchema']
}
</script>
```

---

## 五、校验系统

### 5.1 ajv 校验

使用标准 JSON Schema 校验规则：

```javascript
const schema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',    // 内置格式
      title: '邮箱'
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150,
      title: '年龄'
    },
    website: {
      type: 'string',
      format: 'uri',
      title: '网站'
    }
  }
}
```

### 5.2 自定义校验错误信息

```javascript
const uiSchema = {
  email: {
    'ui:errMessage': {
      format: '请输入正确的邮箱格式',
      required: '邮箱为必填项'
    }
  }
}
```

---

## 六、对 StdForm 的借鉴意义

### 6.1 可借鉴点

| vue-json-schema-form 设计 | StdForm 可借鉴 |
|---------------------------|----------------|
| 标准 JSON Schema | 减少学习成本，后端友好 |
| Field + Widget 分离 | 组件职责清晰 |
| ui-schema 配置 | UI 与数据分离 |
| 多 UI 库适配 | 灵活切换 UI 库 |
| ajv 校验 | 标准校验规则 |

### 6.2 Schema 设计参考

```typescript
// StdForm 可采用类似结构
interface StdFormConfig {
  schema: JSONSchema;      // 标准 JSON Schema
  uiSchema?: UiSchema;     // UI 配置
  formData: Record<string, any>;  // 表单数据
}

// UI Schema 扩展
interface UiSchema {
  [field: string]: {
    'ui:widget'?: string;       // 组件名
    'ui:options'?: object;      // 组件属性
    'ui:title'?: string;        // 自定义标题
    'ui:hidden'?: boolean;      // 是否隐藏
    'ui:disabled'?: boolean;    // 是否禁用
    'ui:errMessage'?: object;   // 错误信息
  }
}
```

### 6.3 关键差异

| 维度 | vue-json-schema-form | StdForm 需求 |
|------|----------------------|--------------|
| 联动 | 简单联动 | 复杂联动（1对多、多对多） |
| 关系 | 无 | 需要关系字段 |
| 国际化 | 无内置 | 需要深度集成 |
| 数据源 | 无内置 | 需要 API 数据加载 |

---

## 七、优缺点分析

### 优点

1. **标准 JSON Schema**：学习成本低，后端友好
2. **多 UI 库支持**：Element、Ant Design、Naive UI 等
3. **Vue 2/3 兼容**：迁移成本低
4. **递归渲染**：支持任意嵌套结构
5. **可视化工具**：Schema 生成器

### 局限

1. **联动能力弱**：无法处理复杂联动
2. **无关系处理**：不支持 1对多、多对多
3. **国际化缺失**：需要自行实现
4. **性能一般**：递归渲染，大量字段可能有性能问题

---

## 八、后续研究建议

1. **性能优化**：研究大量字段场景的性能优化
2. **联动扩展**：参考 Formily 的 x-reactions 扩展联动
3. **国际化集成**：与项目 i18n 系统集成方案
4. **关系字段**：扩展 Schema 支持关系字段

---

## 九、参考链接

- GitHub：https://github.com/lljj-x/vue-json-schema-form
- 文档：https://vue-json-schema-form.lljj.me/
- Playground：https://form.lljj.me/
- Schema 生成器：https://form.lljj.me/schema-generator.html
- 活动编辑器：https://form.lljj.me/vue-editor.html