<template>
  <div class="popup-table-trigger" @click.passive="handleVisible">
    <span v-if="currColumn">{{ currRow[contentKey] }}</span>
    <span
      v-if="clearable && currColumn && currRow[contentKey]"
      class="close-button absolute right-0 w-[24px] text-[#ff0000] text-[16px] font-500 items-center justify-center"
      @click="clearValue"
      >x
    </span>
  </div>
  <Teleport to=".view-container">
    <component
      ref="dialogPickRef"
      class="vxe-table--ignore-clear"
      :is="dialogComponent"
      v-bind="attrs"
      @confirm="handlePopupTableConfirm"
    />
  </Teleport>
</template>

<script lang="ts" setup>
import { watch, PropType, ref, nextTick } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'
import { ResizeModalInstance } from '@/components/ResizeModal/types'

const props = defineProps({
  options: {
    type: Object as PropType<
      VxeGlobalRendererHandles.RenderDefaultOptions & {
        clearable?: boolean
        contentKey?: string
        labelKey?: string
        valueKey: string
        valueMappings?: string[]
        dialogUpdator?: Function
        dialogComponent: Object
      }
    >,
    default: () => ({})
  },
  params: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
    default: () => ({})
  }
})

const attrs = ref()
const currColumn = ref<VxeTableDefines.ColumnInfo>()
const currRow = ref()
const clearable = ref(true)
const labelKey = ref('')
const valuekey = ref('')
const contentKey = ref('')
const valueMappings = ref<string[]>([])

const dialogPickRef = ref<ResizeModalInstance & Record<any, any>>()
const dialogComponent = ref()
const dialogUpdator = ref<any>()

const load = () => {
  const { options, params } = props
  const { row, column } = params

  if (options.attrs) {
    labelKey.value = options.attrs.labelKey || column.field
    valuekey.value = options.attrs.valueKey || column.field
    contentKey.value = options.attrs.contentKey || column.field
    if (options.attrs.valueMappings) valueMappings.value = options.attrs.valueMappings
    dialogComponent.value = options.attrs.dialogComponent
    dialogUpdator.value = options.attrs.dialogUpdator
    clearable.value = options.attrs.clearable !== false ? true : false
  }
  const temp = Object.assign({}, options.attrs || {})
  delete temp.dialogComponent
  delete temp.dialogUpdator
  delete temp.clearable
  attrs.value = temp

  currRow.value = row
  currColumn.value = column
}

const handleVisible = (e: MouseEvent) => {
  if (e.target && (e.target as HTMLSpanElement).classList.contains('close-button')) {
    return
  }
  setTimeout(async () => {
    await dialogPickRef.value?.open()
    await nextTick()
    if (dialogPickRef.value?.updateParams) {
      dialogPickRef.value?.updateParams(currRow.value, dialogUpdator.value)
    }
  })
}

const handlePopupTableConfirm = (item) => {
  if (currColumn.value && valuekey.value) {
    currRow.value[currColumn.value.field] = item[valuekey.value]

    if (valueMappings.value && valueMappings.value.length > 0) {
      setTimeout(() => {
        valueMappings.value.forEach((valueMapping) => {
          if (typeof valueMapping === 'function') {
            const [key, value] = valueMapping(currRow.value, item)
            currRow.value[key] = value
          } else {
            const [targetKey, sourceKey] = valueMapping.split(':')
            currRow.value[targetKey] = item[sourceKey]
          }
        })
      }, 50)
    }
  }
}

const clearValue = async () => {
  handlePopupTableConfirm({})
}

watch(
  () => props.options,
  () => load(),
  {
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
.popup-table-trigger {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--vxe-table-row-height-mini);
  cursor: pointer;

  &:hover {
    .close-button {
      display: inline-flex;
    }
  }
}

.close-button {
  display: none;
}
</style>
