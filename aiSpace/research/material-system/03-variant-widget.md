# variant-form Widget 注册研究

> 研究时间：2026-03-26
> 来源：VForm 官网 + GitHub + SUMMARY.md

## 一、核心概念

VForm 3 采用 **Widget（小部件）** 模式：

```
┌─────────────────────────────────────────┐
│              Widget Schema               │
│                                         │
│  type: 'input'                          │
│  icon: 'text-field'                     │
│  options: {                             │
│    name: 'username',                    │
│    label: '用户名',                      │
│    placeholder: '请输入',                │
│    ...                                  │
│  }                                      │
└─────────────────────────────────────────┘
```

## 二、Widget Schema 结构

### 2.1 基本结构

```javascript
const widgetSchema = {
  type: 'input',        // 组件类型
  icon: 'text-field',   // 图标
  options: {            // 组件配置
    name: 'username',   // 字段名
    label: '用户名',     // 标签
    
    // 基础属性
    placeholder: '请输入',
    defaultValue: '',
    required: true,
    requiredHint: '用户名不能为空',
    disabled: false,
    hidden: false,
    readonly: false,
    
    // 校验
    validation: '',
    validationHint: '',
    
    // 事件
    onCreated: '',
    onMounted: '',
    onChange: '',
    onFocus: '',
    onBlur: '',
    
    // 扩展
    customClass: '',
    customAttr: ''
  }
}
```

### 2.2 内置 Widget 类型

**基础组件**：
| type | 说明 |
|------|------|
| input | 输入框 |
| textarea | 多行文本 |
| number | 数字输入 |
| radio | 单选 |
| checkbox | 多选 |
| select | 下拉选择 |
| cascader | 级联选择 |
| switch | 开关 |
| slider | 滑块 |
| rate | 评分 |

**时间组件**：
| type | 说明 |
|------|------|
| date | 日期选择 |
| time | 时间选择 |
| date-range | 日期范围 |

**上传组件**：
| type | 说明 |
|------|------|
| upload | 文件上传 |
| picture-upload | 图片上传 |
| file-upload | 文件上传 |

**高级组件**：
| type | 说明 |
|------|------|
| rich-editor | 富文本 |
| tree-select | 树选择 |
| color | 颜色选择 |
| link | 链接 |

**容器组件**：
| type | 说明 |
|------|------|
| grid | 栅格布局 |
| table | 表格布局 |
| tab | 选项卡 |
| sub-form | 子表单 |
| collapse | 折叠面板 |
| card | 卡片 |

## 三、自定义 Widget 开发

### 3.1 开发步骤

VForm 官网宣传"5分钟撸一个自定义组件"，基本步骤：

1. **创建组件文件**
```vue
<!-- MyWidget.vue -->
<template>
  <div class="my-widget">
    <el-input
      v-model="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @change="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  field: Object,
  designer: Object,
  parentWidget: Object,
  parentList: Array,
  indexOfParentList: Number
})

const emit = defineEmits(['update:modelValue'])

const modelValue = computed({
  get: () => props.field.options.defaultValue,
  set: (val) => emit('update:modelValue', val)
})

const placeholder = computed(() => props.field.options.placeholder)
const disabled = computed(() => props.field.options.disabled)

const handleChange = (val) => {
  // 触发事件
  if (props.field.options.onChange) {
    // 执行自定义事件脚本
    eval(props.field.options.onChange)
  }
}
</script>
```

2. **注册组件**
```javascript
import { useDesigner } from 'vform3-builds'
import MyWidget from './MyWidget.vue'

// 在设计器中注册
const designer = useDesigner()
designer.registerWidget('my-widget', MyWidget)
```

3. **添加到组件面板**
```javascript
designer.addWidgetToPanel({
  type: 'my-widget',
  icon: 'my-icon',
  label: '我的组件',
  options: {
    name: 'myField',
    label: '我的字段',
    placeholder: '请输入'
  }
})
```

### 3.2 组件接口规范

```typescript
interface WidgetProps {
  field: WidgetSchema        // 组件配置
  designer: Designer         // 设计器实例
  parentWidget: WidgetSchema // 父组件
  parentList: WidgetSchema[] // 兄弟组件列表
  indexOfParentList: number  // 当前索引
}

interface WidgetEmits {
  'update:modelValue': (value: any) => void
}
```

## 四、事件与联动

### 4.1 事件钩子

```javascript
options: {
  // 生命周期
  onCreated: 'console.log("组件创建")',
  onMounted: 'console.log("组件挂载")',
  
  // 交互事件
  onChange: 'console.log("值变化:", value)',
  onFocus: 'console.log("获得焦点")',
  onBlur: 'console.log("失去焦点")',
  onValidate: 'console.log("校验结果:", valid)'
}
```

### 4.2 动态选项

```javascript
options: {
  name: 'category',
  type: 'select',
  
  // 静态选项
  optionItems: [
    { label: '选项1', value: '1' },
    { label: '选项2', value: '2' }
  ],
  
  // 动态选项
  fieldListApi: {
    url: '/api/categories',
    method: 'GET',
    headers: { 'Authorization': 'Bearer xxx' },
    dataKey: 'data',
    labelKey: 'name',
    valueKey: 'id'
  }
}
```

## 五、与 Formily/VTJ.PRO 的对比

| 维度 | VForm 3 | Formily | VTJ.PRO |
|------|---------|---------|---------|
| 组件定义 | Widget Schema | connect + mapProps | MaterialDescription |
| 属性配置 | options 对象 | x-component-props | props 数组 |
| 设计器 | 内置完整 | 需要 designable | 内置完整 |
| 自定义组件 | registerWidget | connect | registerMaterial |
| 学习曲线 | 低 | 高 | 中 |

## 六、对原型的借鉴

### 6.1 可采用的设计

| VForm 3 设计 | 原型借鉴 |
|--------------|----------|
| Widget Schema 结构 | 字段 Schema 设计 |
| options 统一配置 | x-component-props 简化版 |
| 事件钩子 | 字段生命周期 |
| 动态选项 API | 数据源配置 |

### 6.2 原型适配方案

```typescript
// 简化版 Widget Schema

interface WidgetSchema {
  type: string              // 组件类型
  icon?: string             // 图标
  options: WidgetOptions    // 配置项
}

interface WidgetOptions {
  // 基础
  name: string              // 字段名
  label: string             // 标签
  placeholder?: string      // 占位符
  defaultValue?: any        // 默认值
  
  // 状态
  disabled?: boolean
  hidden?: boolean
  readonly?: boolean
  required?: boolean
  
  // 校验
  rules?: ValidationRule[]
  
  // 事件
  onChange?: string         // 事件表达式
  onFocus?: string
  onBlur?: string
  
  // 数据源
  dataSource?: {
    url: string
    method: string
    dataKey: string
    labelKey: string
    valueKey: string
  }
}

// 注册示例
const InputWidget: WidgetSchema = {
  type: 'input',
  icon: 'edit',
  options: {
    name: 'username',
    label: '用户名',
    placeholder: '请输入用户名',
    required: true
  }
}
```

## 七、优缺点分析

### 优点

1. **学习曲线低**：options 统一配置，概念简单
2. **设计器内置**：开箱即用，无需额外集成
3. **事件钩子丰富**：生命周期、交互事件完整
4. **三端布局**：PC/Pad/H5 自适应
5. **国际化内置**：多语言支持

### 局限

1. **类型定义弱**：JavaScript 为主，TypeScript 支持不完善
2. **关系处理弱**：无 1对多、多对多支持
3. **扩展性受限**：自定义组件需要遵循特定接口
4. **Pro 版收费**：高级功能需付费

## 八、参考链接

- 官网：https://www.vform666.com/
- GitHub：https://github.com/vform666/variant-form3-vite
- 在线演示：http://120.92.142.115:81/vform3/
- Pro 版：https://www.vform666.com/pro/