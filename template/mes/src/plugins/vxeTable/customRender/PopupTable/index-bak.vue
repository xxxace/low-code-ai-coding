<template>
  <div class="popup-table-trigger" @click.passive="handleVisible">
    <span v-if="currColumn">{{ currRow[contentKey] }}</span>
  </div>
  <Teleport to="body">
    <PopupTable
      class="vxe-table--ignore-clear"
      v-model:visible="visible"
      v-bind="attrs"
      :multiple="false"
      @confirm="handlePopupTableConfirm"
    />
  </Teleport>
</template>

<script lang="ts" setup>
import { watch, PropType, ref } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'
import PopupTable from '@/components/PopupTable/index.vue'

const props = defineProps({
  options: {
    type: Object as PropType<
      VxeGlobalRendererHandles.RenderDefaultOptions & {
        contentKey?: string
        labelKey?: string
        valueKey: string
        valueMappings?: string[]
      }
    >,
    default: () => ({})
  },
  params: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
    default: () => ({})
  }
})

const visible = ref(false)
const attrs = ref()
const currColumn = ref<VxeTableDefines.ColumnInfo>()
const currRow = ref()
const labelKey = ref('')
const valuekey = ref('')
const contentKey = ref('')
const valueMappings = ref<string[]>([])
const dataLoaderGetter = ref()

const load = () => {
  const { options, params } = props
  const { row, column } = params

  if (options.attrs) {
    labelKey.value = options.attrs.labelKey || column.field
    valuekey.value = options.attrs.valueKey || column.field
    contentKey.value = options.attrs.contentKey || column.field
    if (options.attrs.valueMappings) valueMappings.value = options.attrs.valueMappings
  }

  attrs.value = options.attrs
  if (attrs.value.dataLoader && typeof attrs.value.dataLoader === 'function') {
    dataLoaderGetter.value = attrs.value.dataLoader
  }
  currRow.value = row
  currColumn.value = column
}

const handleVisible = () => {
  if (dataLoaderGetter.value) {
    attrs.value.dataLoader = dataLoaderGetter.value()
  }
  visible.value = true
}

const handlePopupTableConfirm = (item) => {
  if (currColumn.value && valuekey.value) {
    currRow.value[currColumn.value.field] = item[valuekey.value]

    if (valueMappings.value && valueMappings.value.length > 0) {
      setTimeout(() => {
        valueMappings.value.forEach((valueMapping) => {
          const [targetKey, sourceKey] = valueMapping.split(':')
          currRow.value[targetKey] = item[sourceKey]
        })
      }, 50)
    }
  }
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
  width: 100%;
  height: 100%;
  min-height: var(--vxe-table-row-height-mini);
  cursor: pointer;
}
</style>
