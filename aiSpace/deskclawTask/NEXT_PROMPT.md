# Vue 低代码设计器课题 - 第二阶段研究 Prompt

## 背景

已完成 6 个低代码项目的调研，研究成果位于 `D:\demo\ai\aiSpace\research\`：
- VTJ.PRO (AI 驱动 Vue3 低代码)
- Formily (阿里表单方案，JSON Schema + x-reactions)
- form-generator (Vue2 代码生成器)
- vue-json-schema-form (标准 JSON Schema 多 UI 库)
- variant-form3-vite (Vue3 表单设计器)
- visual-drag-demo (拖拽教学项目)

## 当前任务

基于调研成果，设计一套 **Vue 3 低代码设计器方案**，要求：

### 核心能力
1. **双布局模式**
   - Flex/Grid 流式布局（表单场景）
   - 绝对定位自由布局（类似 WinForm，大屏/报表场景）
   - 可切换，可混合

2. **设计器架构**
   - 设计器 (Designer) + 渲染器 (Renderer) 分离
   - DSL Schema 作为中间层
   - 支持 DSL ↔ Vue SFC 双向转换

3. **组件体系**
   - 基础组件：文本、图片、按钮、输入框、选择器等
   - 容器组件：Grid、Flex、Tabs、Collapse、Card
   - 表单组件：参考 Formily 的 Field 模型
   - 业务组件：可扩展机制

4. **联动系统**
   - 参考 Formily 的 x-reactions 声明式联动
   - 支持字段间联动、显隐联动、值联动
   - 支持 1对多、多对多关系字段

5. **国际化集成**
   - Schema 中支持 i18n key
   - 运行时动态切换语言（不刷新页面）
   - 与项目现有 useNsI18n 集成

### 输出要求

1. **架构设计文档** (`D:\demo\ai\aiSpace\design\ARCHITECTURE.md`)
   - 整体架构图
   - 核心模块划分
   - 数据流设计
   - 扩展机制

2. **DSL Schema 规范** (`D:\demo\ai\aiSpace\design\DSL_SCHEMA.md`)
   - 组件 Schema 结构
   - 布局 Schema 结构
   - 联动 Schema 结构
   - 示例 JSON

3. **技术选型建议** (`D:\demo\ai\aiSpace\design\TECH_STACK.md`)
   - 核心依赖
   - 与现有 StdForm 的关系
   - 迁移/集成方案

4. **原型代码** (`D:\demo\ai\aiSpace\prototype\`)
   - 核心 DSL 类型定义
   - 简单渲染器示例
   - 简单设计器示例

### 约束条件

1. 兼容现有 StdForm 架构
2. 支持 Vue 3 + TypeScript + Element Plus
3. 设计器可独立运行，也可嵌入现有系统
4. 渲染器无设计器依赖，可独立使用

### 参考资源

- 研究成果：`D:\demo\ai\aiSpace\research\*\SUMMARY.md`
- 现有项目：`D:\demo\ai\template\`
- MEMORY.md 中的技术栈信息

---

## 执行步骤建议

1. 先阅读所有研究成果 SUMMARY.md
2. 对比分析各方案优劣
3. 设计融合各方案优点的架构
4. 输出设计文档
5. 编写原型代码验证

请开始第二阶段研究。