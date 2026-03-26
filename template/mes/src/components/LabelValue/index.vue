<template>
  <div class="label-value-container">
    <div class="label" :style="{ width: `${props.labelWidth}px` }">
      {{ props.label }}
    </div>
    <div class="value">
      <slot>{{ props.value }}</slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  label: string
  value?: string | number
  labelWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  labelWidth: 100
})
</script>

<style scoped>
.label-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  color: #666;
  font-size: 14px;
  text-align: justify;
  text-align-last: justify;
  white-space: nowrap;
}

.value {
  color: #333;
  font-size: 14px;
}
</style> 