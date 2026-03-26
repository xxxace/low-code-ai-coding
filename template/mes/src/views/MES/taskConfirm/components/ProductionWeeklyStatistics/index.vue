<template>
  <div class="weekly-stack-card">
    <div class="weekly-stack-card-body">
      <!-- 上周数据块 -->
      <div class="week-block">
        <div class="data-row">
          <div class="data-item" v-for="item in lastWeekStatistics" :key="`last-${item.label}`">
            <span class="item-label">{{ item.label }}</span>
            <div class="item-value" :style="`${item.width ? `width:${item.width}px` : ''}`">
              <Icon v-if="props.loading" class="is-loading" icon="vi-ep:loading" />
              <template v-else>
                <span>{{ item.value }}</span>
                <span class="inline-block pl-1">{{ item.suffix }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
      <!-- 本周数据块 -->
      <div class="week-block">
        <div class="data-row">
          <div class="data-item" v-for="item in statistics" :key="`current-${item.label}`">
            <span class="item-label">{{ item.label }}</span>
            <div class="item-value" :style="`${item.width ? `width:${item.width}px` : ''}`">
              <Icon v-if="props.loading" class="is-loading" icon="vi-ep:loading" />
              <template v-else>
                <span>{{ item.value }}</span>
                <span class="inline-block pl-1">{{ item.suffix }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  loading: boolean
}>()

const lastWeekStatistics = ref([
  { label: '上周：任务数', field: 'NUM1', value: '', suffix: '条', width: 80 },
  { label: '派工数', field: 'NUM2', value: '', suffix: '条', width: 80 },
  { label: '目标件数', field: 'PSQTY', value: '', suffix: '件', width: 110 },
  { label: '完工件数', field: 'WIPQTY', value: '', suffix: '件', width: 110 },
  { label: '生产进度', field: 'PCT1', value: '', suffix: '%', width: 60 },
  { label: '时间进度', field: 'PCT2', value: '', suffix: '%', width: 60 },
  { label: '良品率', field: 'PCT3', value: '', suffix: '%', width: 60 },
  { label: '返工率', field: 'PCT4', value: '', suffix: '%', width: 60 },
  { label: '生产负荷', field: 'PCT5', value: '', suffix: '%', width: 60 },
  { label: '计划达成率', field: 'PCT6', value: '', suffix: '%', width: 60 }
])
const statistics = ref([
  { label: '本周：任务数', field: 'NUM1', value: '', suffix: '条', width: 80 },
  { label: '派工数', field: 'NUM2', value: '', suffix: '条', width: 80 },
  { label: '目标件数', field: 'PSQTY', value: '', suffix: '件', width: 110 },
  { label: '完工件数', field: 'WIPQTY', value: '', suffix: '件', width: 110 },
  { label: '生产进度', field: 'PCT1', value: '', suffix: '%', width: 60 },
  { label: '时间进度', field: 'PCT2', value: '', suffix: '%', width: 60 },
  { label: '良品率', field: 'PCT3', value: '', suffix: '%', width: 60 },
  { label: '返工率', field: 'PCT4', value: '', suffix: '%', width: 60 },
  { label: '生产负荷', field: 'PCT5', value: '', suffix: '%', width: 60 },
  { label: '计划达成率', field: 'PCT6', value: '', suffix: '%', width: 60 }
])

const updateLastWeekStatistics = (data) => {
  if (!data) data = {}
  lastWeekStatistics.value.forEach((item) => {
    const value = data[item.field]
    item.value = value || value === 0 ? value : '-'
  })
}

const updateCurrentWeekStatistics = (data) => {
  if (!data) data = {}
  statistics.value.forEach((item) => {
    const value = data[item.field]
    item.value = value || value === 0 ? value : '-'
  })
}

defineExpose({
  updateLastWeekStatistics,
  updateCurrentWeekStatistics
})
</script>

<style scoped>
.weekly-stack-card {
  background: #fff;
}

.weekly-stack-card-body {
  padding: 6px;
  background-color: #eef2f6;
  border-radius: 8px;
  box-sizing: border-box;
}

.week-block {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:not(:last-child) {
    margin-bottom: 6px;
  }
}

.data-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 6px;
}

.item-label {
  font-size: 14px;
  color: #676767;
  font-weight: bold;
}

.item-value {
  font-size: 18px;
  color: #222;
  font-weight: bold;
  text-align: right;
}
</style>
