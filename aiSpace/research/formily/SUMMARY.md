# Formily 研究总结

> 研究时间：2026-03-25
> 官网：https://formilyjs.org
> GitHub：https://github.com/alibaba/formily
> Stars：12.7k
> 当前版本：v2.3.7

## 一、项目定位

**Formily** 是阿里巴巴开源的**表单领域级解决方案**，核心理念是 **"高性能 + 协议驱动"**。

### 与其他表单方案的区别

| 特性 | Formily | 传统表单方案 |
|------|---------|-------------|
| 性能 | O(1) 精确渲染 | O(n) 全量渲染 |
| 联动 | 声明式 x-reactions | 命令式手动处理 |
| 协议 | JSON Schema 扩展 | 无标准协议 |
| 跨框架 | UI 无关核心层 | 框架绑定 |
| 校验 | 内置完整校验系统 | 需自行集成 |

---

## 二、核心架构

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│           配置应用层 (JSON Schema)         │
├─────────────────────────────────────────┤
│           扩展组件层 (@formily/antd...)    │
├─────────────────────────────────────────┤
│           UI 桥接层 (@formily/react/vue)   │
├─────────────────────────────────────────┤
│           内核层 (@formily/core)           │
│    ┌─────────────────────────────┐       │
│    │   @formily/reactive (响应式)  │       │
│    └─────────────────────────────┘       │
└─────────────────────────────────────────┘
```

### 2.2 核心概念

1. **@formily/reactive**：响应式核心（类似 Mobx，但为表单优化）
2. **@formily/core**：UI 无关的领域模型
3. **@formily/react/vue**：UI 桥接层
4. **@formily/json-schema**：协议解析层

### 2.3 领域模型

```
Form (表单模型)
├── Field (普通字段)
├── ArrayField (数组字段)
├── ObjectField (对象字段)
└── VoidField (虚字段，纯 UI 容器)
```

---

## 三、JSON Schema 扩展协议

### 3.1 核心扩展属性

Formily 在标准 JSON Schema 上以 `x-*` 前缀扩展：

```json
{
  "type": "string",
  "title": "用户名",
  "description": "请输入用户名",
  
  // UI 组件扩展
  "x-component": "Input",
  "x-component-props": {
    "placeholder": "请输入",
    "maxLength": 20
  },
  
  // 装饰器扩展（FormItem）
  "x-decorator": "FormItem",
  "x-decorator-props": {
    "labelWidth": 100,
    "asterisk": true
  },
  
  // 显示控制
  "x-display": "visible",  // visible | hidden | none
  "x-pattern": "editable", // editable | disabled | readOnly
  
  // 联动逻辑
  "x-reactions": [
    {
      "dependencies": ["source"],
      "when": "{{$deps[0] == '123'}}",
      "fulfill": {
        "state": { "visible": true }
      },
      "otherwise": {
        "state": { "visible": false }
      }
    }
  ],
  
  // 校验规则
  "x-validator": [
    { "required": true, "message": "必填" },
    { "min": 3, "message": "最少3个字符" }
  ]
}
```

### 3.2 void 类型（虚节点）

用于描述纯 UI 容器，不占用数据结构：

```json
{
  "type": "void",
  "title": "卡片",
  "x-component": "Card",
  "properties": {
    "name": {
      "type": "string",
      "title": "姓名",
      "x-component": "Input"
    }
  }
}
```

### 3.3 联动系统

**被动联动**（在目标字段上声明）：
```json
{
  "x-reactions": [
    {
      "dependencies": ["fieldA", "fieldB"],
      "when": "{{$deps[0] && $deps[1]}}",
      "fulfill": {
        "state": { "visible": true }
      }
    }
  ]
}
```

**主动联动**（在源字段上声明）：
```json
{
  "x-reactions": [
    {
      "when": "{{$self.value == 'show'}}",
      "target": "targetField",
      "fulfill": {
        "state": { "visible": true }
      }
    }
  ]
}
```

---

## 四、字段模型详解

### 4.1 字段类型

| 类型 | 用途 | 特点 |
|------|------|------|
| Field | 普通字段 | 维护任意类型数据 |
| ArrayField | 数组字段 | 支持 push/pop/move，状态跟随移动 |
| ObjectField | 对象字段 | 支持 addProperty/removeProperty |
| VoidField | 虚字段 | 纯 UI 容器，无数据 |

### 4.2 字段属性

```typescript
interface Field {
  // 路径
  address: string;  // 绝对路径（包含 VoidField）
  path: string;     // 数据路径（跳过 VoidField）
  
  // 显隐
  display: 'visible' | 'hidden' | 'none';
  visible: boolean;
  hidden: boolean;
  
  // 数据
  value: any;
  initialValue: any;
  dataSource: any[];  // 下拉选项等
  
  // 组件
  component: [Component, ComponentProps];
  decorator: [Component, ComponentProps];
  
  // 校验
  validator: Validator[];
  feedbacks: Feedback[];
  errors: string[];
  warnings: string[];
  
  // 状态
  pattern: 'editable' | 'disabled' | 'readOnly';
  modified: boolean;  // 是否被用户修改过
}
```

### 4.3 路径系统

```
Form
├── VoidField (address: "card", path: "card")
│   └── Field (address: "card.name", path: "name")  ← path 跳过了 VoidField
└── Field (address: "email", path: "email")
```

---

## 五、响应式核心

### 5.1 @formily/reactive

Formily 自己实现的响应式库（类似 Mobx）：

```typescript
import { observable, autorun } from '@formily/reactive'

const state = observable({
  value: ''
})

autorun(() => {
  console.log(state.value)  // 自动追踪依赖
})

state.value = 'new value'  // 触发重新执行
```

### 5.2 依赖追踪机制

- 字段属性变化 → 自动触发响应器
- O(1) 性能：只更新依赖该属性的组件
- 无需手动管理订阅

---

## 六、对 StdForm 的借鉴意义

### 6.1 架构借鉴

| Formily 设计 | StdForm 可借鉴 |
|--------------|----------------|
| UI 无关核心层 | 分离表单逻辑与 UI |
| Reactive 响应式 | 使用 Vue 3 reactive 或 Pinia |
| JSON Schema 扩展 | 定义表单配置 Schema |
| x-reactions 联动 | 声明式联动配置 |
| VoidField 容器 | 布局容器字段 |

### 6.2 Schema 设计参考

```typescript
// StdForm 可采用的 Schema 结构
interface StdFormSchema {
  type: 'object';
  properties: Record<string, FieldSchema>;
}

interface FieldSchema {
  type: string;
  title: string;
  
  // 组件配置
  'x-component': string;
  'x-component-props': Record<string, any>;
  
  // 装饰器（FormItem）
  'x-decorator': string;
  'x-decorator-props': {
    label?: string;
    required?: boolean;
  };
  
  // 联动
  'x-reactions': Reaction[];
  
  // 校验
  'x-validator': Validator[];
  
  // 关系字段（StdForm 特有）
  'x-relation'?: {
    type: 'one-to-many' | 'many-to-many';
    target: string;
    foreignKey: string;
  };
}
```

### 6.3 关键差异

| 维度 | Formily | StdForm 需求 |
|------|---------|--------------|
| 定位 | 通用表单方案 | MES 业务表单 |
| 关系 | 无内置关系处理 | 需要 1对多、多对多 |
| 数据源 | dataSource 属性 | API + 数据加载器 |
| 国际化 | 无内置 | 需要深度集成 i18n |

---

## 七、优缺点分析

### 优点

1. **高性能**：Reactive 精确渲染，O(1) 复杂度
2. **声明式联动**：x-reactions 配置化联动逻辑
3. **协议驱动**：JSON Schema 标准化，支持后端驱动
4. **跨框架**：UI 无关核心，支持 React/Vue
5. **完整生态**：Ant Design、Element Plus 等组件库适配
6. **设计器**：designable 可视化表单设计器

### 局限

1. **学习曲线陡峭**：概念多，文档分散
2. **体积较大**：核心 + 组件库体积不小
3. **关系处理弱**：无内置 1对多、多对多支持
4. **调试困难**：响应式黑盒，需要 DevTools

---

## 八、后续研究建议

1. **源码分析**：深入研究 @formily/core 的 Field 模型实现
2. **设计器集成**：调研 designable 如何与 StdForm 集成
3. **关系扩展**：研究如何在 x-reactions 基础上扩展关系联动
4. **性能对比**：与当前 StdForm 实现做性能对比测试

---

## 九、参考链接

- 官网：https://formilyjs.org
- 核心库：https://core.formilyjs.org
- 响应式：https://reactive.formilyjs.org
- Vue 适配：https://vue.formilyjs.org
- Element Plus：https://element-plus.formilyjs.org
- 设计器：https://designable-antd.formilyjs.org
- GitHub：https://github.com/alibaba/formily