<template>
  <VxeTableWrapper>
    <vxe-grid
      ref="xTableRef"
      class="report"
      v-bind="{ ...gridOptions, ...attrs }"
      :columns="props.columns"
      :data="props.data"
      :show-footer="props.footer"
      :footer-data="footerData"
      @cell-click="handleCellClick"
      @keydown="handleKeydown"
      @menuClick="handleMenuClick"
    >
      <template v-for="(_, name) in slots" v-slot:[name]="row" :key="name">
        <slot :name="name" v-bind="row"></slot>
      </template>
    </vxe-grid>
  </VxeTableWrapper>
</template>
<script setup lang="ts">
import VxeTableWrapper from '../../components/EditableTable/VxeTableWrapper.vue'
import { reactive, ref, watch, useAttrs, useSlots, computed, nextTick } from 'vue'
import type {
  VxeGridProps,
  VxeGridPropTypes,
  VxeTableDefines,
  VxeTableEvents,
  VxeTableInstance
} from 'vxe-table'
import { VxeUI } from 'vxe-pc-ui'
import { toFixedPlus } from '../../utils'

export type ReportTableColumn = VxeGridPropTypes.Column & {
  summary?: boolean
  selectedConfig?: {
    enabled?: boolean
  }
}

export type ReportTableProps = {
  columns: ReportTableColumn[]
  data: any[]
  readonly?: boolean
  footer?: boolean
  footerData?: any[]
  footerFormatter?: (...args: any[]) => any
  checkMethod?: (row: any) => boolean
}

export type FoorterFormatterParams = {
  column: VxeGridPropTypes.Column
  total: any
  value: any
}

const props = withDefaults(defineProps<ReportTableProps>(), {
  data: () => [],
  readonly: false,
  footer: false
})

const emits = defineEmits([
  'current-row-change',
  'cell-change',
  'cell-dbclick',
  'footer-row-updated'
])
const attrs = useAttrs()
const slots = useSlots()

const xTableRef = ref<VxeTableInstance<any>>()
const currentRow = ref<any>()
const currentCell = ref<VxeTableDefines.CellClickEventParams<any>>()
const footerData = ref<any[]>([])
const gridOptions = reactive<VxeGridProps<any>>({
  size: 'mini',
  border: true,
  height: '100%',
  showHeaderOverflow: false,
  showOverflow: true,
  keepSource: true,
  virtualXConfig: { enabled: true },
  virtualYConfig: { enabled: true },
  columnConfig: {
    resizable: true
  },
  // mouseConfig: {
  //   selected: true
  // },
  rowConfig: {
    isHover: true,
    isCurrent: true
  },
  keyboardConfig: {
    isArrow: true
  },
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
  checkboxConfig: {
    checkMethod: ({ row }) => (props.checkMethod || (() => true))(row)
  }
})

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

const disabledSelectedColumns = computed(() => {
  return dataColumns.value.filter(
    (col: ReportTableColumn) => col.selectedConfig && !col.selectedConfig.enabled
  )
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

const isDisableSelectedColumn = (columnOrField: VxeGridPropTypes.Column<any> | string) => {
  if (typeof columnOrField === 'string') {
    columnOrField = { field: columnOrField }
  }
  return disabledSelectedColumns.value.some((col) => col.field === columnOrField.fixed)
}

const updateTotalRow = async () => {
  if (!props.footer) {
    footerData.value = []
    return
  }
  await nextTick()
  const records = xTableRef.value!.getTableData().visibleData

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

  Object.keys(summaryMap).forEach((key) => {
    if (summaryMap[key]) {
      const column = dataColumns.value.find((col) => col.field === key)
      const value = summaryMap[key]
      if (column && column.formatter === 'percentage' && value) {
        summaryMap[key] = value + '%'
      }
    }
  })

  const footerDatas = [summaryMap]

  if (props.footerData) footerDatas.push(props.footerData)

  footerData.value = footerDatas
  emits('footer-row-updated', summaryMap)
}

const handleCellClick: VxeTableEvents.CellClick<any> = async (
  cell: VxeTableDefines.CellClickEventParams<any>
) => {
  if (props.readonly) return
  if (isDisableSelectedColumn(cell.column)) {
    emits('cell-change', cell, true)
    return
  }
  // if (currentCell.value) removeClass(currentCell.value.cell, 'col--custom-selected')
  //
  // addClass(cell.cell, 'col--custom-selected')
  console.log(cell)
  currentCell.value = cell
  await setCurrentRow(cell.row)
  emits('cell-change', cell)
}

const handleMenuClick = ({ menu, row, column }) => {
  const $grid = xTableRef.value
  if ($grid) {
    switch (menu.code) {
      case 'copy':
        if (row && column) VxeUI.clipboard.copy(row[column.field])
        break
    }
  }
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
const handleKeydown: VxeTableEvents.Keydown<any> = async (e) => {
  const $event = e.$event as KeyboardEvent

  if (props.readonly) {
    $event.preventDefault()
    return
  }

  const keyCode = $event.code
  if (keyCode === 'KeyC' && $event.ctrlKey) {
    const el = xTableRef.value?.$el as HTMLElement
    const selection = window.getSelection()
    if (el && selection && el.contains(selection.anchorNode)) {
      console.log('复制')
    } else {
      const row = currentRow.value
      const column = currentCell.value?.column
      if (row && column) {
        VxeUI.clipboard.copy(row[column.field])
      }
    }
    return
  }

  if (keyCode === 'Tab') {
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
  } else if (['ArrowUp', 'ArrowDown'].includes(keyCode)) {
    const delta = keyCode === 'ArrowUp' ? -1 : 1
    // 没点击行时
    if (!currentCell.value) {
      const { $table } = e
      const rowIndex = $table.getRowIndex(currentRow.value)
      const nextRow = $table.getTableData().visibleData[(rowIndex || 0) + delta]
      if (nextRow) await setCurrentRow(nextRow)
    } else {
      // 点击过任意单元格时
      const { rowIndex, $table, column } = currentCell.value
      const nextRow = $table.getTableData().visibleData[(rowIndex || 0) + delta]

      if (!nextRow) return
      if (column) await $table.setEditCell(nextRow, column)
      const nextRowInfo = $table.getEditRecord() as any

      if (nextRowInfo) {
        // await handleCellClick(nextRowInfo)
        const cellElement = nextRowInfo.cell
        const input = cellElement.querySelector('input') as HTMLInputElement
        if (input) {
          input.focus()
        } else {
          cellElement.click()
        }
      } else {
        const nextCellElement = $table.getCellElement(nextRow, column)
        nextCellElement && triggerClick(nextCellElement)
      }
    }
  } else if (['ArrowLeft', 'ArrowRight'].includes(keyCode)) {
    if (!currentCell.value) return
    const delta = keyCode === 'ArrowLeft' ? -1 : 1
    // 点击过任意单元格时
    const { $table, column } = currentCell.value

    const dataColumns = $table.getTableColumn().fullColumn
    const columnIndex = dataColumns.findIndex((col) => col.id === column.id)
    const nextColumn = dataColumns[columnIndex + delta]

    if (isDisableSelectedColumn(nextColumn)) return
    const nextCell = $table.getCellElement(currentRow.value, nextColumn)
    if (!nextCell) return
    if (nextColumn) {
      await $table.setEditCell(currentRow.value, nextColumn)
      const nextCellElement = $table.getCellElement(currentRow.value, nextColumn)
      if (column.fixed !== undefined) {
        e.$event.preventDefault()
      }
      if (nextCellElement) {
        triggerClick(nextCellElement)
        await $table.scrollToColumn(nextColumn)
        setTimeout(async () => {
          const scroll = $table.getScroll()
          const el = xTableRef.value!.$el as HTMLElement
          const maxScrollX = el.scrollWidth - el.offsetWidth
          if (column.fixed || scroll.scrollLeft === 0 || scroll.scrollLeft === maxScrollX) return

          // const direction = delta < 0

          await $table.scrollTo(
            scroll.scrollLeft + (nextCellElement.clientWidth / 2) * delta,
            scroll.scrollTop
          )
        }, 50)
      }
    }
  }
}

// 刷新当前行，用于行高亮
const refreshCurrentRow = async () => {
  const currentRow = xTableRef.value?.getCurrentRecord()

  if (currentRow) {
    const rowId = xTableRef.value!.getRowid(currentRow)
    const row = xTableRef.value!.getRowById(rowId)
    await setCurrentRow(row)
  } else {
    const { visibleData } = xTableRef.value!.getTableData()
    const firstRow = visibleData[0]
    await setCurrentRow(firstRow || {})
  }

  await updateTotalRow()
}

// 设置当前行
const setCurrentRow = async (row) => {
  if (row) {
    if (currentRow.value && currentRow.value === row) return
    if (Object.keys(row).length) {
      await nextTick()
      await xTableRef.value?.setCurrentRow(row)
    }
  }
  currentRow.value = row

  emits('current-row-change', row)
  await updateTotalRow()
}

const setCurrentCell = async (
  row: any,
  fieldOrColumn: string | VxeTableDefines.ColumnInfo<any>
) => {
  if (!xTableRef.value) return
  const column =
    typeof fieldOrColumn === 'string'
      ? xTableRef.value.getColumnByField(fieldOrColumn)
      : fieldOrColumn

  const cell = xTableRef.value.getCellElement(row, column)
  if (!cell) return
  if (column) {
    await xTableRef.value.setEditCell(row, column)
    const cellElement = xTableRef.value.getCellElement(row, column)
    cellElement && triggerClick(cellElement)
  }
  await nextTick()
}

watch(
  () => props.data,
  async () => {
    if (xTableRef.value) {
      await xTableRef.value.clearData()
      await xTableRef.value.clearAll()
      await xTableRef.value.reloadData(props.data)
    }
    currentRow.value = undefined
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

watch(
  () => props.readonly,
  (val) => {
    gridOptions.keyboardConfig!.isArrow = !val
  }
)

const expose = {
  setCurrentCell
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

<style lang="scss">
.vxe-table--render-default .vxe-body--column.col--custom-selected {
  box-shadow: inset 0px 0px 0px 2px var(--vxe-ui-font-primary-color);
}

.vxe-table.vxe-table--render-default.size--mini.report,
.vxe-grid.size--mini.report {
  .vxe-header--column {
    .vxe-cell {
      line-height: 14px;
    }
  }

  .el-tag {
    --el-tag-border-radius: 0px;
  }

  //.el-tag.el-tag--success {
  //  --el-tag-text-color: #11af3c;
  //}
  //
  //.el-tag.el-tag--success {
  //  --el-tag-bg-color: #eeffe5;
  //  --el-tag-border-color: #11af3c;
  //  --el-tag-hover-color: #11af3c;
  //}

  .el-tag.el-tag--primary {
    --el-tag-border-color: var(--el-color-primary);
  }

  .el-tag.el-tag--info {
    --el-tag-border-color: var(--el-color-info);
  }

  .el-tag.el-tag--warning {
    --el-tag-text-color: #ff7600;
  }

  .el-tag.el-tag--warning {
    --el-tag-border-color: #ff7600;
  }

  .el-button--small {
    --el-button-size: 20px;
    padding: 4px 6px;
  }
}
</style>
