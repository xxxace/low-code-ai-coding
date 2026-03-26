<template>
  <div class="vxe-table--ignore-clear">
    <vxe-grid
      ref="xGrid"
      class="vxe-table--ignore-clear"
      v-bind="gridOptions"
      :columns="columns"
      :data="gridData"
      :loading="loading"
      @cell-dblclick="handleCellDblclick"
      @form-submit="handleSearch"
      @form-reset="handleReset"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { searchData } from '@/api/nameson'

const props = defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  dataSource: {
    type: Array,
    default: () => []
  },
  xGridRef: Object,
  dataLoader: [Function, String],
  orderby: String,
  multiple: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:xGridRef', 'cell-dblclick'])

const xGrid = ref(null)
const loading = ref(false)
const tableData = ref([])
const columns = ref([])
const gridOptions = reactive({
  border: true,
  scrollY: { enabled: true, gt: 50 },
  showOverflow: true,
  size: 'mini',
  height: 450,
  rowConfig: {
    keyField: 'id'
  },
  columnConfig: {
    resizable: true
  },
  checkboxConfig: {
    reverse: true
  },
  pagerConfig: {
    background: true,
    layouts: ['Total'],
    enabled: true,
    currentPage: 1,
    total: 0
  },
  proxyConfig: { enabled: false },
  formConfig: {
    data: {},
    titleAlign: 'right',
    items: []
  }
})

const gridData = computed(() => {
  if (props.dataLoader) return tableData.value
  return props.dataSource
})

const columnType = computed(() => {
  return props.multiple ? 'checkbox' : 'radio'
})

const setFormConfigItems = (columns) => {
  const items = []
  const actionItem = {
    align: 'center',
    collapseNode: true,
    itemRender: {
      name: '$buttons',
      children: [
        { props: { type: 'submit', content: '搜索', status: 'primary' } },
        { props: { type: 'reset', content: '重置' } }
      ]
    }
  }

  let spanCount = 0
  columns.forEach((col) => {
    if (col.form) {
      const formConfig = typeof col.form === 'object' ? col.form : {}
      const span = formConfig.span || 6
      spanCount += span
      items.push({
        field: formConfig.field || col.field,
        title: col.title,
        span: span,
        folding: spanCount > 24,
        itemRender: {
          name: formConfig.render || '$input',
          options: formConfig.options,
          props: {
            placeholder: col.title,
            type: formConfig.type || 'text',
            clearable: true
          }
        }
      })
    }
  })
  if (items.length) {
    if (spanCount <= 12) {
      actionItem.span = 12
    } else {
      actionItem.span = 24
    }
    items.push(actionItem)
  }
  gridOptions.formConfig.items = items
}

const handleSearch = ({ data }) => {
  console.log('search', Object.keys(data))
  const parseQuery = (qeury, prefix = '') => {
    const result = {}
    Object.keys(qeury).forEach((key) => {
      const value = qeury[key]
      const keyName = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'object') {
        Object.assign(result, parseQuery(value, keyName))
      } else {
        result[keyName] = value
      }
    })

    return result
  }

  loadData(parseQuery(data))
}

const handleReset = () => {
  console.log('reset')
  loadData({})
}

const loadData = async (data) => {
  let dataLoader = props.dataLoader

  if (typeof props.dataLoader !== 'function') {
    dataLoader = async (data) => {
      const sqls = props.orderby
        ? [props.dataLoader, props.orderby]
        : props.dataLoader.toUpperCase().split('ORDER BY')
      const res = await searchData({
        sql: sqls[0],
        params: data,
        sortby: sqls[1]
          ? `${sqls[1].toUpperCase().indexOf('ORDER') !== -1 ? sqls[1] : `ORDER BY ${sqls[1]}`}`
          : ''
      })
      if (res.statusCode != '1') throw new Error(res.message)
      return {
        data: res.data,
        total: res.data.length
      }
    }
  }
  loading.value = true
  try {
    const res = await dataLoader(data)
    gridOptions.pagerConfig.total = res.total
    tableData.value = res.data
  } catch (e) {
    console.log(e)
    ElMessageBox.alert({
      type: 'error',
      message: e.message || JSON.stringify(e),
      title: 'Error'
    })
  }
  loading.value = false
}

const handlePageChange = ({ type, currentPage, pageSize, $event }) => {
  console.log('page change', type, currentPage, pageSize, $event)
  switch (type) {
    case 'current':
      gridOptions.pagerConfig.currentPage = currentPage
      break
    case 'size':
      gridOptions.pagerConfig.pageSize = pageSize
      break
    default:
      break
  }
}

const handleCellDblclick = ({ row }) => {
  emit('cell-dblclick', row)
}

watch(
  () => props.columns,
  (val) => {
    columns.value = [{ type: columnType.value, width: 44, align: 'center' }, ...val]
    setFormConfigItems(val)
  },
  { immediate: true }
)

watch(columnType, (val) => {
  columns.value[0].type = val
  xGrid.value.reloadColumn(columns.value)
})

watch(
  () => xGrid.value,
  (val) => {
    emit('update:xGridRef', val)
  }
)

watch(gridData, (val) => {
  gridOptions.pagerConfig.total = val.length
})
</script>
