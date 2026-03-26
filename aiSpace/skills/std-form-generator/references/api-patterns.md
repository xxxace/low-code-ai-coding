# API Patterns

Patterns for generating API service modules.

## API Module Structure

```
views/{moduleName}/
└── api/
    └── index.ts
```

## Basic API Module Template

```typescript
import { fetchDataItem, fetchDataList, useNsSearchData } from '@/api/nameson/utils'

const request = useNsSearchData('{I18N_KEY}')

// ==================== Types ====================
export type {ModuleName}VO = {
  {PK}: number
  {STRING_FIELDS}: string
  {NUMBER_FIELDS}: number
  {DATE_FIELDS}: string
  V_{FK}NAME: string
}

export type {Detail}VO = {
  {PK}: number
  {FK}: number
  {FIELDS}: any
}

// ==================== List Query ====================
export async function fetch{ModuleName}List(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataList<{ModuleName}VO[]>(
    request('{模块}列表查询', params),
    options
  )
}

// ==================== Item Query ====================
export async function fetch{ModuleName}Item(
  params: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataItem<{ModuleName}VO>(
    request('{模块}明细查询', params),
    options
  )
}

// ==================== Options Query ====================
export async function fetch{Fk}Options(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataList<{Fk}Option[]>(
    request('{外键}下拉查询', params),
    options
  )
}

// ==================== Detail Query ====================
export async function fetch{Detail}List(
  params: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataList<{Detail}VO[]>(
    request('{明细}列表查询', params),
    options
  )
}
```

## Query Parameter Patterns

### Basic Where Clause
```typescript
const params = {
  where: {
    'A.{FIELD}': value,           // 等于
    'A.{FIELD}__like': value,     // 模糊查询
    'A.{FIELD}__in': [v1, v2],    // IN查询
    'A.{FIELD}__gte': value,      // 大于等于
    'A.{FIELD}__lte': value,      // 小于等于
    'A.{FIELD}__gte@date': date,  // 日期大于等于
    'A.{FIELD}__lte@date': date   // 日期小于等于
  }
}
```

### Pagination
```typescript
const params = {
  where: { ... },
  pageNo: 1,
  pageSize: 20
}

const result = await fetchList(params)
pagination.total = Number(result.totalsize || 0)
```

### Sorting
```typescript
const params = {
  where: { ... },
  orderby: 'A.{FIELD} DESC'
}
```

## CRUD Operations

### Save Data Pattern

```typescript
import { ColdataModel, generateDataModel, diffItem } from '@nameson/sqlutils'
import { saveData } from '@/api/nameson'
import { useUserStore } from '@/stores/modules/user'

export async function save{ModuleName}({
  data,
  oldData
}: {
  data: Partial<{ModuleName}VO>
  oldData: Partial<{ModuleName}VO>
}) {
  const userStore = useUserStore()
  const postList: ColdataModel[] = []
  
  const dataModel = generateDataModel({
    tableName: '{TABLE_NAME}',
    user: (userStore.userInfo as any).p_user
  })
  
  // Set column types
  dataModel.setKeyTypeMap({
    NUMBER: ['{NUM_FIELDS}'],
    DATE: ['{DATE_FIELDS}']
  })
  
  // Exclude display fields
  dataModel.setExclude(['V_{FK}NAME'])
  
  // Set primary key
  dataModel.setPKvalues({
    {PK}: data.{PK}
  })
  
  // Compare and build
  dataModel.setColdatas(data, oldData)
  
  if (dataModel.hasColdatas()) {
    postList.push(dataModel.build())
  }
  
  if (postList.length > 0) {
    return await saveData(postList)
  }
  
  return { statusCode: '0', message: '没有数据变更' }
}
```

### Save Detail List Pattern

```typescript
export async function save{Detail}List({
  data,
  oldData
}: {
  data: Partial<{Detail}VO>[]
  oldData: Partial<{Detail}VO>[]
}) {
  const userStore = useUserStore()
  const postList: ColdataModel[] = []
  
  const dataModel = generateDataModel({
    tableName: '{DETAIL_TABLE}',
    user: (userStore.userInfo as any).p_user
  })
  
  dataModel.setKeyTypeMap({
    NUMBER: ['{PK}', '{FK}', '{NUM_FIELDS}'],
    DATE: ['{DATE_FIELDS}']
  })
  
  // Diff items by primary key
  const diffList = diffItem(data, oldData, (a, b) => 
    a.{PK} === b.{PK} && a.{FK} === b.{FK}
  )
  
  for (const items of diffList) {
    const [newItem, oldItem] = items
    const baseItem = newItem || oldItem
    
    dataModel.setPKvalues({
      {PK}: baseItem!.{PK},
      {FK}: baseItem!.{FK}
    })
    dataModel.setColdatas(newItem, oldItem)
    
    if (dataModel.hasColdats()) {
      postList.push(dataModel.build())
    }
  }
  
  if (postList.length > 0) {
    return await saveData(postList)
  }
  
  return { statusCode: '0', message: '没有数据变更' }
}
```

### Delete Pattern

```typescript
export async function delete{ModuleName}({PK}: number) {
  const userStore = useUserStore()
  
  const dataModel = generateDataModel({
    tableName: '{TABLE_NAME}',
    user: (userStore.userInfo as any).p_user
  })
  
  dataModel.setPKvalues({ {PK} })
  dataModel.setColdatas(null, { {PK} })  // null for new, object for old = delete
  
  if (dataModel.hasColdatas()) {
    return await saveData([dataModel.build()])
  }
}
```

## Common Patterns

### With Default Options
```typescript
export async function fetch{ModuleName}Item(
  params: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return fetchDataItem<{ModuleName}VO>(
    request('{模块}明细查询', params),
    { errorPrefix: '获取{模块}失败：', ...options }
  )
}
```

### Silent Query
```typescript
// No error message shown
const item = await fetch{ModuleName}Item(
  { where: { CODE: value } },
  { slient: true }
)
```

### Cached Options
```typescript
// In RemoteSelect component
<RemoteSelect
  :data-loader="fetch{Fk}Options"
  cache-id="{fk}-options"
/>
```

### Conditional Query
```typescript
export async function fetch{ModuleName}List(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  const where = params?.where || {}
  
  // Build conditions
  const conditions: Record<string, any> = {}
  
  if (params?.{FIELD}) {
    conditions['A.{FIELD}__like'] = params.{FIELD}
  }
  
  if (params?.dateRange?.length === 2) {
    conditions['A.DT__gte@date'] = params.dateRange[0]
    conditions['A.DT__lte@date'] = params.dateRange[1]
  }
  
  return fetchDataList<{ModuleName}VO[]>(
    request('{模块}列表查询', { where: { ...where, ...conditions } }),
    options
  )
}
```

## Error Handling

The `fetchDataList` and `fetchDataItem` wrappers handle errors automatically:

```typescript
// Default: shows ElMessage error
const data = await fetchDataList(request('查询', params))

// Silent: no error message
const data = await fetchDataList(request('查询', params), { slient: true })

// Custom error prefix
const data = await fetchDataList(
  request('查询', params),
  { errorPrefix: '自定义错误前缀：' }
)

// Message box instead of toast
const data = await fetchDataList(
  request('查询', params),
  { messageMode: 'messagebox' }
)
```

## Type Definition Patterns

### Basic VO
```typescript
export type {Model}VO = {
  {PK}: number
  {FIELD}: string
  {NUM_FIELD}: number
  {DATE_FIELD}: string
}
```

### With Display Fields
```typescript
export type {Model}VO = {
  {FK}: string
  V_{FK}NAME: string  // Display name
}
```

### With Status
```typescript
export type {Model}VO = {
  STFG: string        // Status code
  V_STFGNAME: string  // Status display
}
```

### Option Type
```typescript
export type {Fk}Option = {
  CODE: string
  CNAME: string
  // Additional fields if needed
}
```