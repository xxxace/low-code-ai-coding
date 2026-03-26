<template>
  <div class="date-range-picker">
    <el-date-picker
      class="w-[190px]!"
      v-model:start="startDate"
      type="date"
      value-format="YYYY-MM-DD"
      :picker-options="startPickerOptions"
      :clearable="false"
      placeholder="Start Date"
    />
    <el-date-picker
      class="w-[190px]!"
      v-model:end="endDate"
      type="date"
      value-format="YYYY-MM-DD"
      :picker-options="endPickerOptions"
      :clearable="false"
      placeholder="End Date"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

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
  }
})

const emit = defineEmits(['update:start', 'update:end'])

const startDate = ref(props.start)
const endDate = ref(props.end)

watch(startDate, (val) => {
  emit('update:start', val)
  if (endDate.value && new Date(val).getTime() > new Date(endDate.value).getTime()) {
    endDate.value = ''
  }
})

watch(endDate, (val) => {
  emit('update:end', val)
  if (startDate.value && new Date(val).getTime() < new Date(startDate.value).getTime()) {
    startDate.value = ''
  }
})

const startPickerOptions = {
  disabledDate: (time) => {
    return endDate.value && time.getTime() > new Date(endDate.value).getTime()
  }
}

const endPickerOptions = {
  disabledDate: (time) => {
    return startDate.value && time.getTime() < new Date(startDate.value).getTime()
  }
}
</script>

<style scoped>
.date-range-picker {
  display: flex;
  gap: 10px;
}
</style>
