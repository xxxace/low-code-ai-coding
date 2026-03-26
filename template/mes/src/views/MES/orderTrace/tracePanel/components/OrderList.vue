<template>
  <div class="order-list relative" v-loading="props.orderLoading">
    <el-collapse v-model="activeOrders" accordion>
      <el-collapse-item
        v-for="order in props.orders"
        :key="order.ORDSEQ"
        :name="order.ORDSEQ"
        class="order-item"
        :disabled="props.loading"
        @click.native="(e) => handleItemClick(e, order)"
      >
        <template #title>
          <div class="order-header">
            <div class="order-info">
              <div>
                <span class="order-no"> 批号: {{ order.ORDNO }} </span>
                <span class="customer">客户: {{ order.CLNTNAME }}</span>
              </div>
              <div class="mt-1">
                <FieldItem label="针种:" :width="28">
                  <i class="number-value">{{ order.EQMCAT }}</i>
                </FieldItem>
                <FieldItem label="电机针种:" :width="64">
                  <i class="number-value">{{ order.EQMMOD }}</i>
                </FieldItem>
                <FieldItem label="订单数量:" :width="64">
                  <i class="number-value">{{ toFixedPlus(order.ORDQTY, 2) }}</i>
                </FieldItem>
              </div>
            </div>
          </div>
        </template>

        <template v-if="!order.isLoaded && props.loading">
          <div class="flex items-center gap-2">
            <Icon icon="vi-svg-spinners:bars-rotate-fade" color="#2688ef" />
            <span>数据加载中</span>
          </div>
        </template>
        <order-timeline
          v-else-if="order.isLoaded"
          ref="orderTimelineRef"
          :loading="props.loading"
          :root="order"
          :colors="order.colors"
          @item-click="handleSubItemClick"
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue'
// import OrderTimeline from './OrderTimeline.vue'
import OrderTimeline from './OrderTimeline2.vue'
import type { Order } from '../index.vue'
import { OrderColorItem } from '@/views/MES/orderTrace/tracePanel/index.vue'
import { toFixedPlus } from '@/utils/Sqlutils/utils'

const props = defineProps<{
  loading?: boolean
  orderLoading?: boolean
  orders: Array<Order & { isLoaded: boolean }>
}>()

const emits = defineEmits(['itemClick'])

const orderTimelineRef = ref<InstanceType<typeof OrderTimeline>>()
const activeOrders = ref<string>('')

const handleItemClick = (e: MouseEvent, item: Order) => {
  emits('itemClick', 1, item)
}

const handleSubItemClick = (level: number, item: OrderColorItem) => {
  emits('itemClick', level, item)
}

defineExpose({
  setActiveCollapse: async (level: number, value: any) => {
    if (level === 1) {
      activeOrders.value = [value]
    } else if (level === 2) {
      await nextTick()
      orderTimelineRef.value[0]?.setActiveCollapse(value)
    } else if (level === 3) {
      await nextTick()
      orderTimelineRef.value[0]?.setStepItemActive(value)
    }
  }
})
</script>

<style lang="scss" scoped>
.order-item {
  :deep(.el-collapse-item__header) {
    box-sizing: border-box;
  }
}

.order-list {
  :deep(.el-collapse) {
    border: none;
    --el-collapse-border-color: #ebeef5;
    --el-collapse-header-height: auto;
  }

  :deep(.el-collapse-item) {
    &:not(:last-child) {
      margin-bottom: 10px;
    }

    .el-collapse-item__header {
      padding: 10px;
      font-size: 14px;
      background-color: #dee2e6;
      border: none;
      border-radius: 8px;

      .el-collapse-item__arrow {
        margin: 0 0 0 auto;
        font-size: 12px;
        color: #909399;
      }

      .el-icon {
        font-size: 20px;
        color: #484849;
      }
    }

    .el-collapse-item__wrap {
      border: none;
    }

    .el-collapse-item__content {
      padding: 0;
    }
  }

  .order-header {
    width: 100%;
    display: flex;
    //align-items: center;
    //justify-content: space-between;

    .order-info {
      display: flex;
      flex-direction: column;
      text-align: left;

      .order-no {
        font-size: 14px;
        color: #000000;
        font-weight: 600;
        margin-right: 10px;
      }

      .customer {
        font-size: 12px;
        color: #606266;
      }
    }
  }
}

.number-value {
  font-style: normal;
  color: #2688ef;
  font-size: 12px;
}

.field-item {
  font-size: 12px;
}
</style>
