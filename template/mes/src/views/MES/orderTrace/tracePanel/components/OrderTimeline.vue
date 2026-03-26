<template>
  <div class="timeline-wrapper">
    <template v-for="item in props.colors" :key="item.name">
      <div class="current-item">
        <div class="current-item-header">
          <Icon icon="vi-ant-design:tags-outlined" :size="20" color="#105ef1" />
          <span class="inline-block mx-2">{{ item.name }}</span>
          <span>{{ item.size }}</span>
        </div>
        <div class="current-item-details-wrapper">
          <div class="current-item-details">
            <FieldItem label="材料需求数:" :width="60">
              <i class="current-item-details_value">999,999</i>
            </FieldItem>
            <FieldItem label="预留:" :width="44">
              <i class="current-item-details_value">999,999</i>
            </FieldItem>
            <FieldItem label="发料:" :width="30">
              <i class="current-item-details_value">999,999</i>
            </FieldItem>
            <FieldItem label="欠料:" :width="30">
              <i class="current-item-details_value">999,999</i>
            </FieldItem>
          </div>
          <div class="current-item-details">
            <FieldItem label="损耗:" :width="60">
              <i class="current-item-details_value">999,999</i>
            </FieldItem>
            <FieldItem label="损耗率:" :width="44">
              <i class="current-item-details_value">100%</i>
            </FieldItem>
          </div>
        </div>
      </div>

      <el-timeline>
        <el-timeline-item
          v-for="(step, index) in item.steps"
          :key="step.name"
          :type="getTimelineType(step.status)"
          :hollow="step.status === 'pending'"
          class="timeline-item"
        >
          <template #dot>
            <div class="bg-white h-[20px]">
              <Icon
                v-if="index < item.steps.length - 1"
                class="relative left-[-6px] top-[-4px]"
                icon="vi-lets-icons:done-ring-round"
                :size="20"
                color="#22c55e"
              />
              <Icon
                v-else
                class="relative left-[-6px] top-[-4px]"
                icon="vi-majesticons:clock-line"
                :size="20"
                color="#105ef1"
              />
            </div>
          </template>
          <div class="timeline-content">
            <div class="step-info">
              <h4 class="relative inline-block">
                <span>{{ step.name }}</span>
                <el-tag
                  class="status-tag"
                  size="small"
                  round
                  effect="dark"
                  :type="getStatusType(step.status)"
                >
                  {{ getStatusText(step.status) }}
                </el-tag>
              </h4>
              <p class="location">
                <div>
                  <FieldItem label="牌数:" :width="46">
                    <i class="number-value">999,999</i>
                  </FieldItem>
                  <FieldItem label="数量:" :width="46">
                    <i class="number-value">999,999</i>
                  </FieldItem>
                  <FieldItem label="待产数:" :width="46">
                    <i class="number-value">999,999</i>
                  </FieldItem>
                  <FieldItem label="在产数:" :width="46">
                    <i class="number-value">999,999</i>
                  </FieldItem>
                </div>
                <div>
                  <FieldItem label="完工数:" :width="46">
                    <i class="number-value">999,999</i>
                  </FieldItem>
                </div>
              </p>
              <el-button type="primary" size="small" link @click="step.showChild = !step.showChild">
                {{ step.showChild ? '收起' : '展开' }}
              </el-button>
              <div v-if="step.showChild" class="step-description">
                <el-timeline style="max-width: 600px; margin-top: 10px; font-size: 12px">
                  <el-timeline-item
                    v-for="(activity, index) in activities"
                    :key="index"
                    :color="activity.status === 'completed' ? '#67c23a' : ''"
                    :hollow="activity.status === 'pending'"
                    :class="[index === activities.length - 1 ? 'isLastChild' : 'isNotLastChild']"
                  >
                    <div class="sub-step-item relative inline-block">
                      <span>{{ activity.location }}</span>
                      <el-tag
                        class="status-tag2"
                        size="small"
                        round
                        effect="dark"
                        :type="getStatusType(activity.status)"
                      >
                        {{ getStatusText(activity.status) }}
                      </el-tag>
                      <el-button type="primary" size="small" link @click="clickItem(item,step,activity)">
                        <div class="flex items-center">
                          <Icon icon="vi-lsicon:list-outline" />
                          <span>查看明细</span>
                        </div>
                      </el-button>
                    </div>
                    <div class="details">
                      <div>
                        <FieldItem label="持单:" :width="40">
                          <i class="number-value">999,999</i>
                        </FieldItem>
                        <FieldItem label="在产:" :width="60">
                          <i class="number-value">999,999</i>
                        </FieldItem>
                      </div>
                      <div>
                        <FieldItem label="待产:" :width="40">
                          <i class="number-value">999,999</i>
                        </FieldItem>
                        <FieldItem label="生产时间:" :width="60">
                          <i class="date-value">{{ activity.timestamp }}</i>
                        </FieldItem>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@/components/Icon'
import type { Order, OrderStep, OrderColorItem } from '../index.vue'
import { TRACE_PANEL_INJECTION_KEY } from '../constant'
import { inject } from 'vue'

const props = defineProps<{
  root: Order
  colors: OrderColorItem[]
}>()

const TracePanelInjection = inject(TRACE_PANEL_INJECTION_KEY)

const activities = [
  {
    location: '缝盘 VN_SH14',
    status: 'completed',
    timestamp: '2018-04-12 20:46'
  },
  {
    location: '挑撞 VN_SH14',
    status: 'completed',
    timestamp: '2018-04-12 20:46'
  },
  {
    location: '洗水 VN_SH14',
    status: 'processing',
    timestamp: '2018-04-12 20:46'
  },
  {
    location: '查片 VN_SH14',
    status: 'pending',
    timestamp: '2018-04-12 20:46'
  }
]

const getTimelineType = (status: OrderStep['status']) => {
  switch (status) {
    case 'completed':
      return 'primary'
    case 'processing':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusType = (status: OrderStep['status']) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusText = (status: OrderStep['status']) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'processing':
      return '生产中'
    default:
      return '待开始'
  }
}

const clickItem = (color: any, ord: any, item: any) => {
  TracePanelInjection?.subItemEmit(props.root, color, ord, item)
}
</script>

<style lang="scss" scoped>
.timeline-wrapper {
  padding: 10px 10px 0;

  .current-item {
    margin-bottom: 10px;
    padding: 6px;
    background-color: #dbebff;
    border-radius: 8px;

    .current-item-header {
      display: flex;
      align-items: center;
      color: #000000;
      font-size: 13px;
      font-weight: bold;

      .icon {
        font-size: 18px;
      }
    }

    .current-item-details-wrapper {
      padding-left: 28px;

      .current-item-details {
        font-size: 12px;

        .field-item {
          font-size: 12px;

          .current-item-details_value {
            font-style: normal;
            color: #2688ef;
            min-width: 60px;
            max-width: 60px;
          }
        }

        //& > span {
        //  display: inline-block;
        //  margin-right: 10px;
        //
        //  i {
        //    font-style: normal;
        //    color: #2688ef;
        //  }
        //}
      }
    }
  }

  .current-location {
    margin-bottom: 10px;
    padding: 6px;
    background-color: #eff6ff;
    border-radius: 8px;
    color: #606266;
    font-size: 14px;
  }
}

:deep(.label-value-container) {
  line-height: 20px;

  .label {
    font-size: 12px;
  }
}

.number-value {
  font-style: normal;
  color: #2688ef;
  font-size: 12px;
}

.date-value {
  font-style: normal;
  color: #939393;
  font-size: 12px;
}

:deep(.el-timeline) {
  padding-inline-start: 20px;

  .el-timeline-item:not(:last-child) {
    padding-bottom: 16px;
  }

  .el-timeline-item__node {
    width: 8px;
    height: 8px;
    left: 0;
    background-color: #409eff;

    &.is-hollow {
      background-color: #fff;
      border-color: #409eff;
    }
  }

  .el-timeline-item__tail {
    left: 3px;
    border-left: 2px solid #e8edf0;
  }

  .el-timeline-item__wrapper {
    padding-left: 18px;
  }

  .el-timeline-item__timestamp {
    color: #727477;
    font-size: 13px;
    margin-top: 0;

    &.is-top {
      margin-bottom: 8px;
    }
  }
}

.timeline-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  .step-info {
    h4 {
      margin: -4px 0 0;
      font-size: 13px;
      font-weight: bold;
      color: #000000;
    }

    .location {
      margin: 0;
      padding: 2px 10px;
      font-size: 12px;
      border-radius: 8px;
      background-color: #eff6ff;
    }
  }

  .status-tag {
    position: absolute;
    right: -52px;
    top: 2px;
    padding: 0 6px;
    height: 20px;
    line-height: 20px;
    font-weight: normal;
    transform: scale(0.9);
  }

  .status-tag2 {
    padding: 0 6px;
    height: 20px;
    line-height: 20px;
    font-weight: normal;
    transform: scale(0.9);
  }
}

.sub-step-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  gap: 6px;
}

.isNotLastChild {
  :deep(.el-timeline-item__tail) {
    display: block !important;
  }
}

.details {
  .number-value, .date-value {
    min-width: 80px;
  }
}
</style>
