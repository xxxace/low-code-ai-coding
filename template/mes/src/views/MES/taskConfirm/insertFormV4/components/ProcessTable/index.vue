<template>
  <EditableTable ref="tableRef" :data="props.data" :columns="columns" v-bind="attrs" height="212px">
  </EditableTable>
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import type { VxeGridPropTypes } from 'vxe-table'
import { getEditableTableExposeProxy } from '@/utils'
import { useStdFormI18n } from '@/hooks/nameson/useI18nProxy'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { JOBVO } from '$types/views/MES/insertOrder.ts'

const attrs = useAttrs()
const stdForm = useStdForm()

const { t } = useStdFormI18n()

const tableRef = ref<any>()

const props = defineProps<{ data: Partial<JOBVO>[] }>()

const columns = useI18nReactive<VxeGridPropTypes.Column<JOBVO>[]>(() => {
  return [
    { type: 'checkbox', align: 'center', width: 30, fixed: 'left' },
    {
      title: t('gvPMJOB_JOBNO', '工序编码'),
      field: 'JOBNO',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvPMJOB_CNAME', '工序名称'),
      field: 'CNAME',
      align: 'left'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>

<style lang="scss">
.light-blue {
  background-color: #b2d0ff !important;
}
</style>
