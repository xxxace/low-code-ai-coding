# form-generator 研究总结

> 研究时间：2026-03-25
> GitHub：https://github.com/JakHuang/form-generator
> Stars：9.3k
> 技术栈：Vue 2 + Element UI

## 一、项目定位

**form-generator** 是一个简洁的 **Element UI 表单设计及代码生成器**，核心理念是 **"可视化设计 → 生成代码"**。

### 特点

| 特性 | form-generator | Formily |
|------|----------------|---------|
| 定位 | 代码生成器 | 表单运行时方案 |
| 技术栈 | Vue 2 + Element UI | React/Vue 跨框架 |
| 学习成本 | 低 | 高 |
| 运行时 | 无（生成代码后独立运行） | 需要核心库 |
| 联动 | 简单联动 | 复杂联动系统 |

---

## 二、核心架构

### 2.1 设计器 → 代码生成 → 解析器

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   设计器     │ ──→ │   JSON      │ ──→ │  Vue 代码   │
│ (可视化拖拽)  │     │  (存储)      │     │  (生成)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ↓
                    ┌─────────────┐
                    │   解析器     │
                    │ (JSON→表单)  │
                    └─────────────┘
```

### 2.2 组件结构

```
src/
├── components/
│   ├── render/          # 右侧预览渲染器
│   ├── parser/          # JSON 解析器（独立 npm 包）
│   └── CodeEditor/      # 代码编辑器（Monaco）
├── generator/           # 代码生成逻辑
├── layouts/             # 布局组件
└── views/               # 页面
```

---

## 三、JSON Schema 设计

### 3.1 基本结构

```javascript
{
  // 配置信息
  __config__: {
    layout: 'colFormItem',      // 布局方式
    tag: 'el-input',            // 组件标签
    tagIcon: 'input',           // 图标
    label: '用户名',             // 标签文本
    labelWidth: 110,            // 标签宽度
    showLabel: true,            // 是否显示标签
    required: true,             // 是否必填
    span: 24,                   // 栅格数
    defaultValue: '',           // 默认值
    regList: [                  // 正则校验
      { pattern: '/^[a-zA-Z]+$/', message: '只能输入字母' }
    ],
    changeTag: true,            // 是否允许切换组件
    document: 'https://...'     // 文档地址
  },
  
  // v-model 绑定字段名
  __vModel__: 'username',
  
  // 插槽内容
  __slot__: {
    prepend: '前缀',
    append: '后缀'
  },
  
  // 组件属性（直接透传给 Element UI 组件）
  placeholder: '请输入用户名',
  clearable: true,
  disabled: false
}
```

### 3.2 布局类型

#### colFormItem（列布局）
- 生成 `el-col` 包裹的组件
- 使用 24 栅格系统

#### rowFormItem（行布局）
- 生成空的 `el-row`
- 支持子组件嵌套（`__config__.children`）

### 3.3 嵌套结构示例

```javascript
{
  __config__: {
    layout: 'rowFormItem',
    componentName: 'row',
    children: [
      {
        __config__: {
          layout: 'colFormItem',
          tag: 'el-input',
          label: '字段1',
          span: 12
        },
        __vModel__: 'field1'
      },
      {
        __config__: {
          layout: 'colFormItem',
          tag: 'el-input',
          label: '字段2',
          span: 12
        },
        __vModel__: 'field2'
      }
    ]
  }
}
```

---

## 四、代码生成机制

### 4.1 生成流程

```
JSON Schema → 遍历节点 → 拼接字符串 → Vue SFC
```

### 4.2 生成示例

**输入 JSON：**
```javascript
{
  __config__: {
    tag: 'el-input',
    label: '用户名',
    required: true
  },
  __vModel__: 'username',
  placeholder: '请输入'
}
```

**输出代码：**
```vue
<el-form-item label="用户名" prop="username">
  <el-input v-model="formData.username" placeholder="请输入" />
</el-form-item>
```

### 4.3 生成器核心

```javascript
// 简化的生成逻辑
function generateComponent(schema) {
  const { __config__, __vModel__, ...props } = schema;
  const tagName = __config__.tag;
  
  // 生成属性字符串
  const propsStr = Object.entries(props)
    .map(([key, value]) => `:${key}="${value}"`)
    .join(' ');
  
  // 生成 v-model
  const vModel = __vModel__ ? `v-model="formData.${__vModel__}"` : '';
  
  return `<${tagName} ${vModel} ${propsStr} />`;
}
```

---

## 五、解析器（form-gen-parser）

### 5.1 用途

将存储在数据库中的 JSON 表单解析成真实的表单组件。

### 5.2 使用方式

```bash
npm i form-gen-parser
```

```vue
<template>
  <parser :form-conf="formConf" />
</template>

<script>
import Parser from 'form-gen-parser'

export default {
  components: { Parser },
  data() {
    return {
      formConf: { /* JSON Schema */ }
    }
  }
}
</script>
```

---

## 六、对 StdForm 的借鉴意义

### 6.1 可借鉴点

| form-generator 设计 | StdForm 可借鉴 |
|---------------------|----------------|
| JSON Schema 结构 | `__config__` + `__vModel__` 分离 |
| 代码生成机制 | 配置 → Vue 代码生成 |
| 解析器独立 | 设计器与渲染器分离 |
| 栅格布局 | 24 栅格系统 |

### 6.2 局限性

| 维度 | form-generator | StdForm 需求 |
|------|----------------|--------------|
| Vue 版本 | Vue 2 | Vue 3 |
| UI 库 | Element UI | Element Plus |
| 联动 | 简单 | 复杂联动 |
| 关系 | 无 | 1对多、多对多 |
| 运行时 | 无 | 需要动态渲染 |

### 6.3 Schema 改进建议

```typescript
// StdForm 可采用的 Schema 结构（借鉴 form-generator）
interface StdFieldSchema {
  // 配置信息
  config: {
    tag: string;           // 组件标签
    label: string;         // 标签文本
    labelWidth?: number;   // 标签宽度
    span?: number;         // 栅格数
    required?: boolean;    // 是否必填
    rules?: Rule[];        // 校验规则
    visible?: boolean;     // 是否显示
    disabled?: boolean;    // 是否禁用
  };
  
  // 字段绑定
  field: string;           // 字段名
  defaultValue?: any;      // 默认值
  
  // 组件属性
  props?: Record<string, any>;
  
  // 插槽
  slots?: Record<string, string>;
  
  // 联动（扩展）
  reactions?: Reaction[];
  
  // 关系（扩展）
  relation?: {
    type: 'one-to-many' | 'many-to-many';
    target: string;
  };
}
```

---

## 七、优缺点分析

### 优点

1. **简单易用**：学习成本低，上手快
2. **代码生成**：生成纯净 Vue 代码，无运行时依赖
3. **配套完善**：VSCode 插件、解析器、文档齐全
4. **Element UI 深度集成**：开箱即用

### 局限

1. **Vue 2 限制**：不支持 Vue 3
2. **联动能力弱**：无法处理复杂联动
3. **无运行时**：只能生成代码，无法动态渲染
4. **无关系处理**：不支持 1对多、多对多

---

## 八、后续研究建议

1. **Vue 3 迁移**：研究如何迁移到 Vue 3 + Element Plus
2. **运行时扩展**：添加动态渲染能力
3. **联动增强**：参考 Formily 的 x-reactions 机制
4. **关系支持**：扩展 Schema 支持关系字段

---

## 九、参考链接

- GitHub：https://github.com/JakHuang/form-generator
- 在线预览：https://jakhuang.github.io/form-generator
- VSCode 插件：https://github.com/JakHuang/form-generator-plugin
- JSON 解析器：form-gen-parser
- 教程：https://github.com/JakHuang/form-generator/issues/30