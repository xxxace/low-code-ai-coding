<template>
    <vxe-select v-if="currRow && currColumn" :class="[align]" :disabled="attrs.disabled || editableDisabled"
        v-model="model" v-bind="attrs" :title="displayLabel" @clear="onClear" @change="onChange" />
</template>

<script lang="ts" setup>
import { PropType, ref, computed, inject, ComputedRef } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'

const props = defineProps({
    options: {
        type: Object as PropType<VxeGlobalRendererHandles.RenderDefaultOptions>,
        default: () => ({})
    },
    params: {
        type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
        default: () => ({})
    }
})

const currColumn = ref<VxeTableDefines.ColumnInfo>()
const editableDisabled = inject<ComputedRef<boolean>>('editableTableDisabled')
const currRow = ref()
const attrs = ref({})
const align = ref('left')

// 计算属性：获取当前选中的值
const model = computed({
    get() {
        return currColumn.value ? currRow.value[currColumn.value.field] : undefined
    },
    set(val) {
        currRow.value[currColumn.value!.field] = val
    }
})

// 计算属性：获取当前选中项的显示文本
const displayLabel = computed(() => {
    if (!model.value || !attrs.value.options) return ''

    const options = attrs.value.options
    const valueField = attrs.value.optionProps?.value || 'value'
    const labelField = attrs.value.optionProps?.label || 'label'

    // 处理多选情况
    if (attrs.value.multiple && Array.isArray(model.value)) {
        return model.value
            .map(val => {
                const option = options.find((opt: any) => opt[valueField] === val)
                return option ? option[labelField] : val
            })
            .join(', ')
    }

    // 处理单选情况
    const option = options.find((opt: any) => opt[valueField] === model.value)
    return option ? option[labelField] : model.value
})

/**
 * 加载组件配置和数据
 */
const load = () => {
    const { options, params } = props
    const { row, column } = params

    currRow.value = row
    currColumn.value = column
    const $attrs = options.attrs || {}
    align.value = $attrs.align || 'left'
    delete $attrs.align
    attrs.value = { ...$attrs }

    attrs.value.optionProps = options.optionProps || { value: 'value', label: 'label' }
    attrs.value.options = options.options || []
}

/**
 * 处理清除事件
 */
const onClear = (evnt: any) => {
    // 清除时将值设为 undefined
    currRow.value[currColumn.value!.field] = undefined
}

/**
 * 处理值变更事件
 */
const onChange = (evnt: any) => {
    const { value } = evnt
    currRow.value[currColumn.value!.field] = value
}

// 初始化加载
load()
</script>

<style lang="scss" scoped>
.right {
    text-align: right;

    :deep(.vxe-select--inner) {
        text-align: right;
    }
}
</style>