# Skill 开发建议

> 基于项目代码分析，为提升开发效率而设计
> 分析时间：2026-03-24

---

## 一、建议创建的 Skills

### 1.1 std-form-generator（表单生成器）

**用途**: 根据数据库表结构自动生成标准表单代码

**输入**:
- 表名
- 字段列表
- 业务模块名

**输出**:
- `form/index.vue` - 表单组件
- `form/types.ts` - 类型定义
- `form/validationRules.ts` - 验证规则
- `form/relations/form.ts` - 关系配置
- `list.vue` - 列表页
- `router/index.js` - 路由配置

**示例调用**:
```
根据表 ORDPLN@APSDB169_ERPDB 生成询单管理模块：
- 模块名：inquiryOrder
- 国际化标识：VUE_INQUIRY
- 主键：PLNSEQ
- 必填字段：PLNNO, CLNT, CORPNO
```

---

### 1.2 api-module-generator（API模块生成器）

**用途**: 根据SQL配置生成API接口代码

**输入**:
- 命名空间标识
- 接口名称列表
- 返回类型定义

**输出**:
- API服务文件
- 类型定义

**示例调用**:
```
为 VUE_JJZ_JDZY 生成API模块：
- 快车-明细列表查询 → fetchKuaiCheItemList
- 快车-数据概览查询 → fetchSummaryData
```

---

### 1.3 table-component-generator（表格组件生成器）

**用途**: 根据字段配置生成表格组件

**输入**:
- 字段列表
- 列配置（宽度、对齐、格式化）
- 是否可编辑

**输出**:
- 表格组件代码
- 列配置

**示例调用**:
```
生成询单列表表格：
字段：PLNNO, CLNT, V_CLNTNAME, QTY, BEGFR, ENDTO
PLNNO 需要点击跳转
QTY 右对齐，需要汇总
BEGFR, ENDTO 日期格式化
```

---

## 二、Skill 模板设计

### 2.1 std-form-generator SKILL.md 模板

```markdown
# StdForm Generator

根据数据库表结构生成标准表单代码。

## 输入参数

- tableName: 数据库表名（如 ORDPLN@APSDB169_ERPDB）
- moduleName: 模块名（如 inquiryOrder）
- i18nKey: 国际化标识（如 VUE_INQUIRY）
- fields: 字段配置列表

## 生成文件

### 1. types.ts

\`\`\`typescript
export type {ModuleName}VO = {
  {根据fields生成字段定义}
}
\`\`\`

### 2. validationRules.ts

\`\`\`typescript
import type { Rules } from 'async-validator'

export const formRules: Rules = {
  {根据required字段生成规则}
}
\`\`\`

### 3. relations/form.ts

\`\`\`typescript
import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const formRelation: StdFormRelation<any> = {
  id: '{tableName}',
  table: {
    tableName: '{tableName}',
    columns: [
      {根据fields生成列配置}
    ]
  }
}
\`\`\`

### 4. form/index.vue

\`\`\`vue
{根据fields生成表单模板}
\`\`\`

## 使用示例

输入：
- tableName: ORDPLN@APSDB169_ERPDB
- moduleName: inquiryOrder
- i18nKey: VUE_INQUIRY
- fields:
  - PLNSEQ (PRIMARY, NUMBER)
  - PLNNO (required)
  - CLNT (required)
  - BEGFR (DATE)
  - QTY (NUMBER)

输出：完整的表单模块代码
```

---

### 2.2 api-module-generator SKILL.md 模板

```markdown
# API Module Generator

根据接口配置生成API服务代码。

## 输入参数

- namespace: 命名空间标识
- endpoints: 接口配置列表

## 生成代码

\`\`\`typescript
import { fetchDataItem, fetchDataList, useNsSearchData } from '@/api/nameson/utils'

const request = useNsSearchData('{namespace}')

{根据endpoints生成函数}
\`\`\`

## 接口配置格式

| 名称 | 类型 | 说明 |
|------|------|------|
| name | string | 接口名称 |
| functionName | string | 生成的函数名 |
| returnType | string | 返回类型 |
| isList | boolean | 是否列表 |
| hasOptions | boolean | 是否有选项参数 |

## 使用示例

输入：
- namespace: VUE_JJZ_JDZY
- endpoints:
  - name: 快车-明细列表查询
    functionName: fetchKuaiCheItemList
    returnType: KuaiCheItemVO[]
    isList: true
  - name: 快车-数据概览查询
    functionName: fetchSummaryData
    returnType: KuaiCheSummaryVO
    isList: false
    hasOptions: true
```

---

## 三、辅助工具 Skill

### 3.1 i18n-helper（国际化助手）

**用途**: 
- 提取代码中的中文文本
- 生成国际化key
- 批量替换为t()函数

**示例调用**:
```
提取 src/views/inquiryOrder 中的中文文本，生成国际化配置
```

---

### 3.2 type-extractor（类型提取器）

**用途**: 
- 从API响应提取TypeScript类型
- 自动生成VO类型定义

**示例调用**:
```
根据 fetchInquiryOrder 接口响应生成 InquiryOrderVO 类型
```

---

### 3.3 code-reviewer（代码审查器）

**用途**: 
- 检查代码是否符合项目规范
- 提供优化建议

**检查项**:
- 命名规范
- 导入顺序
- 错误处理
- 类型安全
- 注释完整性

**示例调用**:
```
审查 src/views/inquiryOrder/form/index.vue 的代码质量
```

---

## 四、实施建议

### 4.1 优先级

1. **高优先级**: std-form-generator
   - 使用频率最高
   - 代码量最大
   - 提效最明显

2. **中优先级**: api-module-generator, table-component-generator
   - 使用频率中等
   - 可与表单生成器配合

3. **低优先级**: i18n-helper, type-extractor, code-reviewer
   - 辅助工具
   - 可逐步完善

### 4.2 技术方案

1. **模板引擎**: 使用字符串模板或Handlebars
2. **输入方式**: 自然语言描述 + 结构化参数
3. **输出方式**: 直接写入文件或返回代码片段

### 4.3 后续扩展

- 支持从数据库元数据自动获取字段信息
- 支持主从表联动生成
- 支持自定义模板覆盖
- 集成到IDE插件