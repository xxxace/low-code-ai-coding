<template>
  <ResizeModal
    ref="rmRef"
    :title="t('ttClentSearch', '客户查询')"
    width="540px"
    height="600px"
    mode="confirm"
    lock-view
    @confirm="confirmEvent"
  >
    <div class="flex flex-col h-full">
      <FieldItemGroup :disabled="loading">
        <div class="mb-2">
          <FieldItem :label="t('lbCode', '编码')" :width="28" independent>
            <el-input class="w-[120px]!" v-model="queryParams.CODE__like" />
          </FieldItem>

          <FieldItem :label="t('lbCname', '名称')" :width="28" independent>
            <el-input
              class="w-[120px]!"
              v-model="queryParams['NVL(SNAME,NVL(CNAME,ENAME))__like']"
            />
          </FieldItem>

          <FieldItem class="align-bottom" independent>
            <el-button type="primary" size="small" @click="onSearch">{{
              c('common.query')
            }}</el-button>
            <el-button size="small" @click="onReset">{{ c('common.reset') }}</el-button>
          </FieldItem>
        </div>
      </FieldItemGroup>

      <div class="flex-1">
        <EditableTable
          ref="tableRef"
          :columns="columns"
          :data="data"
          :tool-bar="false"
          :loading="loading"
          @cell-dbclick="handleCellDblclick"
        />
      </div>
    </div>
  </ResizeModal>
</template>

<script setup lang="ts" root>
import { ref } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import EditableTable from '@/components/EditableTable/index.vue'
import { useI18nReactive } from '@/hooks/nameson/useI18nReactive'
import { VxeGridPropTypes } from 'vxe-table'
import { useFetchSqlByObjectName } from '@/hooks/nameson/useFetchSql'
import { getResizeModelExposeProxy } from '@/utils'
import FieldItemGroup from '@/components/FieldItemGroup/index.vue'
import FieldItem from '@/components/FieldItem/index.vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useParamsRefManager } from '@/hooks/nameson/useRefManager'
import useCommonTable from '@/hooks/nameson/useCommonTable'
import type { EditableTableInstance } from '@/components/EditableTable/types'
import type { ResizeModalInstance } from '@/components/ResizeModal/types'
import { loadMessageByObjectName } from '@/plugins/vueI18n/lazyLoader'

defineOptions({
  objectName: 'VUE_CLNTSEARCH'
})

const emit = defineEmits(['confirm'])
const objectName = 'VUE_CLNTSEARCH'

loadMessageByObjectName(objectName)
const remoteSqlMap = useFetchSqlByObjectName(objectName)

const { t, c } = useI18nProxy(objectName)

const rmRef = ref<ResizeModalInstance>()
const tableRef = ref<EditableTableInstance>()

const [queryParams, queryParamsManager] = useParamsRefManager(() => {
  return {
    CODE__like: '',
    ['NVL(SNAME,NVL(CNAME,ENAME))__like']: ''
  }
})

const columns = useI18nReactive<VxeGridPropTypes.Column<any>[]>(() => {
  return [
    { type: 'radio', width: 30, align: 'center' },
    { type: 'seq', width: 50 },
    { field: 'CODE', title: t('gvBo_CODE', '编码'), width: 150 },
    { field: 'CNAME', title: t('gvBo_CNAME', '名称') }
  ]
})

const { loading, data, loadData, setupParams } = useCommonTable({
  sql: () => remoteSqlMap.value['客户清单的查询语句'].DBQUERY,
  sortby: () => remoteSqlMap.value['客户清单的查询语句'].SORTBYCONTENT
})

setupParams(() => {
  return () => queryParams.value
})

const onSearch = () => {
  loadData()
}

const onReset = () => {
  queryParamsManager.reset()
}

const handleCellDblclick = ({ row }) => {
  emit('confirm', row)
  rmRef.value?.close()
}

const confirmEvent = () => {
  const result = tableRef.value?.getRadioRecord()
  if (result) {
    emit('confirm', result)
  }
}

defineExpose(getResizeModelExposeProxy(rmRef))
</script>
