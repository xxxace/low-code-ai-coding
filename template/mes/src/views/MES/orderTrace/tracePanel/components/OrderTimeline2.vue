<template>
  <div class="timeline-wrapper">
    <el-collapse v-model="activeOrders" accordion>
      <el-collapse-item
        v-for="item in props.colors"
        :key="item.CLSEQ"
        :name="item.CLSEQ"
        class="order-item"
        @click.stop="(e) => handleItemClick(e, item)"
      >
        <template #title>
          <div class="current-item">
            <div class="current-item-header">
              <Icon icon="vi-ant-design:tags-outlined" :size="20" color="#105ef1" />
              <!--              <span class="inline-block mx-2">{{ item.ORDNO }}</span>-->
              <span class="inline-block ml-2">{{ item.CCL }}</span>
              <span class="inline-block mx-2">{{ item.ECL }}</span>
            </div>
            <div class="current-item-details-wrapper">
              <div class="current-item-details">
                <FieldItem label="生产数量:" :width="48">
                  <i class="current-item-details_value">{{ toFixedPlus(item.ORDQTY, 2) }}</i>
                </FieldItem>
                <el-button type="primary" size="small" link @click.stop="clickColorItem(item)">
                  <div class="flex items-center">
                    <Icon icon="vi-lsicon:list-outline" color="#0952eb" />
                    <span>查看色号明细</span>
                  </div>
                </el-button>
                <!--                <FieldItem label="预留:" :width="30">-->
                <!--                  <i class="current-item-details_value">999,999</i>-->
                <!--                </FieldItem>-->
                <!--                <FieldItem label="发料:" :width="44">-->
                <!--                  <i class="current-item-details_value">999,999</i>-->
                <!--                </FieldItem>-->
              </div>
              <!--              <div class="current-item-details">-->
              <!--                <FieldItem label="欠料:" :width="64">-->
              <!--                  <i class="current-item-details_value">999,999</i>-->
              <!--                </FieldItem>-->
              <!--                <FieldItem label="损耗:" :width="30">-->
              <!--                  <i class="current-item-details_value">999,999</i>-->
              <!--                </FieldItem>-->
              <!--                <FieldItem label="损耗率:" :width="44">-->
              <!--                  <i class="current-item-details_value">100%</i>-->
              <!--                </FieldItem>-->
              <!--              </div>-->
            </div>
          </div>
        </template>

        <template v-if="!item.isLoaded && props.loading">
          <div class="flex items-center gap-2">
            <Icon icon="vi-svg-spinners:bars-rotate-fade" color="#2688ef" />
            <span>数据加载中</span>
          </div>
        </template>
        <template v-else-if="(!item.steps || !item.steps.length) && item.isLoaded">
          <div class="flex items-center gap-2">
            <span>数据为空</span>
          </div>
        </template>
        <el-timeline v-else-if="item.isLoaded" class="mt-2!">
          <el-timeline-item
            v-for="step in item.steps"
            :key="step.PMSEQ"
            :name="step.PMSEQ"
            :type="getTimelineType(step.STFG)"
            :hollow="step.STFG === 'BL_D'"
            class="timeline-item"
          >
            <!--            <template #dot>-->
            <!--              <div class="bg-white h-[20px]">-->
            <!--                <Icon-->
            <!--                  v-if="index < item.steps.length - 1"-->
            <!--                  class="relative left-[-6px] top-[-4px]"-->
            <!--                  icon="vi-lets-icons:done-ring-round"-->
            <!--                  :size="20"-->
            <!--                  color="#22c55e"-->
            <!--                />-->
            <!--                <Icon-->
            <!--                  v-else-->
            <!--                  class="relative left-[-6px] top-[-4px]"-->
            <!--                  icon="vi-majesticons:clock-line"-->
            <!--                  :size="20"-->
            <!--                  color="#105ef1"-->
            <!--                />-->
            <!--              </div>-->
            <!--            </template>-->
            <div class="timeline-content">
              <div class="step-info">
                <h4 :data-pmno="step.PMNO" class="relative inline-block">
                  <el-tag
                    class="status-tag"
                    size="small"
                    round
                    effect="dark"
                    :type="getStatusType(step.STFG)"
                  >
                    {{ getStatusText(step.STFG) }}
                  </el-tag>

                  <span>合约号：{{ step.PMNO }}</span>

                  <FieldItem label="合约日期:" :width="56">
                    <i class="date-value" style="font-weight: normal">{{
                      step.PMDT ? dayjs(step.PMDT).format('YYYY-MM-DD') : ''
                    }}</i>
                  </FieldItem>
                </h4>
                <el-collapse ref="stepCollapseRef" accordion>
                  <el-collapse-item
                    :key="step.PMNO"
                    :name="step.PMNO"
                    class="order-item2"
                    @click.stop="() => handleSubItemClick(step)"
                  >
                    <template #title>
                      <div class="location">
                        <div>
                          <FieldItem label="牌数:" :width="46">
                            <i class="number-value">{{ toFixedPlus(step.TKTQTYS, 2) }}</i>
                          </FieldItem>
                          <FieldItem label="数量:" :width="28">
                            <i class="number-value">{{ toFixedPlus(step.PMQTY, 2) }}</i>
                          </FieldItem>
                          <FieldItem label="待产数:" :width="46">
                            <i class="number-value">{{ toFixedPlus(step.UNRECQTY, 2) }}</i>
                          </FieldItem>
                          <FieldItem label="在产数:" :width="46">
                            <i class="number-value">{{ toFixedPlus(step.HSRECQTY, 2) }}</i>
                          </FieldItem>
                        </div>
                        <div>
                          <FieldItem label="完工数:" :width="46">
                            <i class="number-value">{{ toFixedPlus(step.FINISHQTY, 2) }}</i>
                          </FieldItem>
                        </div>
                      </div>
                    </template>
                  </el-collapse-item>
                </el-collapse>

                <!--                <el-button type="primary" size="small" link @click.stop="()=>handleSubItemClick(step)">-->
                <!--                  {{ step.showChild ? '收起' : '展开' }}-->
                <!--                </el-button>-->
                <div v-if="step.showChild" class="step-description">
                  <template v-if="!step.isLoaded && props.loading">
                    <div class="flex items-center gap-2">
                      <Icon icon="vi-svg-spinners:bars-rotate-fade" color="#2688ef" />
                      <span>数据加载中</span>
                    </div>
                  </template>
                  <template v-else-if="(!step.list || !step.list.length) && step.isLoaded">
                    <div class="flex items-center gap-2">
                      <span>数据为空</span>
                    </div>
                  </template>
                  <el-timeline
                    v-else-if="step.isLoaded"
                    style="max-width: 600px; margin-top: 10px; font-size: 12px"
                  >
                    <el-timeline-item
                      v-for="(process, index) in step.list"
                      :key="process.PMSEQ + '-' + process.JOBNO"
                      :name="process.PMSEQ + '-' + process.JOBNO"
                      :color="process.STFGNAME === '已完成' ? '#67c23a' : ''"
                      :hollow="process.STFG === 'BL_D'"
                      :class="[index === step.list.length - 1 ? 'isLastChild' : 'isNotLastChild']"
                    >
                      <div class="sub-step-item relative inline-block">
                        <span>工序：{{ process.JOBNO }} {{ process.CNAME }}</span>
                        <el-tag
                          class="status-tag2"
                          size="small"
                          round
                          effect="dark"
                          :type="getStatusType2(process.STFGNAME)"
                        >
                          <span>{{ process.STFGNAME }}</span>
                          <Percentage :percentage="calcPercentage(process)" />
                        </el-tag>
                        <el-button
                          type="primary"
                          size="small"
                          link
                          @click="clickItem(item, step, process)"
                        >
                          <div class="flex items-center">
                            <Icon icon="vi-lsicon:list-outline" />
                            <span>查看收发明细</span>
                          </div>
                        </el-button>
                      </div>
                      <div class="details">
                        <div>
                          <FieldItem label="持单:" :width="30">
                            <i class="number-value">{{ toFixedPlus(process.CD_QTY, 2) }}</i>
                          </FieldItem>
                          <FieldItem label="在产:" :width="30">
                            <i class="number-value">{{ toFixedPlus(process.ZC_QTY, 2) }}</i>
                          </FieldItem>
                          <FieldItem label="待产:" :width="30">
                            <i class="number-value">{{ toFixedPlus(process.DC_QTY, 2) }}</i>
                          </FieldItem>
                          <FieldItem label="已产:" :width="30">
                            <i class="number-value">{{ toFixedPlus(process.YSC_QTY, 2) }}</i>
                          </FieldItem>
                        </div>
                        <div>
                          <FieldItem label="开始时间:" :width="54">
                            <i class="date-value">{{
                              process.BETDT ? dayjs(process.BETDT).format('YYYY-MM-DD HH:MM') : ''
                            }}</i>
                          </FieldItem>
                          <FieldItem label="结束时间:" :width="80">
                            <i class="date-value">{{
                              process.ENDDT ? dayjs(process.ENDDT).format('YYYY-MM-DD HH:MM') : ''
                            }}</i>
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
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@/components/Icon'
import type { Order, OrderStep, OrderColorItem } from '../index.vue'
import { TRACE_PANEL_INJECTION_KEY } from '../constant'
import { inject, nextTick, ref } from 'vue'
import { toFixedPlus } from '@/utils/Sqlutils/utils'
import dayjs from 'dayjs'
import Percentage from './Percentage.vue'
import type { ProcessJobVO } from '$types/views/MES/orderTrac'
import { ElCollapse } from 'element-plus'

const props = defineProps<{
  root: Order
  colors: OrderColorItem[]
  loading?: boolean
}>()

const emits = defineEmits(['itemClick'])

const TracePanelInjection = inject(TRACE_PANEL_INJECTION_KEY)

const activeOrders = ref<string[]>([])

const stepCollapseRef = ref<InstanceType<typeof ElCollapse>[]>([])

const getTimelineType = (status: string) => {
  switch (status) {
    case 'BL_F':
      return 'primary'
    case 'BL_A':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'BL_F':
      return 'success'
    case 'BL_A':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusType2 = (status: string) => {
  switch (status) {
    case '已完成':
      return 'success'
    case '生产中':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  // return status
  switch (status) {
    case 'BL_A':
      return '批核'
    case 'BL_C':
      return '取消'
    case 'BL_D':
      return '草拟'
    case 'BL_S':
      return '草拟'
    case 'BL_F':
      return '完成'
  }
}

const calcPercentage = (process: ProcessJobVO) => {
  return process.CD_QTY ? toFixedPlus(((process.YSC_QTY || 0) / process.CD_QTY) * 100, 2) : 0
}

const clickItem = (color: any, ord: any, item: any) => {
  TracePanelInjection?.subItemEmit('1', { root: props.root, color, ord, item })
}

const clickColorItem = (color: any) => {
  TracePanelInjection?.subItemEmit('2', { color })
}

const handleItemClick = (e: MouseEvent, item: OrderColorItem) => {
  emits('itemClick', 2, item)
}

const handleSubItemClick = (step: OrderStep) => {
  Reflect.set(step, 'showChild', !step.showChild)

  if (step.showChild) {
    emits('itemClick', 3, step)
  }
}

const queryOffsetParent = (element: HTMLElement, className: string) => {
  let targetElement
  let offsetParent: HTMLElement | null = element.offsetParent as HTMLElement

  while (offsetParent) {
    console.log(offsetParent.classList, className)
    if (offsetParent.classList.contains(className)) {
      targetElement = offsetParent
      break
    }
    offsetParent = offsetParent.offsetParent as HTMLElement
  }

  return targetElement
}

defineExpose({
  setActiveCollapse: (value) => {
    activeOrders.value = [value]
  },
  setStepItemActive: async (step) => {
    let isOpened = false
    for (let i = 0; i < stepCollapseRef.value.length; i++) {
      const item = stepCollapseRef.value[i]
      if (item.activeNames.includes(step.PMNO)) {
        isOpened = true
        break
      }
    }

    if (!isOpened) {
      const color = props.colors.find((c) => c.CLSEQ == (activeOrders.value[0] as any))
      if (color && color.steps) {
        let targetIndex = -1
        color.steps.some((s, i) => {
          if (s.PMNO === step.PMNO) {
            targetIndex = i
            return true
          }
        })

        if (targetIndex > -1) {
          stepCollapseRef.value[targetIndex].setActiveNames([step.PMNO])
        }
      }

      Reflect.set(step, 'showChild', true)
      await nextTick()
      const pmnoEl = document.querySelector(`[data-pmno="${step.PMNO}"]`) as HTMLElement
      if (pmnoEl) {
        const wrapper = queryOffsetParent(pmnoEl, 'el-timeline-item')
        const container = queryOffsetParent(pmnoEl, 'order-list')
        if (wrapper && container) {
          container.scrollTo({
            top: wrapper.offsetTop,
            left: 0,
            behavior: 'smooth'
          })
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.timeline-wrapper {
  padding: 10px 10px 0;

  :deep(.el-collapse) {
    --el-collapse-header-height: auto !important;

    .el-collapse-item__header {
      padding: 0 10px 0 0 !important;
      background-color: #dbebff !important;
    }
  }

  .current-item {
    padding: 6px;
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
      text-align: left;
      padding-left: 28px;

      .current-item-details {
        font-size: 12px;

        .field-item {
          font-size: 12px;

          .current-item-details_value {
            text-align: left;
            font-style: normal;
            color: #2688ef;
            min-width: 60px;
            max-width: 60px;
          }
        }
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
  min-width: 50px;
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

  .timeline-item:last-child {
    padding-bottom: 0;
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
      //background-color: #eff6ff;
      text-align: left;
    }
  }

  .status-tag {
    position: relative;
    //right: -52px;
    top: -2px;
    padding: 0 6px;
    margin-right: 4px;
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
  .number-value,
  .date-value {
    min-width: 64px;
  }
}

.field-item {
  font-size: 12px;
}

.order-item {
  :deep(.el-collapse) {
    --el-collapse-header-height: auto !important;

    .el-collapse-item__header {
      padding: 0 10px 0 0 !important;
      background-color: #eff6ff !important;
    }
  }
}
</style>
