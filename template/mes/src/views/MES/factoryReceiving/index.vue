<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <div id="vnode-container"></div>
    <AceFieldset legend="查询" class="overflow-hidden min-w-[1248px]">
      <div>
        <FieldItem :label="t('lbORDNO', '批号')" :width="48">
          <UppercaseInput v-model="query.ORDNO" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loadingComputed" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>

        <FieldItem
          class="position-absolute right-1 bottom-1"
          :label="t('lbUnit', '单位')"
          :width="28"
        >
          <div>：LBS</div>
        </FieldItem>
      </div>
    </AceFieldset>
    <div class="flex gap-1 flex-1">
      <AceFieldset legend="工厂仓实时库存汇总信息" absolute class="w-[516px]! overflow-hidden">
        <WarehouseInfoTable
          ref="warehouseInfoTableRef"
          :loading="loadingComputed"
          :data="warehouseInfoList"
        />
      </AceFieldset>
      <AceFieldset legend="批号库存信息" absolute class="flex-1 overflow-hidden">
        <ReceivingMaterialTable
          ref="receivingMaterialTableRef"
          :loading="loadingComputed"
          :data="receivingMaterailList"
        />
      </AceFieldset>
    </div>
  </div>
</template>

<script lang="tsx" setup>
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'
import { ref, computed } from 'vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import WarehouseInfoTable from './components/warehouseInfoTable.vue'
import ReceivingMaterialTable from './components/receivingMaterialTable.vue'
import type { WarehouseInfoVO, ReceivingMaterialVO } from '$types/views/MES/factoryReceiving'

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_FACRECEIPT'
})
const { t, c } = useI18nProxy('VUE_FACRECEIPT')

const loading = ref(false)
const materialLoading = ref(false)
const jobLoading = ref(false)
const loadingComputed = computed(() => {
  return loading.value || materialLoading.value || jobLoading.value
})

const warehouseInfoTableRef = ref<InstanceType<typeof WarehouseInfoTable>>()
const receivingMaterialTableRef = ref<InstanceType<typeof ReceivingMaterialTable>>()

const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORDNO: ''
  }
})

const [warehouseInfoList, warehouseInfoListManager] = useArrayRefManager<WarehouseInfoVO>([])
const [receivingMaterailList, receivingMaterailListManager] =
  useArrayRefManager<ReceivingMaterialVO>([])

const loadData = async () => {
  const ORDNO = query.value.ORDNO
  loading.value = true

  try {
    await loadWarehouseInfoList()
    if (ORDNO) {
      await loadReceivingMaterialList(ORDNO)
    } else {
      receivingMaterailListManager.update([])
    }
  } catch (e: any) {
    ElMessageBox.alert(`查询数据错误：${e.message || JSON.stringify(e)}`)
  }

  loading.value = false
}

const loadReceivingMaterialList = async (ORDNO: string) => {
  materialLoading.value = true
  try {
    const remoteSql = remoteSqlMap['V_MATBATCHWH_ORD']
    const list = await searchList<ReceivingMaterialVO[]>({
      sql: remoteSql.DBQUERY,
      params: {
        'O.ORDNO__like': ORDNO
      },
      sortby: remoteSql.SORTBYCONTENT
    })

    receivingMaterailListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`批号库存信息查询数据错误：${e.message || JSON.stringify(e)}`)
  }
  materialLoading.value = false
}

const loadWarehouseInfoList = async () => {
  try {
    const remoteSql = remoteSqlMap['V_MATBATCHWH']
    const list = await searchList<WarehouseInfoVO[]>({
      sql: remoteSql.DBQUERY,
      sortby: remoteSql.SORTBYCONTENT
    })

    warehouseInfoListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`工厂仓实时库存汇总信息查询数据错误：${e.message || JSON.stringify(e)}`)
  }
}
</script>
