<template>
  <div class="order-trace" v-loading="isExternalEmit">
    <h2 class="page-title">生产订单追溯系统</h2>

    <!-- 搜索栏 -->
    <div class="search-wrapper">
      <div class="search-title">生产单号：</div>
      <div class="flex items-center gap-2">
        <UppercaseInput
          class="search-input"
          v-model="searchQuery"
          placeholder="生产单单号"
          clearable
          spellcheck="false"
          @keyup.enter="() => handleSearch(searchQuery)"
        >
          <template #prefix>
            <Icon icon="vi-ant-design:search-outline" />
          </template>
        </UppercaseInput>
        <div>
          <el-checkbox
            class="h-[28px]!"
            style="border-radius: 0"
            v-model="isShowAllJobFlow"
            border
            size="small"
            @change="handleShowAllJobFlowChange"
          >
            查看所有工序
          </el-checkbox>
        </div>
      </div>
    </div>

    <!-- 订单列表 -->
    <order-list
      ref="orderListRef"
      class="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      :order-loading="orderLoading"
      :loading="loading"
      :orders="orders"
      @item-click="handleItemClick"
    />
  </div>
</template>

<script lang="ts" setup>
import { nextTick, provide, type Ref, ref, onMounted } from 'vue'
import OrderList from './components/OrderList.vue'
import { TRACE_PANEL_INJECTION_KEY } from '@/views/MES/orderTrace/tracePanel/constant'
import { formatString } from '@/utils'
import { useFetchSqlEffect } from '@/hooks/nameson/useFetchSql'
import { searchList } from '@/api/nameson'
import { ElMessage, ElMessageBox } from 'element-plus'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'
import type {
  OrderColorVO,
  OrderVO,
  ProcessingContractVO,
  ProcessJobVO
} from '$types/views/MES/orderTrac'
import { useParentScope } from '@/hooks/nameson/useParentScope'

const [remoteSqlMap, remoteSqlMapLoader] = useFetchSqlEffect({ objectName: 'VUE_MES_ORDSCH' })
const parentScope = useParentScope('orderTrace')

export type OrderStep = ProcessingContractVO & {
  isLoaded: boolean
  showChild: boolean
  list: ProcessJobVO[]
}

export type OrderColorItem = OrderColorVO & {
  isLoaded: boolean
  steps: OrderStep[]
}

export type Order = OrderVO & {
  isLoaded: boolean
  colors: Ref<OrderColorItem[]>
}

const emit = defineEmits(['subItemClick'])

const orderListRef = ref<InstanceType<typeof OrderList>>()
const loading = ref<boolean>(false)
const isShowAllJobFlow = ref<boolean>(false)
const orderLoading = ref<boolean>(false)
const isExternalEmit = ref<boolean>(false)
const externalParams = ref<any>(null)
const searchQuery = ref('')
const currentORDNO = ref('')
const orders = ref<Order[]>([])

// 处理搜索
const handleSearch = async (query: string) => {
  if (!query) {
    ElMessage.error(`订单号不能为空！`)
    return
  }
  if (loading.value) return
  orderLoading.value = true
  loading.value = true

  if (!isExternalEmit.value) {
    subItemEmit('', null)
  }

  try {
    const remoteSql = remoteSqlMap.value['第一层订单信息']
    const list = await searchList<Order[]>({
      sql: formatString(remoteSql.DBQUERY, query),
      sortby: remoteSql.SORTBYCONTENT
    })
    orders.value = list
    if (orders.value.length > 0) {
      currentORDNO.value = query
      orderLoading.value = false
      loading.value = false
      await autoShowFirstChild(orders.value[0] as unknown as Order, isExternalEmit.value ? 3 : 2)
    } else {
      ElMessageBox.alert(`查询批号不存在，请确认！`)
    }
  } catch (e: any) {
    ElMessage.error(`查询订单信息错误：${e.message || JSON.stringify(e)}`)
  } finally {
    orderLoading.value = false
    loading.value = false
  }
}

const autoShowFirstChild = async (item: Order, maxLevel?: number) => {
  if (!maxLevel) maxLevel = 2
  if (item) {
    await handleItemClick(1, item)
    await orderListRef.value?.setActiveCollapse(1, item.ORDSEQ)
    if (item.isLoaded && item.colors && item.colors.length) {
      const colors = item.colors as unknown as OrderColorItem[]
      const colorItem = externalParams.value
        ? colors.find((c) => c.CLSEQ === externalParams.value.CLSEQ)
        : colors[0]
      await handleItemClick(2, colorItem)
      await nextTick()
      if (colorItem && colorItem.isLoaded && colorItem.steps && colorItem.steps.length) {
        await orderListRef.value?.setActiveCollapse(2, colorItem.CLSEQ)

        if (maxLevel === 3) {
          const step = colorItem.steps.find((s) => s.PMNO == externalParams.value.PMNO)
          await handleItemClick(3, step)
          await nextTick()
          if (step) {
            await orderListRef.value?.setActiveCollapse(3, step)
          }
        }
      }
    }
  }
}

const handleItemClick = async (level: number, item: any) => {
  if (loading.value || !item || item.isLoaded === true) return

  switch (level) {
    case 1:
      await handleLevel1LoadData(item)
      break
    case 2:
      await handleLevel2LoadData(item)
      break
    case 3:
      await handleLevel3LoadData(item)
      break
    case 4:
      break
  }
}

const handleLevel1LoadData = async (item: Order) => {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap.value['第二层颜色信息']
    const list = await searchList<OrderColorItem[]>({
      sql: formatString(remoteSql.DBQUERY, item.ORDSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })
    item.isLoaded = true
    item.colors = ref(list) as any
  } catch (e: any) {
    ElMessage.error(`查询颜色信息错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

const handleLevel2LoadData = async (item: OrderColorItem) => {
  if (loading.value) return
  loading.value = true
  try {
    const remoteSql = remoteSqlMap.value['第三层颜色下各加工合约的汇总信息']
    const list = await searchList<OrderStep[]>({
      sql: formatString(remoteSql.DBQUERY, item.ORDSEQ),
      params: {
        'PC.REFCLSEQ': item.CLSEQ
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    item.isLoaded = true
    item.steps = ref(list) as any
  } catch (e: any) {
    ElMessage.error(`查询加工合约信息错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

const handleLevel3LoadData = async (item: OrderStep) => {
  if (loading.value) return
  loading.value = true
  try {
    // $$SQL: `(PJ.ISMPS='Y' OR PJ.ISRCP='Y')`,
    const $$SQL = isShowAllJobFlow.value ? '' : `(PJ.ISMPS='Y' OR PJ.ISRCP='Y')`
    const remoteSql = remoteSqlMap.value['第四层合约下各工序的汇总信息']
    const list = await searchList<ProcessJobVO[]>({
      sql: formatString(remoteSql.DBQUERY, item.ORDSEQ),
      params: {
        $$SQL,
        'PC.REFCLSEQ': item.CLSEQ,
        'A.PMSEQ': item.PMSEQ
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    item.isLoaded = true
    item.list = ref(list) as any
  } catch (e: any) {
    ElMessage.error(`查询工序信息错误：${e.message || JSON.stringify(e)}`)
  } finally {
    loading.value = false
  }
}

const handleShowAllJobFlowChange = () => {
  if (orders.value.length > 0 && currentORDNO.value) {
    handleSearch(currentORDNO.value)
  }
}

parentScope.on('searchList:loadData', async (params) => {
  isExternalEmit.value = true
  if (params.ORDNO !== searchQuery.value) {
    externalParams.value = params
    searchQuery.value = params.ORDNO
    await handleSearch(searchQuery.value)
  } else {
    externalParams.value = params
    await autoShowFirstChild(orders.value[0] as unknown as Order, 3)
  }
  isExternalEmit.value = false
})

const subItemEmit = (type: string, data: any) => {
  emit('subItemClick', type, data)
}

onMounted(() => {
  remoteSqlMapLoader()
})

provide(TRACE_PANEL_INJECTION_KEY, {
  subItemEmit
})
</script>

<style lang="scss" scoped>
.order-trace {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #fff;

  .page-title {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #000;
  }

  .search-wrapper {
    margin-bottom: 10px;

    .search-title {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .search-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        padding: 4px;
      }
    }
  }
}
</style>
