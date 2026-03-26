<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <AceFieldset legend="查询" class="overflow-hidden min-w-[1248px]">
      <div>
        <FieldItem :label="t('lbORDNO', '批号')" :width="30">
          <el-input class="w-[100px]!" v-model="query.ORDNO" />
        </FieldItem>
        <FieldItem :label="t('lbSTYNO', '款式')" :width="30">
          <el-input class="w-[100px]!" v-model="query.STYNO" />
        </FieldItem>
        <FieldItem :label="t('lbORIGIN', '产地')" :width="54">
          <RemoteSelect
            class="!w-[100px]"
            autoLoad
            transfer
            v-model="query.ORIGIN"
            :sql="remoteSqlMap['毛料_产地下拉框'].DBQUERY"
            :orderby="remoteSqlMap['毛料_产地下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbMATNO', '毛料编码')" :width="54">
          <el-input class="w-[112px]!" v-model="query.MATNO" />
        </FieldItem>
        <FieldItem :label="t('lbSUPMATNO', '成分')" :width="30">
          <el-input class="w-[100px]!" v-model="query.SUPMATNO" />
        </FieldItem>
        <FieldItem :label="t('lbSPECNO', '色号')" :width="30">
          <el-input class="w-[100px]!" v-model="query.SPECNO" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loadingComputed" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>

      <div class="mt-1">
        <FieldItem :label="t('lbCLNTDTTO', '货期')" :width="30">
          <date-range-picker
            class="w-[248px]"
            v-model:start="query.CLNTDTTO.start"
            v-model:end="query.CLNTDTTO.end"
          />
        </FieldItem>
        <FieldItem :label="t('lbREQDTTM', '需求日期')" :width="54">
          <date-range-picker
            class="w-[284px]"
            v-model:start="query.REQDTTM.start"
            v-model:end="query.REQDTTM.end"
          />
        </FieldItem>
        <FieldItem :label="t('lbSTKID', '仓库')" :width="30">
          <RemoteSelect
            class="!w-[248px]"
            autoLoad
            transfer
            value-key="STKID"
            v-model="query.STKID"
            :sql="remoteSqlMap['毛料_仓库下拉框'].DBQUERY"
            :orderby="remoteSqlMap['毛料_仓库下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
      </div>
    </AceFieldset>
    <div class="flex h-[350px]">
      <div class="flex-1 h-full">
        <AceFieldset
          :legend="t('lgRedinessEntry', '齐套明细')"
          absolute
          class="h-full overflow-hidden"
        >
          <WorkOrderTable
            :loading="loadingComputed"
            :data="redinessList"
            @currentRowChange="handleRedinessRowChange"
          />
        </AceFieldset>
      </div>
      <div class="flex-[0.7] h-full">
        <AceFieldset
          :legend="t('lgColorGroup', '齐套分析')"
          absolute
          class="h-full overflow-hidden"
        >
          <ColorGroupTable :loading="loadingComputed" :data="colorGroupList" />
        </AceFieldset>
      </div>
    </div>
    <div class="flex-1 flex">
      <AceFieldset
        :legend="t('lgPurchaseEntry', '采购明细')"
        absolute
        class="flex-1 overflow-hidden"
      >
        <MaterialTable
          :loading="loadingComputed"
          :data="purchaseEntryList"
          @currentRowChange="handlePurchaseEntryRowChange"
        />
      </AceFieldset>
      <AceFieldset
        :legend="t('lgInventoryEntry', '库存明细')"
        absolute
        class="flex-1 overflow-hidden"
      >
        <AvailableInventoryTable :loading="loadingComputed" :data="inventoryEntryList" />
      </AceFieldset>
    </div>
  </div>
</template>

<script lang="tsx" setup>
import { computed, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import WorkOrderTable from './components/workOrderTable/index.vue'
import MaterialTable from './components/materialTable/index.vue'
import ColorGroupTable from './components/colorGroupTable/index.vue'
import AvailableInventoryTable from './components/availableInventory/index.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { searchList } from '@/api/nameson'
import type {
  WoolColorGroupVO,
  WoolInventoryEntryVO,
  WoolPurchaseEntryVO,
  WoolRedinessEntryVO
} from '$types/views/MES/materialReadinessAnalysis'
import { formatString } from '@/utils'
import { ElMessageBox } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_QT'
})

const { t, c } = useI18nProxy('VUE_MES_QT')

const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORDNO: '',
    STYNO: '',
    ORIGIN: '',
    MATNO: '',
    SPECNO: '',
    SUPMATNO: '',
    STKID: '',
    CLNTDTTO: {
      start: '',
      end: ''
    },
    REQDTTM: {
      start: '',
      end: ''
    }
  }
})

const loading = ref(false)
const colorGroupLoading = ref(false)
const purchaseEntryLoading = ref(false)
const inventoryEntryLoading = ref(false)

const loadingComputed = computed(() => {
  return (
    loading.value ||
    colorGroupLoading.value ||
    purchaseEntryLoading.value ||
    inventoryEntryLoading.value
  )
})

const [redinessList, redinessListManager] = useArrayRefManager<WoolRedinessEntryVO>([])
const [colorGroupList, colorGroupListManager] = useArrayRefManager<WoolColorGroupVO>([])
const [purchaseEntryList, purchaseEntryListManager] = useArrayRefManager<WoolPurchaseEntryVO>([])
const [inventoryEntryList, inventoryEntryListManager] = useArrayRefManager<WoolInventoryEntryVO>([])

const handleRedinessRowChange = async (row: WoolRedinessEntryVO) => {
  if (!row.MATID) {
    loading.value = false
    colorGroupListManager.update([])
    purchaseEntryListManager.update([])
    return
  }

  loading.value = true
  colorGroupLoading.value = true
  purchaseEntryLoading.value = true
  try {
    await loadColorGroupList(row.MATID, row.SPECID)
    await loadPurchaseEntryList(row.MATID, row.SPECID)
  } catch (error) {
    loading.value = false
  }
  colorGroupLoading.value = false
  purchaseEntryLoading.value = false
}

const handlePurchaseEntryRowChange = async (row: WoolPurchaseEntryVO) => {
  if (!row.POSEQ) {
    loading.value = false
    inventoryEntryListManager.update([])
    return
  }

  loading.value = true
  inventoryEntryLoading.value = true
  await loadIventoryEntryList(row.PONO, row.MATID, row.SPECID)
  inventoryEntryLoading.value = false
  loading.value = false
}

const checkParamsIsEmpty = () => {
  const params = query.value
  if (
    !params.ORDNO &&
    !params.STYNO &&
    !params.ORIGIN &&
    !params.MATNO &&
    !params.SPECNO &&
    !params.SUPMATNO &&
    !params.STKID &&
    !params.CLNTDTTO.start &&
    !params.CLNTDTTO.end &&
    !params.REQDTTM.start &&
    !params.REQDTTM.end
  ) {
    throw new Error('参数不能为空！')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    checkParamsIsEmpty()
    await loadRedinessEntry()
  } catch (err: any) {
    loading.value = false
    ElMessageBox.alert(err.message || JSON.stringify(err), { type: 'warning' })
  }
}

const loadRedinessEntry = async () => {
  try {
    const remoteSql = remoteSqlMap['毛料_齐套明细']
    const params = query.value
    const list = await searchList<WoolRedinessEntryVO[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.ORDNO,
        params.STYNO,
        params.ORIGIN,
        params.MATNO,
        params.SPECNO,
        params.SUPMATNO,
        params.STKID,
        params.CLNTDTTO.start,
        params.CLNTDTTO.end,
        params.REQDTTM.start,
        params.REQDTTM.end
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    redinessListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询齐套明细数据错误：${err.message || JSON.stringify(err)}`)
  }
}

const loadColorGroupList = async (MATID: number, SPECID: number) => {
  try {
    const remoteSql = remoteSqlMap['毛料_采购明细']
    const list = await searchList<WoolColorGroupVO[]>({
      sql: formatString(remoteSql.DBQUERY, MATID, SPECID),
      sortby: remoteSql.SORTBYCONTENT
    })

    colorGroupListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询齐套明细数据错误：${err.message || JSON.stringify(err)}`)
    throw new Error(err)
  }
}

const loadPurchaseEntryList = async (MATID: number, SPECID: number) => {
  try {
    const remoteSql = remoteSqlMap['毛料_采购明细']
    const list = await searchList<WoolPurchaseEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, MATID, SPECID),
      sortby: remoteSql.SORTBYCONTENT
    })

    purchaseEntryListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询齐套明细数据错误：${err.message || JSON.stringify(err)}`)
    throw new Error(err)
  }
}

const loadIventoryEntryList = async (PONO: string, MATID: number, SPECID: number) => {
  try {
    const remoteSql = remoteSqlMap['毛料_库存明细']
    const list = await searchList<WoolPurchaseEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, PONO, MATID, SPECID),
      sortby: remoteSql.SORTBYCONTENT
    })

    inventoryEntryListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询齐套明细数据错误：${err.message || JSON.stringify(err)}`)
  }
}
</script>
