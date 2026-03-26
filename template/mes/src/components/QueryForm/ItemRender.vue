<template>
  <el-input
    v-if="props.type === 'input'"
    v-model="model[fieldStr]"
    v-bind="props.props"
    size="small"
    :style="`width: ${width}`"
  />
  <el-select
    v-else-if="props.type === 'select'"
    v-model="model[fieldStr]"
    v-bind="props.props"
    :options="toValue(props.options)"
    size="small"
    :style="`width: ${width}`"
  />
  <RemoteSelect
    v-else-if="props.type === 'remoteSelect'"
    v-model="model[fieldStr]"
    v-bind="props.props"
    :disabled="formContext?.disabled"
    :style="`width: ${width}`"
  />
  <el-date-picker
    v-else-if="props.type === 'ranger'"
    type="daterange"
    v-bind="props.props"
    v-model="dateRangerModel"
    value-format="YYYY-MM-DD"
    size="small"
    :style="`width: ${width}`"
  />
</template>

<script setup lang="ts">
import { onMounted, computed, inject } from 'vue'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { formContextKey } from 'element-plus'

export type QueryFormItem = {
  label: string
  field: string
  type: 'input' | 'select' | 'ranger' | 'remoteSelect'
  suffix?: 'like' | 'gt' | 'gte' | 'lt' | 'lte' | 'is'
  options?: () => { label: string; value: string }[] | { label: string; value: string }[]
  props?: Record<string, any>
  width?: number
  defaultValue?: any
}

const model = defineModel<Record<string, any>>({ required: true })
const props = defineProps<QueryFormItem>()

const formContext = inject(formContextKey)

const fieldStr = computed(() =>
  props.suffix && props.type !== 'ranger' ? `${props.field}__${props.suffix}` : props.field
)
const width = computed(() => {
  if (props.type === 'ranger') return `${props.width || 166}px`
  return `${props.width || 120}px`
})

const dateRangerModel = computed({
  get() {
    const ranger: string[] = []
    const start = model.value[fieldStr.value + '__gte@date']
    const end = model.value[fieldStr.value + '__lte@date']
    if (start) ranger.push(start)
    if (end) ranger.push(end)
    return ranger
  },
  set(dateStrings: [string, string]) {
    const newValue = dateStrings || props.defaultValue
    model.value[fieldStr.value + '__gte@date'] = newValue[0]
    model.value[fieldStr.value + '__lte@date'] = newValue[1]
  }
})

const init = () => {
  if (props.defaultValue !== undefined && props.defaultValue !== null) {
    if (props.type === 'ranger') {
      dateRangerModel.value = props.defaultValue
    } else {
      Reflect.set(model.value, fieldStr.value, props.defaultValue)
    }
  } else if (props.type === 'ranger') {
    dateRangerModel.value = ['', '']
  } else {
    Reflect.set(model.value, fieldStr.value, '')
  }
}
type ValueOrFunction<T> = T | (() => T)
const toValue = <T,>(val: ValueOrFunction<T>): T => {
  return typeof val === 'function' ? (val as () => T)() : val
}

onMounted(init)

defineExpose({
  init
})
</script>

<style>
.el-range-editor .el-input__wrapper {
  padding: 0 2px;
}
</style>
