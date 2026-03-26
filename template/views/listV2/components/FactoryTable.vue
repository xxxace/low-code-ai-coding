<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data" v-bind="attrs" />
</template>

<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { useNsI18nColumns } from '@/hooks/nameson/useNsI18nColumns'

const attrs = useAttrs()
const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = useNsI18nColumns({
  scope: 'VUE_MES_POFTY',
  columns: [
    {
      field: 'FTYTYNAME',
      title: '工厂类型',
      i18nKey: 'lbFTYTYNAME',
      width: 80,
      align: 'center'
    },
    {
      field: 'FTYNO',
      title: '工厂编码',
      i18nKey: 'lbFTYNO',
      width: 90,
      align: 'center'
    },
    {
      field: 'FTYNAME',
      title: '工厂名称',
      i18nKey: 'lbFTYNAME',
      minWidth: 110,
      align: 'left'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
