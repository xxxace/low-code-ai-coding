<template>
  <ListTable :options="optionsComputed" />
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { ListTable } from '@visactor/vue-vtable'
import type { TYPES } from '@visactor/vtable'
import { register } from '@visactor/vtable'
import themes from './themes'
import { InputEditor, DateInputEditor } from '@visactor/vtable-editors'
import { EditableTableProps } from '@/components/EditableTableV2/types'

register.editor('input-editor', new InputEditor())
register.editor('date-input-editor', new DateInputEditor())

const props = withDefaults(defineProps<EditableTableProps>(), {})

const tableOptions: TYPES.ListTableConstructorOptions = {
  theme: themes.ARCO,
  enableLineBreak: true,
  autoWrapText: true,
  limitMaxAutoWidth: 500,
  heightMode: 'autoHeight',
  editCellTrigger: ['doubleclick', 'keydown'],
  keyboardOptions: {
    copySelected: true,
    pasteValueToCell: true,
    selectAllOnCtrlA: true
  }
}

const optionsComputed = computed<TYPES.ListTableConstructorOptions>(() => {
  return {
    columns: props.columns,
    records: props.data,
    ...tableOptions
  }
})
</script>

<style lang="scss">
.vtable {
  input {
    outline: none;
    border: none;
    padding: 0 2px;
  }
}
</style>
