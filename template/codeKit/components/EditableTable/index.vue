<template>
  <div class="editable-table flex flex-col" :style="conatinerStyle">
    <div v-if="toolBar && !isdisabled" class="action-bar flex mb-1 items-center">
      <el-button v-if="props.addButton" class="w-[16px] h-[16px]" size="small" title="添加" type="primary" @click="() => addRow({}, -1)">
        <vxe-icon name="add"/>
      </el-button>
      <el-divider v-if="props.addButton" direction="vertical"/>
      <el-button v-if="props.removeButton" class="w-[16px] h-[16px]" size="small" title="删除" type="danger" @click="removeRow">
        <vxe-icon name="delete"/>
      </el-button>
      <div class="flex-1 flex">
        <template v-if="slots.buttons">
          <div class="flex-1 flex justify-start">
            <a-divider type="vertical"/>
            <slot name="buttons"></slot>
          </div>
        </template>

        <template v-if="slots.rightSide">
          <div class="flex-1 flex justify-end">
            <slot name="rightSide"></slot>
          </div>
        </template>
      </div>
    </div>

    <VxeTableWrapper class="flex-1">
      <vxe-grid ref="xTableRef" v-bind="{ ...gridOptions, ...attrs }" :data="props.data" :footer-data="footerData"
                :show-footer="props.footer" :columns="gridColumns" :disabled="stdFormContext?.disabled"
                @cell-click="handleCellClick" @cell-dblclick="handleCellDblClick" @keydown="handleKeydown"
                @menuClick="handleMenuClick" @cell-menu="handleCellMenu">
        <!-- <template v-for="(_, name) in slots" v-slot:[name]="row" :key="name">
          <slot :name="name" v-bind="row"></slot>
        </template> -->
      </vxe-grid>
    </VxeTableWrapper>
  </div>
</template>

<script lang="ts" setup>
// 使用vxe-pc-ui的图标组件代替自定义Icon组件
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  ref,
  reactive,
  useAttrs,
  useSlots,
  watch,
  computed,
  inject,
  provide,
  watchEffect,
  nextTick
} from 'vue'
import {
  VxeTableInstance,
  VxeGridProps,
  VxeGridPropTypes,
  VxeTableEvents,
  VxeTableDefines
} from 'vxe-table'
import dayjs from 'dayjs'
import {stdFormContextKey} from '../../constants/key'
import {formContextKey} from 'element-plus'
import VxeTableWrapper from './VxeTableWrapper.vue'
import {toFixedPlus} from '../../utils'
import type {PresetKeyOrMenuItemOption} from './types'
import {VxeUI} from 'vxe-pc-ui'

type T = any

interface EditableTableProps<T> {
  data: T[]
  disabled?: boolean
  columns: VxeGridPropTypes.Column<T>[]
  filters?: Array<keyof T>
  addButton?: boolean
  removeButton?: boolean
  toolBar?: boolean
  footer?: boolean
  footerData?: any[]
  footerFormatter?: (...args: any[]) => any
  beforeEditMethod?: (row: T) => boolean
  checkMethod?: (row: T) => boolean
  removeMethod?: (row: T) => boolean
  rowInitializer?: (row: T, utils: { getMax: (key: keyof T) => number; now: typeof dayjs }) => T
  menuItem?: Array<PresetKeyOrMenuItemOption>
}

export type FoorterFormatterParams = {
  column: VxeGridPropTypes.Column
  total: any
  value: any
}

const props = withDefaults(defineProps<EditableTableProps<T>>(), {
  addButton: true,
  removeButton: true,
  toolBar: true,
  removeMethod: () => true
})
const emits = defineEmits([
  'current-row-change',
  'add',
  'remove',
  'cell-value-change',
  'cell-dbclick',
  'footer-row-updated',
  'total-rows-updated'
])

const attrs = useAttrs()
const slots = useSlots()

const stdFormContext = inject(stdFormContextKey)

const conatinerStyle = computed(() => {
  return `height:${attrs.height || '100%'}`
})
const xTableRef = ref<VxeTableInstance<T>>()
const gridOptions = reactive<VxeGridProps<T>>({
  size: 'mini',
  border: true,
  height: '100%',
  showHeaderOverflow: true,
  showOverflow: true,
  keepSource: true,
  virtualXConfig: {enabled: true},
  virtualYConfig: {enabled: true},
  columnConfig: {
    resizable: true
  },
  mouseConfig: {
    selected: true
  },
  rowConfig: {
    useKey: true,
    isHover: true,
    isCurrent: true
  },
  keyboardConfig: {
    isArrow: true,
    isEdit: true
  },
  // keyboardConfig: {
  //   isEdit: true,
  //   isArrow: true,
  //   isEnter: true,
  //   isTab: true,
  //   isDel: true
  // },
  menuConfig: {
    body: {
      options: [
        [
          {
            code: 'copy',
            name: 'copy',
            prefixConfig: {
              icon: 'vxe-icon-copy'
            },
            visible: true,
            disabled: false
          }
        ]
      ]
    }
  },
  editConfig: {
    trigger: 'click',
    mode: 'row',
    showIcon: false,
    enabled: true,
    beforeEditMethod: ({row}) => (props.beforeEditMethod || (() => true))(row)
  },
  checkboxConfig: {
    checkMethod: ({row}) => (props.checkMethod || (() => true))(row)
  }
})

const currentRow = ref<T>()
const currentCell = ref<VxeTableDefines.CellClickEventParams<T>>()
const filterCache = ref<Partial<T>>()
const gridColumns = ref<VxeGridPropTypes.Column<T>[]>([])
const footerData = ref<any[]>([])
const menuItemVisibleMethodMap = new Map<string, () => void>()

const dataColumns = computed(() => {
  const extractDataColumns = (columns: VxeGridPropTypes.Column<any>[]) => {
    const dataColumns: VxeGridPropTypes.Column<any>[] = []
    for (const column of columns) {
      if (column.children && column.children.length) {
        const childColumns = extractDataColumns(column.children)
        dataColumns.push(...childColumns)
      } else {
        dataColumns.push(column)
      }
    }
    return dataColumns
  }
  return extractDataColumns(props.columns)
})

const summaryColumns = computed(() => {
  const cols: Array<VxeGridPropTypes.Column<any> & { index: number }> = []
  dataColumns.value.forEach((col, index) => {
    if ((col as any).summary)
      cols.push({
        ...col,
        index
      })
  })
  return cols
})

const setupFilterColumn = (col: VxeGridPropTypes.Column<T>) => {
  col.filters = [{data: ''}]
  col.filterMethod = filterMethod(col.field)
}

const filterMethod = (key) => {
  return ({option, row}) => {
    return row[key] === option.data
  }
}

const addRow = async (defaultData: T = {} as T, targetRow?: any) => {
  let newRow = {...defaultData}
  if (props.rowInitializer)
    newRow = props.rowInitializer(Object.assign({}, newRow), {getMax, now: dayjs})
  const hasRow = xTableRef.value!.getTableData().visibleData.length > 0
  const res = await xTableRef.value?.insertAt(newRow, targetRow)

  if (!hasRow && res) await setCurrentRow(res.row)
  emits('add', res?.row)
  await updateTotalRow()
  return res?.row as T
}

const removeRow = () => {
  const selectRecords = xTableRef.value?.getCheckboxRecords()
  if (selectRecords && selectRecords.length > 0) {
    ElMessageBox.confirm('确定要删除选中的数据吗？', {
      type: 'warning',
      title: '删除确认',
      callback: async (action) => {
        if (action === 'confirm') {
          const {rows} = await xTableRef.value!.removeCheckboxRow()
          emits('remove', rows)
          await afterRemoveRow(rows)
        }
      }
    })
  } else {
    ElMessage.warning('请选择要删除的行')
  }
}

// 移除行
const remove = async (rows: T[]) => {
  const res = await xTableRef.value?.remove(rows)
  emits('remove', res?.rows)
  await afterRemoveRow(res?.rows || [])
  return res?.rows as T[] | undefined
}

const removeVisibleRow = async () => {
  const {visibleData} = xTableRef.value!.getTableData()
  return await remove(visibleData as T[])
}

const afterRemoveRow = async (rows: any[]) => {
  const currentRow = xTableRef.value?.getCurrentRecord()

  const hasCurr = currentRow
      ? rows.find((row) => row._X_ROW_KEY && row._X_ROW_KEY === currentRow._X_ROW_KEY)
      : false
  if (hasCurr) {
    await xTableRef.value?.clearCurrentRow()
    const {visibleData} = xTableRef.value!.getTableData()
    const firstRow = visibleData[0]
    await setCurrentRow(firstRow || {})
    currentCell.value = undefined
  }

  await updateTotalRow()
}

const handleCellClick: VxeTableEvents.CellClick<T> = async (cell) => {
  currentCell.value = cell
  await setCurrentRow(cell.row)
  if (cell.cell) {
    setTimeout(() => {
      const input = cell.cell.querySelector('input')
      if (input) input.focus()
    })
  }
}

const handleCellDblClick: VxeTableEvents.CellDblclick<T> = async (params) => {
  emits('cell-dbclick', params)
}

// 触发点击事件
const triggerClick = (el: HTMLElement) => {
  const mouseEvent = new PointerEvent('click', {
    bubbles: true, // 事件是否冒泡
    cancelable: true, // 事件是否可以被取消
    pointerType: 'mouse', // 指针类型为鼠标
    isPrimary: true // 是否为主指针（一般为 true）
  })
  el.dispatchEvent(mouseEvent)
}
// 处理键盘事件
const handleKeydown: VxeTableEvents.Keydown<T> = async (cell) => {
  const {$event} = cell

  if (($event as any).code === 'Tab') {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLInputElement
      if (
          activeElement &&
          activeElement.tagName === 'INPUT' &&
          activeElement.type !== 'checkbox' &&
          xTableRef.value?.$el.contains(activeElement)
      ) {
        triggerClick(activeElement)
      }
    })
  } else if (['ArrowUp', 'ArrowDown'].includes(($event as any).code)) {
    const delta = ($event as any).code === 'ArrowUp' ? -1 : 1

    // 没点击行时
    if (!currentCell.value) {
      console.log(currentCell.value)
      const {$table} = cell
      const rowIndex = $table.getRowIndex(currentRow.value)
      const nextRow = $table.reactData.tableData[(rowIndex || 0) + delta]
      if (nextRow) await setCurrentRow(nextRow)
    } else {
      // 点击过任意单元格时
      const {rowIndex, $table, column} = currentCell.value
      const nextRow = $table.reactData.tableData[(rowIndex || 0) + delta]

      if (!nextRow) return
      if (column) await $table.setEditCell(nextRow, column)
      const nextRowInfo = $table.getEditRecord() as any

      if (nextRowInfo) {
        await handleCellClick(nextRowInfo)
        const cellElement = nextRowInfo.cell
        const input = cellElement.querySelector('input') as HTMLInputElement
        if (input) input.focus()
      } else {
        const nextCellElement = $table.getCellElement(nextRow, column)
        nextCellElement && triggerClick(nextCellElement)
      }
    }
  }
}
// 设置当前行
const setCurrentRow = async (row) => {
  console.log('setCurrentRow:', {...gridOptions, ...attrs})
  if (row) {
    if (Object.keys(row).length) {
      await xTableRef.value?.setCurrentRow(row)
    }
    if (currentRow.value && currentRow.value === row) return
  }
  currentRow.value = row

  emits('current-row-change', row)
}

// 刷新当前行，用于行高亮
const refreshCurrentRow = async () => {
  const currentRow = xTableRef.value?.getCurrentRecord()

  if (currentRow) {
    const rowId = xTableRef.value!.getRowid(currentRow)
    const row = xTableRef.value!.getRowById(rowId)
    await setCurrentRow(row)
  } else if (xTableRef.value) {
    const {visibleData} = xTableRef.value!.getTableData()
    const firstRow = visibleData[0]
    await setCurrentRow(firstRow || {})
  }
  updateTotalRow()
}
// 过滤
const filter = async (params?: Partial<T>) => {
  if (!params) {
    if (filterCache.value) {
      params = filterCache.value
    } else {
      return
    }
  } else {
    filterCache.value = params
  }

  const $table = xTableRef.value
  if ($table) {
    await $table.clearAll()

    const filters = (props.filters || []) as string[]
    filters.forEach((key) => {
      const filter = $table.getColumnByField(key)
      if (filter) {
        const option = filter.filters[0]
        option.data = params[key]
        option.checked = true
      }
    })

    await $table.updateData()
    const {visibleData} = $table.getTableData()
    const firstRow = visibleData[0]

    await setCurrentRow(firstRow || {})
    await updateTotalRow()
  }
}
// 获取最大值
const getMax = (key) => {
  const {visibleData} = xTableRef.value!.getTableData()
  const max = visibleData.reduce((prev, next) => {
    if (prev < Number(next[key])) return Number(next[key])
    return prev
  }, 0)
  return max
}
// 清除remoteSelect options 缓存
const clearOptionCache = () => {
  const visibleColumns = xTableRef.value!.getColumns()

  function removeProperties(obj: object, key: string | RegExp) {
    const checker = typeof key === 'string' ? (k) => k === key : (k) => key.test(k)
    for (const k in obj) {
      if (checker(k)) delete obj[k]
    }
  }

  function traverse(columns: VxeTableDefines.ColumnInfo<any>[]) {
    for (const col of columns) {
      if (col.children) {
        traverse(col.children)
      } else if (col.params) {
        removeProperties(col.params, /@remote-select-/)
      }
    }
  }

  traverse(visibleColumns)
}

const updateRowField = async (row: T, field: string, value: any) => {
  row[field] = value
  updateTotalRow()
}

const updateTotalRow = async () => {
  await nextTick()
  const records = xTableRef.value!.getTableData().visibleData
  emits('total-rows-updated', records)

  if (!props.footer) {
    footerData.value = []
    return
  }

  const summaryMap: any = {}
  let formatter = (params: FoorterFormatterParams) => {
    return params.total + Number(params.value)
  }
  if (props.footerFormatter) formatter = props.footerFormatter
  records.forEach((record) => {
    summaryColumns.value.forEach((column) => {
      const value = record[column.field!] || 0
      summaryMap[column.field!] = formatter({
        column,
        total: summaryMap[column.field!] || 0,
        value
      })
    })
  })

  if (!props.footerFormatter) {
    Object.keys(summaryMap).forEach((key) => {
      if (summaryMap[key]) {
        summaryMap[key] = toFixedPlus(summaryMap[key], 2)
      }
    })
  }

  const footerDatas = [summaryMap]
  if (props.footerData) footerDatas.push(props.footerData)
  footerData.value = footerDatas
  emits('footer-row-updated', summaryMap)
}

// 初始化
const init = () => {
  currentRow.value = undefined
  currentCell.value = undefined
  clearOptionCache()
}

const flatArray = (arr: any[]) => {
  return arr.reduce(
      (acc, val) => (Array.isArray(val) ? acc.concat(flatArray(val)) : acc.concat(val)),
      []
  )
}

const updateColumnsVisible = () => {
  const flatColumns = flatArray(gridColumns.value)
  const traverse = (col: VxeGridPropTypes.Column<T>) => {
    const colMatch = flatColumns.find((c) => c.field === col.field)
    col.title = colMatch.title
    if (col.children) col.children.forEach(traverse)
  }

  xTableRef.value?.getTableColumn().fullColumn.forEach(traverse)
}

watchEffect(() => {
  const newFilterColumns: VxeGridPropTypes.Column<T>[] = []
  if (props.filters?.length) {
    props.filters?.forEach((filter) => {
      const filterCol = props.columns.find((col) => col.field === filter)
      if (filterCol) {
        setupFilterColumn(filterCol)
      } else {
        const newFilterCol: VxeGridPropTypes.Column<T> = {field: filter as string, visible: false}
        setupFilterColumn(newFilterCol)
        newFilterColumns.push(newFilterCol)
      }
    })
  }

  gridColumns.value = [...props.columns, ...newFilterColumns]
})

watch(
    () => props.columns,
    (updatedColumns) => {
      if (updatedColumns.length) {
        updatedColumns.forEach((col, index) => {
          Object.assign(gridColumns.value[index], col)
        })
        updateColumnsVisible()
      }
    },
    {
      deep: true
    }
)

watch(
    () => props.data,
    async () => {
      if (xTableRef.value) {
        await xTableRef.value.clearData()
        await xTableRef.value.clearAll()
        await xTableRef.value.reloadData(props.data)
      }
      currentRow.value = undefined
      currentCell.value = undefined
      await filter()
      await updateTotalRow()
      setTimeout(refreshCurrentRow, 100)
    },
    {
      immediate: true
    }
)

watch(
    () => props.footerData,
    async () => {
      await updateTotalRow()
    }
)

const isdisabled = computed(() => props.disabled || stdFormContext?.disabled)

watch(
    isdisabled,
    (disabled) => {
      if (gridOptions.editConfig) {
        gridOptions.editConfig.enabled = !disabled
      }
    },
    {
      immediate: true
    }
)

const handleMenuClick = ({menu, row, column}) => {
  const $grid = xTableRef.value
  if ($grid) {
    switch (menu.code) {
      case 'copy':
        if (row && column) VxeUI.clipboard.copy(row[column.field])
        break
      case 'removeRow':
        console.log(isdisabled.value, isdisabled)
        if (!isdisabled.value && row && column) remove([row])
        break
    }
  }
}

const handleCellMenu = ({
                          type,
                          row,
                          rowIndex,
                          $rowIndex,
                          column,
                          columnIndex,
                          $columnIndex,
                          $event
                        }) => {
  const updateVisibleMethods = menuItemVisibleMethodMap.values()

  for (const updateVisibleMethod of updateVisibleMethods) {
    updateVisibleMethod(row)
  }
}

provide('editableTableDisabled', isdisabled)

provide(
    formContextKey,
    reactive({
      disabled: isdisabled
    }) as any
)

let oldValue
let rowIndex
watch(
    () => currentRow.value,
    (row, oldRow) => {
      if (currentCell.value) {
        if (!currentCell.value.column || !currentCell.value.row) return
        const field = currentCell.value.column.field

        if (rowIndex === currentCell.value.rowIndex) {
          if (
              currentCell.value.row[field] !== oldValue ||
              (currentCell.value.row[field] === undefined && oldValue === undefined)
          ) {
            oldValue = currentCell.value.row[field]
            setTimeout(() => {
              emits('cell-value-change', {...currentCell.value, row})
              updateTotalRow()
            }, 50)
          }
        }
        // if (currentCell.value.row[field] !== oldValue && rowIndex === currentCell.value.rowIndex) {
        //   oldValue = currentCell.value.row[field]
        //   setTimeout(() => {
        //     emits('cell-value-change', { ...currentCell.value, row })
        //     updateTotalRow()
        //   }, 50)
        // } else {
        //   updateTotalRow()
        // }
      }
      rowIndex = currentCell.value?.rowIndex || 0
      updateTotalRow()
    },
    {deep: true}
)

const getCurrentRow = () => currentRow.value

const registerMenuItem = (keyOrItem: PresetKeyOrMenuItemOption) => {
  const presetItemMap = {
    removeRow: {
      code: 'removeRow',
      name: '删除当前行',
      prefixConfig: {
        icon: 'vxe-icon-delete'
      },
      visible: true,
      disabled: false
    }
  }

  if (
      !gridOptions.menuConfig ||
      !gridOptions.menuConfig.body ||
      !gridOptions.menuConfig.body.options
  ) {
    return
  }

  let visibleMethod = null
  if (typeof keyOrItem === 'function') {
    const itemInfo = keyOrItem()
    keyOrItem = itemInfo.code
    visibleMethod = itemInfo.visibleMethod
  }

  if (typeof keyOrItem === 'string') {
    const presetItem = presetItemMap[keyOrItem]
    const hasMenuItem = gridOptions.menuConfig.body.options[0].some(
        (item) => item.code === presetItem.code
    )
    if (!hasMenuItem && presetItem) {
      gridOptions.menuConfig.body.options[0].push(presetItem)
      menuItemVisibleMethodMap.set(keyOrItem, (row) => {
        const menuItem = gridOptions.menuConfig.body.options[0].find(
            (item) => item.code === keyOrItem
        )
        menuItem.visible = visibleMethod(row)
      })
    }
  } else {
    if (!gridOptions.menuConfig.body.options[1]) gridOptions.menuConfig.body.options[1] = []
    const hasMenuItem = gridOptions.menuConfig.body.options[1].some(
        (item) => item.code === keyOrItem.code
    )
    if (!hasMenuItem) {
      gridOptions.menuConfig?.body?.options[1].push(keyOrItem)
    }
  }
}

watch(
    () => props.menuItem,
    (menuItem) => {
      ;(menuItem || []).forEach((item) => {
        registerMenuItem(item)
      })
    },
    {immediate: true}
)

const expose = {
  getCurrentRow,
  addRow,
  remove,
  removeRow,
  removeVisibleRow,
  refreshCurrentRow,
  registerMenuItem,
  updateRowField,
  filter,
  init
}

defineExpose(
    new Proxy(
        {},
        {
          get(target, prop) {
            if (Object.prototype.hasOwnProperty.call(expose, prop)) return expose[prop]
            if (xTableRef.value) return xTableRef.value[prop]
            return target[prop]
          },
          has(target, prop) {
            return (
                Object.prototype.hasOwnProperty.call(expose, prop) ||
                prop in xTableRef.value! ||
                prop in target
            )
          }
        }
    )
)
</script>

<style lang="scss" scoped>
.editable-table {
  position: relative;

  &:hover {
    .action-bar {
      display: flex;
    }

    .action-bar-trigger-area {
      display: block;
    }
  }

  .action-bar {
    display: none;
    padding: 4px;
    position: absolute;
    top: -24px;
    left: 0;
    z-index: 100;
    border: 1px solid var(--vxe-ui-table-border-color);
    background-color: rgba(241, 241, 241, 0.5);
    backdrop-filter: blur(1px);
    border-bottom: none;
    transition: all 0.5s ease-in-out;
    width: calc(100% - 10px);
    // box-shadow: 0 -6px 6px rgba(0, 0, 0, 0.15);
  }
}
</style>
<style>
.vxe-cell--valid-error-hint {
  line-height: 0 !important;
}
</style>
