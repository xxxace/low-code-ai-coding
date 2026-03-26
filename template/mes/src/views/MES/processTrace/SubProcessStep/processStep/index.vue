<template>
  <div class="process-step">
    <el-card class="step-card" shadow="hover">
      <div class="step-title">
        <span>{{ step.JOBNO1 }} {{ step.CNAME }}</span>
      </div>
      <div>总件数: {{ toFixedPlus(step.PMQTY, 2) }}</div>
      <div class="step-doing my-1">
        待产数: <span>{{ toFixedPlus(step.DC_QTY, 2) }}</span>
      </div>
      <div class="step-doing my-1">
        生产中: <span class="blue">{{ toFixedPlus(step.ZC_QTY, 2) }}</span>
      </div>
      <div class="step-done mb-2">
        已完成: <span class="green">{{ toFixedPlus(step.YSC_QTY, 2) }}</span>
      </div>
      <el-tooltip class="box-item" effect="dark" content="生产进度" placement="top">
        <el-progress class="my-progress" color="#67c23a" :percentage="step.PCT || 0" />
      </el-tooltip>

      <template v-if="step.pass">
        <div class="step-done mt-1">
          <span class="inline-block mr-1">良品率:</span>
          <span class="green">{{ step.pass }}%</span>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { toFixedPlus } from '@/utils'

defineProps({
  step: {
    type: Object,
    required: true
  },
  showArrow: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.step-card {
  --el-card-padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  //min-width: 120px;
  cursor: pointer;
}

.process-step {
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.step-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.step-doing .blue {
  color: var(--el-color-primary);
}

.step-done .green {
  color: var(--el-color-success);
}

:deep(.el-progress) {
  :deep(.el-progress__text) {
    min-width: 0;
  }
}
</style>
