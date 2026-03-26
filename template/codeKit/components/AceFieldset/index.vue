<template>
  <fieldset
    :class="['ace-fieldset', { absolute }]"
    :style="`--ace-fieldset-width:${props.width}${typeof props.width === 'number' ? 'px' : ''}`"
  >
    <legend v-if="!slots.legend && props.legend">{{ props.legend }}</legend>
    <legend v-else>
      <slot name="legend"></slot>
    </legend>
    <div
      :class="['ace-fieldset-body', { absolute }]"
      :style="`--ace-fieldset-body-width:${props.width}${typeof props.width === 'number' ? 'px' : ''}`"
    >
      <slot></slot>
    </div>
  </fieldset>
</template>

<script lang="ts" setup>
import { useSlots } from 'vue'

interface AceFieldsetProps {
  legend?: string
  width?: number | string
  absolute?: boolean
}

const props = withDefaults(defineProps<AceFieldsetProps>(), {
  width: '100%'
})

const slots = useSlots()
</script>

<style lang="scss" scoped>
.ace-fieldset {
  --ace-fieldset-width: 100%;
  border: 1px solid #d6d6d6;
  white-space: nowrap;
  box-sizing: border-box;
  width: var(--ace-fieldset-width);
  line-height: 16px;
  position: relative;
  margin: 0;
  padding: 2px;
  display: block;

  &.absolute {
    padding: 0;
  }

  legend {
    margin: 0 8px;
    font-size: 12px;
    font-weight: bold;
  }

  .ace-fieldset-body {
    --ace-fieldset-body-width: 100%;
    display: block;
    width: var(--ace-fieldset-body-width);
    height: 100%;
    box-sizing: border-box;

    &.absolute {
      padding: 0 2px 2px;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
}
</style>
