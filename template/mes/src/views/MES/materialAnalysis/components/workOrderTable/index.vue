<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data">
    <template #xxx="{ row }">
      <el-button v-if="row.xxx" size="small" type="primary" link @click="handleDetailClick">
        <span style="border-bottom: 1px solid">{{ row.xxx }}</span>
      </el-button>
    </template>
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
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive.ts'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const i18nReactive = createI18nReactive('VUE_MES_QT')
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    // { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
    {
      title: t('gvWoolRedinessEntry_MATNO', '毛料编码'),
      field: 'MATNO',
      width: 90,
      headerAlign: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolRedinessEntry_V_MATNAME', '成分'),
      field: 'V_MATNAME',
      width: 100,
      headerAlign: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolRedinessEntry_SPECNO', '色号'),
      field: 'SPECNO',
      width: 90,
      headerAlign: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolRedinessEntry_CSPEC', '色名'),
      field: 'CSPEC',
      width: 100,
      headerAlign: 'center'
    },
    {
      title: t('gvWoolRedinessEntry_V_OWNQTY', '需求数'),
      field: 'V_OWNQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_POQTY', '采购数'),
      field: 'V_POQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_ZTQTY', '在途数'),
      field: 'V_ZTQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_BLINQTY', '入库'),
      field: 'V_BLINQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_YLQTY', '预留'),
      field: 'V_YLQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_BLOUTQTY', '发料'),
      field: 'V_BLOUTQTY',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_BLQTY', '可用库存'),
      field: 'V_BLQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolRedinessEntry_V_QSQTY', '欠料'),
      field: 'V_QSQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      className: ({ row, column }) => {
        if (row[column.field] < 0) {
          return 'red-text'
        }
        return ''
      }
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
