# API封装模式

> 基于 template/api 和 template/views/*/api 源码分析
> 分析时间：2026-03-24

---

## 一、API层架构

```
api/
├── utils.ts                    # 公共工具函数
└── services/                   # 业务服务
    └── demo/
        └── demo1.ts            # 按业务模块划分

views/
└── listV2/
    └── api/
        └── index.ts            # 页面级API
```

---

## 二、核心封装函数

### 2.1 fetchDataList / fetchDataItem

统一的API请求包装器：

```typescript
// utils.ts
export async function fetchDataList<T>(
  promiseResponse: ReturnType<SearchDataHandler>,
  option?: FetchWrapperOptions
): Promise<T>

export async function fetchDataItem<T>(
  promiseResponse: ReturnType<SearchDataHandler>,
  option?: FetchWrapperOptions
): Promise<T>
```

**选项配置:**
```typescript
type FetchWrapperOptions = {
  slient?: boolean           // 静默模式，不显示错误提示
  defaultValue?: any         // 错误时返回的默认值
  errorPrefix?: string       // 错误前缀
  messageMode?: 'message' | 'messagebox'  // 提示方式
}
```

**返回值规则:**
- `fetchDataList`: 无论如何都返回数组
- `fetchDataItem`: 无论如何都返回对象

---

### 2.2 useNsSearchData

创建命名空间请求实例：

```typescript
const request = useNsSearchData('VUE_JJZ_JDZY')

// 使用
const result = request<KuaiCheItemVO[], P>("快车-明细列表查询", params)
```

---

## 三、API定义模式

### 3.1 标准模式

```typescript
// api/services/demo/demo1.ts
import { fetchDataItem, fetchDataList, useNsSearchData } from "@/api/nameson/services/utils"

const request = useNsSearchData("VUE_JJZ_JDZY")

// 1. 定义类型
export type KuaiCheItemVO = {
  USERNO: string
  DT: string
  MATID: string
}

// 2. 定义列表查询函数
export function fetchKuaiCheItemList<P extends SearchParamsUnion>(
  params: P
) {
  return request<KuaiCheItemVO[], P>("快车-明细列表查询", params)
}

// 3. 定义单项查询函数（带选项）
export function fetchSummaryData(
  params: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataItem<KuaiCheSummaryVO>(
    request("快车-数据概览查询", params),
    options
  )
}
```

### 3.2 页面级API模式

```typescript
// views/listV2/api/index.ts
import { fetchDataItem, fetchDataList, useNsSearchData } from '@/api/nameson/utils'

const request = useNsSearchData('VUE_MES_POFTY')

// 下拉选项
export async function fetchFactoryOptions(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataList<FactoryOption[]>(
    request('承制工厂的下拉取值', params),
    options
  )
}

// 列表查询
export async function fetchHzTaskList(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataList<HzTaskVO[]>(
    request('任务清单的查询', params),
    options
  )
}
```

---

## 四、使用模式

### 4.1 基本使用

```typescript
// 列表查询
const list = await fetchInquiryOrderList({
  where: {
    'A.PLNNO__like': query.PLNNO,
    'A.CLNT': query.CLNT
  }
})

// 单项查询（静默模式）
const item = await fetchWorkLineItem({
  where: { CODE: EQMMODEL }
}, { slient: true })

// 带错误前缀
const data = await fetchData({
  where: params
}, { errorPrefix: '获取数据失败：' })
```

### 4.2 分页查询

```typescript
const res = await fetchQuanZhanItemList({
  ...params,
  pageNo: pagination.page,
  pageSize: pagination.pageSize
})

pagination.total = Number(res.totalsize || 0)
dataListManager.update(res.data)
```

### 4.3 条件查询参数

```typescript
// 模糊查询
'A.PLNNO__like': params.PLNNO

// 日期范围
'A.DT__gte@date': query.dateRange[0]
'A.DT__lte@date': query.dateRange[1]

// IN查询
'TMPLNO__in': anchorIdList

// 函数查询
"TO_CHAR(A.BEGFR,'YYYYMM')": params.BEGFR
```

---

## 五、CRUD操作

### 5.1 保存数据

```typescript
import { ColdataModel, generateDataModel, diffItem } from '@nameson/sqlutils'
import { saveData } from '@/api/nameson'

export async function confirmTask({
  data,
  oldData
}: {
  data: Partial<PostProcessingVO>[]
  oldData: Partial<PostProcessingVO>[]
}) {
  const postList: ColdataModel[] = []
  
  const dataModel = generateDataModel({
    tableName: 'PSTASK',
    user: useUserStore().userInfo?.username
  })
  
  dataModel.setExclude(['FTYNAME'])  // 排除字段
  
  const diffList = diffItem(data, oldData, (a, b) => 
    a.PSSEQ === b.PSSEQ && a.TSKSEQ === b.TSKSEQ
  )
  
  for (const items of diffList) {
    const [newItem, oldItem] = items
    const dataItem = newItem || oldItem
    
    dataModel.setPKvalues({
      PSSEQ: dataItem!.PSSEQ,
      TSKSEQ: dataItem!.TSKSEQ
    })
    dataModel.setColdatas(newItem, oldItem)
    dataModel.hasColdatas() && postList.push(dataModel.build())
  }
  
  if (postList.length > 0) {
    return await saveData(postList)
  }
  
  return { statusCode: '0', message: '没有数据变更' }
}
```

### 5.2 获取主键

```typescript
import { fetchPrimaryKey } from '@/api/nameson'

const primaryKeyList = await fetchPrimaryKey('ORDPLN@APSDB169_ERPDB')
const primaryKeyValue = primaryKeyList[0]
```

---

## 六、最佳实践

### 6.1 类型定义规范

```typescript
// 使用VO后缀
export type InquiryOrderVO = {
  PLNSEQ: number
  PLNNO: string
  // ...
}

// 添加注释
export type HzTaskVO = {
  PSTY: string      // 排产类型
  YRWEEK: string    // 排产年月
  ORDSEQ: number    // 批号ORDSEQ
}
```

### 6.2 函数命名规范

| 前缀 | 用途 |
|------|------|
| fetch | 获取数据 |
| get | 获取选项/简单数据 |
| save | 保存数据 |
| delete | 删除数据 |

### 6.3 错误处理

```typescript
// 推荐：使用统一封装
const data = await fetchData(params, { errorPrefix: '查询失败：' })

// 不推荐：手动try-catch
try {
  const data = await fetchData(params)
} catch (e) {
  ElMessage.error(e.message)
}
```

### 6.4 静默查询

```typescript
// 不需要错误提示的场景
const item = await fetchItem(params, { slient: true })
if (!item) {
  // 处理空数据
}
```