<template>
  <span class="ns-label" :title="props.content" :style="styleComputed">
    {{ props.content }}{{ props.suffix }}
  </span>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  suffix: String,
  content: String,
  color: String,
  width: String,
})

const styleComputed = computed(() => {
  const isWidthWithUnit = isNaN(Number(props.width))

  return {
    color: props.color,
    width: isWidthWithUnit ? props.width : props.width + 'px',
  }
})
</script>

<style lang="scss" scoped>
.ns-label {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  margin-right: 4px;
}
</style>
