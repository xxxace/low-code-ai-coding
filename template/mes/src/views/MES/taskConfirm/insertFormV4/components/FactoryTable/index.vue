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
import { FactoryVO } from '$types/views/MES/insertOrder.ts'

const attrs = useAttrs()
const stdForm = useStdForm()

const { t } = useStdFormI18n()

const tableRef = ref<any>()

const props = defineProps<{ data: Partial<FactoryVO>[] }>()

const columns = useI18nReactive<VxeGridPropTypes.Column<FactoryVO>[]>(() => {
  return [
    {
      field: 'FTYSEQ',
      title: t('gvFactory_FTYSEQ', '序号'),
      fixed: 'left',
      align: 'center',
      width: 50
    },
    {
      field: 'V_FTYTYNAME',
      title: t('gvFactory_V_FTYTYNAME', '类型'),
      fixed: 'left',
      align: 'center',
      width: 60
    },
    { field: 'FTYNO', title: t('gvFactory_FTYNO', '工厂编码'), width: 60 },
    { field: 'V_FTYNAME', title: t('gvFactory_V_FTYNAME', '工厂名称'), width: 180 }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>

<style lang="scss">
.light-blue {
  background-color: #b2d0ff !important;
}
</style>
