# Table Patterns

Patterns for generating table components.

## Editable Table Component

```vue
<template>
  <EditableTable
    ref="tableRef"
    :columns="columns"
    :data="props.data"
    :tool-bar="false"
    :footer="true"
    :row-initializer="rowInitializer"
    @current-row-change="handleCurrentRowChange"
    @cell-value-change="handleCellValueChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EditableTable from '@/components/EditableTable/index.vue'
import type { VxeGridPropTypes } from 'vxe-table'
import type { {Model}VO } from '../types'

const props = defineProps<{
  data: {Model}VO[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'current-row-change': [row: {Model}VO]
  'cell-value-change': [params: any]
}>()

// ==================== Columns ====================
const columns = computed<VxeGridPropTypes.Column<{Model}VO>[]>(() => [
  { type: 'seq', width: 50, align: 'center', fixed: 'left' },
  { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
  {
    field: '{FIELD}',
    title: '{标题}',
    width: 100,
    fixed: 'left',
    editRender: { name: 'input' }
  },
  {
    field: '{FK_FIELD}',
    title: '{外键标题}',
    width: 100,
    editRender: {
      name: 'RemoteSelect',
      props: {
        valueKey: 'CODE',
        labelKey: 'CNAME',
        dataLoader: fetch{FkField}Options
      }
    }
  },
  {
    field: '{DATE_FIELD}',
    title: '{日期标题}',
    width: 100,
    formatter: 'date',
    editRender: {
      name: 'input',
      props: { type: 'date' }
    }
  },
  {
    field: '{NUM_FIELD}',
    title: '{数字标题}',
    width: 80,
    align: 'right',
    summary: true,
    editRender: { name: 'input', props: { type: 'number' } }
  },
  {
    field: '{SELECT_FIELD}',
    title: '{下拉标题}',
    width: 100,
    editRender: {
      name: 'NSSelect',
      props: {
        options: {selectOptions}
      }
    }
  }
])

// ==================== Row Initializer ====================
const rowInitializer = (row, utils) => {
  row.SEQ = utils.getMax('SEQ') + 1
  row.DT = utils.now().format('YYYY-MM-DD')
  return row
}

// ==================== Event Handlers ====================
const handleCurrentRowChange = (row: {Model}VO) => {
  emit('current-row-change', row)
}

const handleCellValueChange = (params) => {
  emit('cell-value-change', params)
}
</script>
```

## Report Table Component (Read-only)

```vue
<template>
  <ReportTable
    :columns="columns"
    :data="props.data"
    :footer="true"
    :readonly="true"
    @current-row-change="handleCurrentRowChange"
  >
    <template #{{field}}="{ row }">
      <el-link type="primary" @click="handleOpenDetail(row)">
        {{ row.{FIELD} }}
      </el-link>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReportTable from '@/components/ReportTable/index.vue'
import type { VxeGridPropTypes } from 'vxe-table'
import type { {Model}VO } from '../types'

const props = defineProps<{
  data: {Model}VO[]
}>()

const emit = defineEmits<{
  'open-detail': [row: {Model}VO]
  'current-row-change': [row: {Model}VO]
}>()

// ==================== Columns ====================
const columns = computed<VxeGridPropTypes.Column<{Model}VO>[]>(() => [
  { type: 'seq', width: 50, align: 'center', fixed: 'left' },
  {
    field: '{FIELD}',
    title: '{标题}',
    width: 100,
    fixed: 'left',
    slots: { default: '{field}' }
  },
  {
    field: '{STATUS}',
    title: '状态',
    width: 80,
    formatter: ({ cellValue }) => {
      const map = {
        'BL_D': '草稿',
        'BL_S': '已提交',
        'BL_A': '已审核'
      }
      return map[cellValue] || cellValue
    }
  },
  {
    field: '{NUM_FIELD}',
    title: '{数字标题}',
    width: 80,
    align: 'right',
    summary: true,
    formatter: 'number'
  },
  {
    field: '{DATE_FIELD}',
    title: '{日期标题}',
    width: 100,
    formatter: 'date'
  }
])

// ==================== Event Handlers ====================
const handleOpenDetail = (row: {Model}VO) => {
  emit('open-detail', row)
}

const handleCurrentRowChange = (row: {Model}VO) => {
  emit('current-row-change', row)
}
</script>
```

## Column Configuration Patterns

### Basic Column
```typescript
{
  field: '{FIELD}',
  title: '{标题}',
  width: 100
}
```

### Fixed Column
```typescript
{
  field: '{FIELD}',
  title: '{标题}',
  width: 100,
  fixed: 'left'  // or 'right'
}
```

### Right-aligned Number
```typescript
{
  field: '{NUM}',
  title: '{标题}',
  width: 80,
  align: 'right',
  summary: true
}
```

### Date Column
```typescript
{
  field: '{DATE}',
  title: '{标题}',
  width: 100,
  formatter: 'date'
}
```

### Editable Input
```typescript
{
  field: '{FIELD}',
  title: '{标题}',
  width: 100,
  editRender: { name: 'input' }
}
```

### Editable Number
```typescript
{
  field: '{NUM}',
  title: '{标题}',
  width: 80,
  align: 'right',
  editRender: {
    name: 'input',
    props: { type: 'number' }
  }
}
```

### Editable Select
```typescript
{
  field: '{SELECT}',
  title: '{标题}',
  width: 100,
  editRender: {
    name: 'NSSelect',
    props: {
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ]
    }
  }
}
```

### Editable Remote Select
```typescript
{
  field: '{FK}',
  title: '{标题}',
  width: 120,
  editRender: {
    name: 'RemoteSelect',
    props: {
      valueKey: 'CODE',
      labelKey: 'CNAME',
      dataLoader: fetch{Fk}Options,
      params: () => ({ args: [row.PARENT] })
    }
  }
}
```

### Custom Slot
```typescript
{
  field: '{FIELD}',
  title: '{标题}',
  width: 100,
  slots: { default: '{field}' }
}
```

### Status Formatter
```typescript
{
  field: 'STFG',
  title: '状态',
  width: 80,
  formatter: ({ cellValue }) => {
    const statusMap = {
      'BL_D': '草稿',
      'BL_S': '已提交',
      'BL_A': '已审核',
      'BL_F': '已完成',
      'BL_C': '已取消'
    }
    return statusMap[cellValue] || cellValue
  }
}
```

### Tag Formatter
```typescript
{
  field: 'STFG',
  title: '状态',
  width: 80,
  cellRender: {
    name: 'ElTag',
    props: ({ row }) => ({
      type: row.STFG === 'BL_A' ? 'success' : 'info',
      effect: 'plain'
    }),
    content: ({ row }) => statusMap[row.STFG]
  }
}
```

## Table with Custom Toolbar

```vue
<template>
  <EditableTable
    ref="tableRef"
    :columns="columns"
    :data="props.data"
    :tool-bar="true"
    :add-button="false"
    :remove-button="false"
  >
    <template #buttons>
      <el-button size="small" @click="handleImport">导入</el-button>
      <el-button size="small" @click="handleExport">导出</el-button>
    </template>
    <template #rightSide>
      <span class="text-gray-500">共 {{ props.data.length }} 条</span>
    </template>
  </EditableTable>
</template>
```

## Nested Table (Master-Detail)

```vue
<template>
  <vxe-table
    :data="masterData"
    :expand-config="{ expandRowKeys: expandedKeys }"
  >
    <vxe-column type="expand" width="50">
      <template #content="{ row }">
        <DetailTable :data="row.details" />
      </template>
    </vxe-column>
    <!-- Master columns -->
  </vxe-table>
</template>
```