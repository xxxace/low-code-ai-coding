# variant-form3-vite 研究总结

> 研究时间：2026-03-25
> GitHub：https://github.com/vform666/variant-form3-vite
> Stars：1.6k
> 当前版本：v3.0.10
> 技术栈：Vue 3 + Element Plus + Vite

## 一、项目定位

**VForm 3** 是一款高效的 Vue 3 低代码表单，核心理念是 **"可视化设计，一键生成源码"**。

### 特点

| 特性 | VForm 3 | form-generator |
|------|---------|----------------|
| Vue 版本 | Vue 3 | Vue 2 |
| UI 库 | Element Plus | Element UI |
| 设计器 | 内置 | 内置 |
| 国际化 | 支持 | 不支持 |
| Pro 版本 | 有 | 无 |

---

## 二、核心功能

```
> 拖拽式可视化表单设计；
> 支持PC、Pad、H5三种布局；
> 支持运行时动态加载表单；
> 支持表单复杂交互控制；
> 支持自定义CSS样式；
> 支持自定义校验逻辑；
> 支持国际化多语言；
> 可导出Vue组件、HTML源码；
> 可导出Vue的SFC单文件组件；
> 支持开发自定义组件；
> 支持响应式自适应布局；
> 支持VS Code插件；
```

---

## 三、核心架构

### 3.1 组件结构

```
VForm 3
├── v-form-designer  (表单设计器)
│   ├── 左侧组件面板
│   ├── 中间设计画布
│   └── 右侧属性面板
└── v-form-render    (表单渲染器)
    └── 动态渲染表单
```

### 3.2 使用方式

**设计器：**
```vue
<template>
  <v-form-designer ref="vfdRef" />
</template>
```

**渲染器：**
```vue
<template>
  <v-form-render 
    :form-json="formJson" 
    :form-data="formData" 
    :option-data="optionData" 
    ref="vFormRef"
  />
</template>

<script setup>
import { ref, reactive } from 'vue'

const formJson = reactive({
  widgetList: [],
  formConfig: {
    modelName: 'formData',
    refName: 'vForm',
    rulesName: 'rules',
    labelWidth: 80,
    labelPosition: 'left',
    layoutType: 'PC',
    jsonVersion: 3
  }
})

const formData = reactive({})
const vFormRef = ref(null)

const submitForm = () => {
  vFormRef.value.getFormData().then(data => {
    console.log(data)
  })
}
</script>
```

---

## 四、JSON Schema 设计

### 4.1 表单配置结构

```javascript
const formJson = {
  widgetList: [
    {
      type: 'input',
      icon: 'text-field',
      options: {
        name: 'username',
        label: '用户名',
        placeholder: '请输入',
        required: true,
        requiredHint: '用户名不能为空',
        // ...更多属性
      }
    }
  ],
  formConfig: {
    modelName: 'formData',
    refName: 'vForm',
    rulesName: 'rules',
    labelWidth: 80,
    labelPosition: 'left',
    size: '',
    labelAlign: 'label-left-align',
    cssCode: '',
    customClass: '',
    functions: '',
    layoutType: 'PC',      // PC | Pad | H5
    jsonVersion: 3,
    onFormCreated: '',
    onFormMounted: '',
    onFormDataChange: ''
  }
}
```

### 4.2 组件类型

| 类型 | 说明 |
|------|------|
| input | 输入框 |
| textarea | 多行文本 |
| number | 数字输入 |
| radio | 单选 |
| checkbox | 多选 |
| select | 下拉选择 |
| cascader | 级联选择 |
| date | 日期选择 |
| time | 时间选择 |
| switch | 开关 |
| slider | 滑块 |
| rate | 评分 |
| upload | 文件上传 |
| rich-editor | 富文本 |
| picture-upload | 图片上传 |
| file-upload | 文件上传 |
| tree-select | 树选择 |

### 4.3 容器组件

| 类型 | 说明 |
|------|------|
| grid | 栅格布局 |
| table | 表格布局 |
| tab | 选项卡 |
| sub-form | 子表单 |
| collapse | 折叠面板 |
| card | 卡片 |

---

## 五、事件与联动

### 5.1 事件钩子

```javascript
formConfig: {
  onFormCreated: 'console.log("表单创建完成")',
  onFormMounted: 'console.log("表单挂载完成")',
  onFormDataChange: 'console.log("数据变化:", value)'
}
```

### 5.2 动态选项

```javascript
options: {
  name: 'category',
  label: '分类',
  type: 'select',
  fieldListApi: {
    url: '/api/categories',
    method: 'GET',
    dataKey: 'data'
  }
}
```

---

## 六、国际化支持

VForm 3 内置国际化支持：

```javascript
import VForm3 from 'vform3-builds'
import 'vform3-builds/dist/designer.style.css'

app.use(VForm3, {
  i18n: {
    locale: 'zh-CN',
    messages: {
      'zh-CN': { /* 中文 */ },
      'en-US': { /* 英文 */ }
    }
  }
})
```

---

## 七、对 StdForm 的借鉴意义

### 7.1 可借鉴点

| VForm 3 设计 | StdForm 可借鉴 |
|--------------|----------------|
| 设计器 + 渲染器分离 | 分离设计与运行时 |
| 三端布局（PC/Pad/H5） | 响应式布局方案 |
| 国际化内置 | 集成项目 i18n |
| 事件钩子 | 生命周期钩子 |
| 动态选项 API | 字段数据源配置 |

### 7.2 JSON Schema 参考

```typescript
// StdForm 可采用的类似结构
interface StdFormJson {
  widgetList: WidgetConfig[];
  formConfig: {
    modelName: string;
    labelWidth: number;
    labelPosition: 'left' | 'right' | 'top';
    layoutType: 'PC' | 'Pad' | 'H5';
    rulesName: string;
    customClass: string;
    cssCode: string;
    // 生命周期钩子
    onFormCreated?: string;
    onFormMounted?: string;
    onFormDataChange?: string;
  };
}

interface WidgetConfig {
  type: string;
  icon: string;
  options: {
    name: string;
    label: string;
    required?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    placeholder?: string;
    defaultValue?: any;
    // 数据源
    fieldListApi?: {
      url: string;
      method: string;
      headers?: Record<string, string>;
    };
    // 事件
    onCreated?: string;
    onMounted?: string;
    onChange?: string;
  };
}
```

### 7.3 关键差异

| 维度 | VForm 3 | StdForm 需求 |
|------|---------|--------------|
| 关系 | 无内置 | 需要 1对多、多对多 |
| 数据源 | 简单 API | 复杂数据加载 |
| 校验 | 基础校验 | 业务校验规则 |
| 状态管理 | 内置 | 需与 Pinia 集成 |

---

## 八、优缺点分析

### 优点

1. **Vue 3 原生支持**：基于 Vue 3 + Element Plus
2. **可视化设计**：拖拽式设计器
3. **三端布局**：PC、Pad、H5 适配
4. **国际化**：内置多语言支持
5. **代码生成**：导出 Vue SFC 源码
6. **Pro 版本**：商业支持

### 局限

1. **关系处理弱**：无 1对多、多对多支持
2. **学习成本**：配置项较多
3. **社区规模**：相对小众
4. **Pro 版收费**：高级功能需付费

---

## 九、后续研究建议

1. **自定义组件开发**：研究如何扩展自定义组件
2. **联动机制**：分析复杂联动实现方式
3. **与 StdForm 集成**：评估集成可行性
4. **Pro 版功能**：调研 Pro 版高级特性

---

## 十、参考链接

- 官网：https://www.vform666.com/
- GitHub：https://github.com/vform666/variant-form3-vite
- Gitee：https://gitee.com/vdpadmin/variant-form3-vite
- 在线演示：http://120.92.142.115:81/vform3/
- Pro 版：https://www.vform666.com/pro/
- 视频教程：https://space.bilibili.com/626932375