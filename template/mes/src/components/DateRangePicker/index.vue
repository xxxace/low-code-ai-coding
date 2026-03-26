<template>
  <div class="date-range-picker">
    <el-date-picker
      class="w-[190px]!"
      v-model="computedStartDate"
      :type="props.type"
      :format="formatPattern"
      :value-format="valuePattern"
      :editable="false"
      :placeholder="formatPattern"
      @panel-change="handleStartPanelChange"
    />
    <span class="separator">-</span>
    <el-date-picker
      class="w-[190px]!"
      v-model="computedEndDate"
      :type="props.type"
      :format="formatPattern"
      :value-format="valuePattern"
      :clearable="props.clearable"
      :editable="false"
      :placeholder="formatPattern"
      @panel-change="handleEndPanelChange"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getWeekNumber, getWeekRange } from './utils'
import dayjs from 'dayjs'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps({
  start: {
    type: String,
    required: true,
    default: ''
  },
  end: {
    type: String,
    required: true,
    default: ''
  },
  type: {
    type: String,
    default: 'date'
  },
  clearable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:start', 'update:end'])
const currMode = ref('')

const formatPattern = computed(() => {
  if (props.type === 'week') return 'YYYYww'
  if (props.type === 'month') return 'YYYY-MM'
  return 'YYYY-MM-DD'
})

const valuePattern = computed(() => {
  if (props.type === 'month') return 'YYYY-MM'
  return 'YYYY-MM-DD'
})

const computedStartDate = computed({
  get() {
    if (props.type === 'week') {
      return props.start ? getWeekRange(props.start).end : props.start
    }
    return props.start
  },
  set: useDebounceFn((val) => {
    // 只有鼠标点下的那一刻才允许赋值，不允许组件自身逻辑赋值
    if (currMode.value === 'month' || currMode.value === 'year') {
      currMode.value = ''
      return
    }

    val = val ? formartValue(val) : val

    let end = computedEndDate.value
    if (props.type === 'week') end = getWeekNumber(end)

    if (end && new Date(val).getTime() > new Date(end).getTime()) {
      emit('update:end', val)
      emit('update:start', end)
    } else {
      emit('update:start', val)
    }
  }, 10)
})

const computedEndDate = computed({
  get() {
    if (props.type === 'week') {
      return props.end ? getWeekRange(props.end).end : props.end
    }
    return props.end
  },
  set: useDebounceFn((val) => {
    // 只有鼠标点下的那一刻才允许赋值，不允许组件自身逻辑赋值
    if (currMode.value === 'month' || currMode.value === 'year') {
      currMode.value = ''
      return
    }
    val = val ? formartValue(val) : val

    let start = computedStartDate.value
      ? formartValue(computedStartDate.value)
      : computedStartDate.value
    if (props.type === 'week') start = getWeekNumber(start)

    if (val && start && new Date(val).getTime() < new Date(start).getTime()) {
      emit('update:end', start)
      emit('update:start', val)
    } else {
      emit('update:end', val)
    }
  }, 10)
})

const formartValue = (value, type) => {
  if (type === 'week') return getWeekNumber(value)
  return dayjs(value).format(valuePattern.value)
}

const handleStartPanelChange = (date, mode) => {
  currMode.value = mode
  computedStartDate.value = formartValue(date, props.type)
}
const handleEndPanelChange = (date, mode) => {
  currMode.value = mode
  computedEndDate.value = formartValue(date, props.type)
}
</script>

<style lang="scss" scoped>
.date-range-picker {
  display: flex;
  gap: 4px;

  :deep(.el-input) {
    .el-input__wrapper {
      .el-input__prefix {
        display: none !important;
      }

      .el-input__inner {
        &::placeholder {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
