# StdForm 核心架构

> 基于 codeKit/components/StdForm 源码分析
> 分析时间：2026-03-24

---

## 一、架构概览

```
StdForm
├── index.vue          # 主组件入口
├── baseForm.vue       # 基础表单容器
├── toolbar.vue        # 工具栏
├── composeble/
│   └── useStdForm.ts  # 核心Hook
├── store/
│   ├── state.ts       # 状态定义
│   ├── actions.ts     # 状态操作
│   └── hooks.ts       # 钩子创建
├── register/
│   ├── initRegister.ts      # 初始化注册
│   ├── submitRegister.ts    # 提交注册
│   ├── deleteRegister.ts    # 删除注册
│   ├── changeStatusRegister.ts # 状态变更注册
│   ├── resetRegister.ts     # 重置注册
│   ├── printRegister.ts     # 打印注册
│   ├── initHandler.ts       # 初始化处理器
│   └── submitHandler.ts     # 提交处理器
├── utils/
│   ├── storage.ts     # 实例存储
│   ├── relation.ts    # 关系注册器
│   └── createExtendedEventHook.ts # 扩展事件钩子
└── types/
    ├── stdForm.ts     # 核心类型
    ├── store.ts       # 状态类型
    └── hooks.ts       # 钩子类型
```

---

## 二、核心概念

### 2.1 StdFormRelation（表单关系）

表单与数据库表的映射关系：

```typescript
interface StdFormRelation<T> {
  id: string                    // 关系ID，通常是表名@数据库
  parentId?: string             // 父关系ID（用于主从表）
  table: DataTable              // 表定义
  sqlQuery?: StdFormTableQuery  // 查询配置
  manager?: RefManager<T>       // 数据管理器
  relations?: TableRelation[]   // 子表关系
}

interface DataTable {
  tableName: string      // 表名@数据库
  columns: DataColumn[]  // 列定义
}

interface DataColumn {
  field: string
  type?: ColumnType      // NUMBER | DATE
  notNull?: boolean
  key?: KeyType          // PRIMARY | FOREIGN
  defaultValue?: any
  description?: string
}
```

### 2.2 RefManager（响应式数据管理器）

```typescript
// 对象类型管理器
interface RefManager<T> {
  type: 'object'
  value: T              // 当前值
  old: T | null         // 原始值（用于变更检测）
  rules: Rules | null   // 验证规则
  defaultValue: () => T
  init: (initValue?: T) => void
  update: (initValue: T) => void
  cover: (value: T) => void
  reset: () => void
  sync: () => void      // 同步old = value
  setRules: (rules: Rules) => void
  validate: ValidateFunc<T>
}

// 数组类型管理器
interface RefManagerArray<T> {
  type: 'array'
  records: T[]          // 表格数据（从ref获取）
  value: T[]            // 响应式数组
  old: T[] | null
  ref?: any             // 表格组件引用
  // ...其他方法同上
  setRef: <R>(tableRef: R) => void
  push: (value: T[], update?: boolean) => void
  unshift: (value: T[], update?: boolean) => void
}
```

### 2.3 OrderStatus（单据状态）

```typescript
enum OrderStatus {
  Idle = 'BL_IDLE',      // 空闲
  Draft = 'BL_D',        // 草稿
  Submitted = 'BL_S',    // 已提交
  Review = 'BL_R',       // 审核中
  Approved = 'BL_A',     // 已审核
  Finished = 'BL_F',     // 已完成
  Cancel = 'BL_C',       // 已取消
  Archived = 'BL_O',     // 已归档
  Sign = 'BL_E',         // 已签收
  Paid = 'BL_P'          // 已付款
}
```

### 2.4 StdFormAction（表单动作）

```typescript
enum StdFormAction {
  RADEONLY = 'Readonly',    // 只读
  ADD = 'Add',              // 新增
  EDIT = 'Edit',            // 编辑
  SAVING = 'Saving',        // 保存中
  DELETING = 'Deleting',    // 删除中
  RESETTING = 'Resetting',  // 重置中
  BEING_SUBMMITED = 'Being Submitted' // 提交中
}
```

---

## 三、生命周期钩子

### 3.1 初始化钩子
```typescript
beforeInit()    // 初始化前
init()          // 初始化（可拦截）
afterInit()     // 初始化后
initDone()      // 初始化完成
```

### 3.2 提交钩子
```typescript
beforeSubmit()       // 提交前
collectSubmitData()  // 收集提交数据
validateSubmission() // 验证提交
checkChanged()       // 检查变更
customValidate()     // 自定义验证
submit()             // 执行提交
preData()            // 数据预处理
postData()           // 数据后处理
afterSubmit()        // 提交后
```

### 3.3 删除钩子
```typescript
beforeDelete()
delete()
afterDelete()
```

### 3.4 状态变更钩子
```typescript
beforeChangeStatus()
changeStatus()
afterChangeStatus()
```

### 3.5 回滚钩子
```typescript
beforeRollback()
rollback()
afterRollback()
```

---

## 四、使用模式

### 4.1 标准表单开发流程

```vue
<template>
  <StdFormWrapper>
    <!-- 表单内容 -->
    <FieldItem :label="t('lbPLNNO', '编号')" :width="56">
      <el-input v-model="form.PLNNO" readonly/>
    </FieldItem>
  </StdFormWrapper>
</template>

<script setup lang="ts">
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { useRefManager } from '@/hooks/useRefManager'
import { useSetupStdFormMeta } from '@/hooks/useSetupStdFormMeta'
import { formRelation } from './relations/form'
import { formRules } from './validationRules'

// 定义组件标识
defineOptions({
  objectName: 'VUE_INQUIRY'
})

// 创建表单实例
const stdForm = useStdForm()
stdForm.toolbar.print = false  // 配置工具栏

// 设置元数据（权限等）
useSetupStdFormMeta(stdForm)

// 创建数据管理器
const [form, formManager] = useRefManager<InquiryOrderVO>(() => ({
  BLTY: 'IQYORD',
  STFG: 'BL_D'
}))
formManager.setRules(formRules)

// 配置关系
formRelation.manager = formManager
formRelation.sqlQuery = (params) => ({
  loader: inquiryOrderLoader,
  params: { ...params }
})

// 注册关系
stdForm.relationRegister.register(formRelation)

// 初始化完成回调
stdForm.onInitDone(async () => {
  // 初始化后的逻辑
})

// 提交前验证
stdForm.onBeforeSubmit(async () => {
  // 返回false可阻止提交
  return true
})
</script>
```

### 4.2 主从表模式

```typescript
// 主表关系
const formRelation: StdFormRelation<MainVO> = {
  id: 'MAIN_TABLE',
  table: { tableName: 'MAIN_TABLE', columns: [...] },
  relations: [
    { table: 'DETAIL_TABLE', primaryKey: 'DTLNO', foreignKey: ['MAINNO'] }
  ]
}

// 从表关系
const detailRelation: StdFormRelation<DetailVO> = {
  id: 'DETAIL_TABLE',
  parentId: 'MAIN_TABLE',  // 关联主表
  table: { tableName: 'DETAIL_TABLE', columns: [...] }
}

// 注册
stdForm.relationRegister.register(formRelation)
stdForm.relationRegister.register(detailRelation)
```

---

## 五、数据流

### 5.1 初始化流程
```
init(id) 
  → beforeInit 
  → editHandler/createHandler 
  → fetchAndLoad 
  → setupData 
  → afterInit 
  → initDone
```

### 5.2 提交流程
```
submit()
  → collectBackupDatas（备份）
  → beforeSubmit
  → collectSubmitData（收集数据）
  → validateSubmission（验证）
  → checkChanged（检查变更）
  → customValidate
  → submit（执行保存）
  → afterSubmit
  → init（重新加载）
```

### 5.3 数据保存机制
```typescript
// 使用 @nameson/sqlutils 进行数据差异比对
const dataModel = generateDataModel({
  tableName: relation.table.tableName,
  user: userInfo.p_user
})

// 设置主键值
dataModel.setPKvalues({ PLNSEQ: dataItem.PLNSEQ })

// 比对新旧数据
dataModel.setColdatas(newItem, oldItem)

// 生成SQL
if (dataModel.hasColdatas()) {
  postList.push(dataModel.build())
}

// 批量保存
await saveData(postList)
```

---

## 六、关键工具函数

### 6.1 createExtendedEventHook
创建可拦截的事件钩子：
```typescript
const hook = createExtendedEventHook(undefined, true, true)
hook.on((data) => {
  // 返回false可阻止后续执行
  return true
})
hook.trigger(data)
```

### 6.2 Storage（单例）
管理多个表单实例：
```typescript
const storage = Storage.getInstance()
const stdForm = storage.create(id, options)
const existingForm = storage.get(id)
storage.remove(id)
```

### 6.3 RelationRegister
管理表关系树：
```typescript
const register = new RelationRegister()
register.register(relation)
register.getPrimaryKey(relation)
register.getDefaultValue(relation)
register.getParentRelation(relation)
```

---

## 七、最佳实践

1. **关系配置分离**：将 `relations/form.ts` 独立存放
2. **验证规则分离**：将 `validationRules.ts` 独立存放
3. **类型定义分离**：将 `types.ts` 独立存放
4. **使用 defineOptions 标识组件**：便于权限控制
5. **使用 useSetupStdFormMeta 自动加载权限**
6. **使用 useNsI18n 处理国际化**