<template>
  <label
    class="i18n-label"
    :title="props.label"
    :style="`width:${props.width || 0}${props.unit || 'px'}`"
  >
    <span :class="{ required: props.required }">{{ props.label }}</span>
  </label>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  width: number
  unit?: string
  required?: boolean
}>()
</script>

<style lang="scss" scoped>
.i18n-label {
  position: relative;

  span.required {
    display: inline-block;
    position: relative;

    &::before {
      content: '*';
      display: inline-block;
      position: absolute;
      left: -6px;
      top: -2px;
      color: red;
    }
  }
}
</style>
