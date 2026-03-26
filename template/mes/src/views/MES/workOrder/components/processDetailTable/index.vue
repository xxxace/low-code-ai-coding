<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data">
    <template #STFGNAME="{ row }">
      <el-tag :type="row.STFGNAME === '已完成' ? 'success' : 'primary'" effect="dark" round
      >{{ row.STFGNAME }}
      </el-tag>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import dayjs from 'dayjs'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '工序编码',
    field: 'JOBNO',
    width: 90,
    align: 'center'
  },
  {
    title: '工序名称',
    field: 'V_JOBCNAME',
    width: 100,
    align: 'left',
    headerAlign: 'center'
  },
  {
    title: '制造序号',
    field: 'JOBSEQ',
    width: 90,
    align: 'center'
  },
  {
    title: '标准工时',
    field: 'STDHRS',
    width: 90,
    align: 'center'
  },
  {
    title: '机台数',
    field: 'V_PS_WKNUM',
    width: 90,
    align: 'center'
  }
])

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
