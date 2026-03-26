<template>
  <EditableTable
      ref="tableRef"
      :data="props.data"
      :columns="columns"
      :editRules="editRules"
      :menuItem="['removeRow']"
      v-bind="attrs"
      height="100%"
  >
  </EditableTable>
</template>

<script setup lang="ts">
import {ref, useAttrs} from 'vue'
import type {VxeGridPropTypes} from 'vxe-table'
import {toFixedPlus, getEditableTableExposeProxy} from '@/nameson/utils'
import {useStdForm} from '@/nameson/components/StdForm/composeble/useStdForm'
import EditableTable from '@/nameson/components/EditableTable/index.vue'
import type {EditableTableInstance} from '@/nameson/components/EditableTable/types'
import type {AnchorEntryVO} from "@/api/nameson/services/basicData/anchorGroup";

const attrs = useAttrs()
const stdForm = useStdForm()

const tableRef = ref<any>()

const props = defineProps<{ data: Partial<AnchorEntryVO>[] }>()

const editRules = {
  DTLNO: [{required: true, message: ''}]
}

const columns: VxeGridPropTypes.Column<AnchorEntryVO>[] = [
  {type: 'checkbox', align: 'center', width: 30, fixed: 'left'},
  {type: 'seq', align: 'center', width: 40, fixed: 'left'},
  {
    title: '达人ID',
    field: 'DTLNO',
    width: 140,
  },
  {
    title: '达人名称',
    field: 'V_ANCHOR_NAME',
    minWidth: 160
  },
  {
    title: '平台',
    field: 'V_PLATFORM',
    width: 140
  }
]

defineExpose(getEditableTableExposeProxy(tableRef) as EditableTableInstance<AnchorEntryVO>)
</script>

<style lang="scss">
.light-blue {
  background-color: #b2d0ff !important;
}
</style>
