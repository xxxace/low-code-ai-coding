<template>
  <vxe-input
    v-if="currRow && currColumn"
    :class="[align]"
    :controls="false"
    :disabled="attrs.disabled || editableDisabled"
    v-model="model"
    v-bind="attrs"
    :title="model"
    @keydown="onKeydown"
  />
</template>

<script lang="ts" setup>
import { PropType, ref, computed, inject, ComputedRef } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'

const props = defineProps({
  options: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderDefaultOptions>,
    default: () => ({})
  },
  params: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
    default: () => ({})
  }
})

const currColumn = ref<VxeTableDefines.ColumnInfo>()
const editableDisabled = inject<ComputedRef<boolean>>('editableTableDisabled')
const currRow = ref()
const attrs = ref()
const align = ref('left')
const model = computed({
  get() {
    return currColumn.value ? currRow.value[currColumn.value.field] : undefined
  },
  set(val) {
    if (attrs.value.type === 'number') {
      currRow.value[currColumn.value!.field] = val !== 0 && !val ? undefined : val * 1 || 0
    } else {
      currRow.value[currColumn.value!.field] = val
    }
  }
})

const load = () => {
  const { options, params } = props
  const { row, column } = params

  currRow.value = row
  currColumn.value = column
  const $attrs = options.attrs || {}
  align.value = $attrs.align || 'left'
  delete $attrs.align
  attrs.value = options.attrs || {}
}

const onKeydown = (evnt: any) => {
  const { $event } = evnt
  if ($event.key === 'ArrowUp' || $event.key === 'ArrowDown') {
    $event.preventDefault()
  }
}

load()
</script>
<style lang="scss" scoped>
.right {
  text-align: right;

  :deep(input) {
    text-align: right;
  }
}
</style>
