# 低代码方案对比分析

> 创建时间：2026-03-26
> 目的：为 StdForm 低代码设计器提供选型依据

## 一、方案概览

| 项目 | Stars | 定位 | Vue版本 | 核心特点 |
|------|-------|------|---------|----------|
| VTJ.PRO | - | AI驱动低代码 | Vue 3 | DSL ↔ SFC 双向转换 |
| Formily | 12.7k | 表单运行时 | React/Vue | JSON Schema + x-reactions |
| form-generator | 9.3k | 代码生成器 | Vue 2 | 可视化设计 → 生成代码 |
| vue-json-schema-form | 2.3k | Schema表单 | Vue 2/3 | 标准JSON Schema，多UI库 |
| variant-form3-vite | 1.6k | 表单设计器 | Vue 3 | 设计器+渲染器分离 |
| visual-drag-demo | 5.6k | 教学项目 | Vue 3 | 拖拽原理演示 |

## 二、架构对比

### 2.1 设计器模式

| 项目 | 设计器 | 渲染器 | 双向转换 |
|------|--------|--------|----------|
| VTJ.PRO | ✅ 内置 | ✅ 内置 | ✅ DSL ↔ SFC |
| Formily | ❌ 需 designable | ✅ 核心 | ❌ 单向 |
| form-generator | ✅ 内置 | ✅ 解析器 | ❌ 单向生成 |
| vue-json-schema-form | ❌ 无 | ✅ 核心 | ❌ 单向 |
| variant-form3-vite | ✅ 内置 | ✅ 内置 | ❌ 单向 |
| visual-drag-demo | ✅ 教学 | ✅ 教学 | ❌ 单向 |

**结论**：VTJ.PRO 的双向转换最具参考价值，variant-form3-vite 的设计器+渲染器分离最成熟。

### 2.2 Schema 设计

| 项目 | Schema 基础 | 扩展方式 | 复杂度 |
|------|-------------|----------|--------|
| VTJ.PRO | 自定义 DSL | BlockSchema + NodeSchema | 高 |
| Formily | JSON Schema | x-* 扩展属性 | 高 |
| form-generator | 自定义 | __config__ + __vModel__ | 低 |
| vue-json-schema-form | 标准 JSON Schema | ui-schema 分离 | 中 |
| variant-form3-vite | 自定义 | widgetList + formConfig | 中 |
| visual-drag-demo | 自定义 | componentData | 低 |

**结论**：
- 标准 JSON Schema 优势：后端友好、校验内置、学习成本低
- 自定义 Schema 优势：灵活性高、可针对业务优化
- **推荐**：以 JSON Schema 为基础，扩展 x-* 属性（借鉴 Formily）

### 2.3 联动能力

| 项目 | 联动方式 | 声明式 | 复杂联动 |
|------|----------|--------|----------|
| VTJ.PRO | 事件驱动 | ❌ | 中 |
| Formily | x-reactions | ✅ | 高 |
| form-generator | 简单配置 | ✅ | 低 |
| vue-json-schema-form | 无内置 | - | 无 |
| variant-form3-vite | 事件钩子 | ❌ | 中 |
| visual-drag-demo | 事件绑定 | ❌ | 低 |

**结论**：Formily 的 x-reactions 声明式联动最强大，应重点借鉴。

### 2.4 布局能力

| 项目 | 布局方式 | 响应式 | 自由布局 |
|------|----------|--------|----------|
| VTJ.PRO | Flex/Grid | ✅ | ❌ |
| Formily | Grid | ✅ | ❌ |
| form-generator | 24栅格 | ✅ | ❌ |
| vue-json-schema-form | 无内置 | ❌ | ❌ |
| variant-form3-vite | PC/Pad/H5 | ✅ | ❌ |
| visual-drag-demo | 绝对定位 | ❌ | ✅ |

**结论**：
- 表单场景：Flex/Grid 流式布局
- 大屏/报表场景：绝对定位自由布局
- **需要支持双布局模式**

## 三、核心能力提取

### 3.1 必须借鉴的能力

| 能力 | 来源 | 实现要点 |
|------|------|----------|
| DSL ↔ SFC 双向转换 | VTJ.PRO | parser + coder 模块 |
| 声明式联动 | Formily | x-reactions 语法 |
| 设计器+渲染器分离 | variant-form3-vite | 独立 npm 包 |
| 标准 JSON Schema | vue-json-schema-form | ajv 校验 |
| 代码生成 | form-generator | 生成纯净 Vue 代码 |

### 3.2 可选借鉴的能力

| 能力 | 来源 | 备注 |
|------|------|------|
| AI 辅助 | VTJ.PRO | 可后期扩展 |
| 拖拽吸附 | visual-drag-demo | 自由布局时需要 |
| 撤销/重做 | visual-drag-demo | 快照栈模式 |
| 三端布局 | variant-form3-vite | PC/Pad/H5 |

## 四、StdForm 需求匹配

### 4.1 现有 StdForm 能力

```
StdForm 核心架构：
├── useStdForm() - 表单状态管理
├── RelationRegister - 关系注册（1对多、多对多）
├── RefManager - 单对象状态
├── useArrayRefManager - 数组状态
├── useParamsRefManager - 查询参数
└── 生命周期 Hooks - Init/Submit/Delete/ChangeStatus
```

### 4.2 低代码设计器需要解决的问题

| 问题 | 现状 | 低代码方案 |
|------|------|-----------|
| 表单配置 | 代码编写 | 可视化设计 |
| 字段联动 | 手动实现 | x-reactions 声明式 |
| 布局调整 | 修改代码 | 拖拽调整 |
| 国际化 | t('key', '默认值') | Schema 中配置 i18n key |
| 关系字段 | RelationRegister | Schema 扩展 relation 字段 |

### 4.3 兼容性要求

1. **渲染器独立**：可脱离设计器使用
2. **渐进增强**：现有 StdForm 代码可逐步迁移
3. **类型安全**：TypeScript 完整支持
4. **国际化集成**：与 useNsI18n 无缝对接

## 五、技术选型建议

### 5.1 核心依赖

| 依赖 | 用途 | 版本 |
|------|------|------|
| Vue | 框架 | 3.x |
| TypeScript | 类型 | 5.x |
| Element Plus | UI 组件 | 2.x |
| ajv | JSON Schema 校验 | 8.x |
| @vueuse/core | 工具函数 | 最新 |

### 5.2 可选依赖

| 依赖 | 用途 | 备注 |
|------|------|------|
| @formily/reactive | 响应式核心 | 借鉴 Formily |
| vuedraggable | 拖拽 | 设计器使用 |
| monaco-editor | 代码编辑 | 设计器使用 |

### 5.3 包结构建议

```
@company/lowcode-core      # 核心：Schema、校验、联动
@company/lowcode-renderer  # 渲染器：独立运行
@company/lowcode-designer  # 设计器：依赖渲染器
@company/lowcode-form      # 表单扩展：关联 StdForm
```

## 六、下一步行动

1. ✅ 对比分析完成
2. ⏳ 架构设计文档
3. ⏳ DSL Schema 规范
4. ⏳ 技术选型建议
5. ⏳ 原型代码