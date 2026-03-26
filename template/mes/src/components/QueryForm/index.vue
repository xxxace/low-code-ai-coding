<template>
  <el-form :disabled="props.disabled">
    <div class="ace-query-form">
      <el-space :size="4">
        <template v-for="item in props.main" :key="item.field">
          <el-form-item :label="item.label" :label-width="props.labelCol?.style.width">
            <ItemRender ref="itemRenderRef" v-bind="item" v-model="model" />
          </el-form-item>
        </template>
        <el-form-item>
          <el-space>
            <el-button type="primary" size="small" @click="query">
              <Icon icon="vi-ant-design:search-outlined" />
              <span>查询</span>
            </el-button>
            <el-button size="small" @click="reset">
              <Icon icon="vi-ant-design:clear-outlined" />
              <span>重置</span>
            </el-button>
            <el-button
              v-if="props.expanded.length"
              type="primary"
              text
              size="small"
              @click="isExpandMore = !isExpandMore"
            >
              <span class="mr-1"> {{ isExpandMore ? '收起' : '展开' }}</span>
              <template v-if="isExpandMore">
                <Icon icon="ant-design:up-outlined" />
              </template>
              <template v-else>
                <Icon icon="ant-design:down-outlined" />
              </template>
            </el-button>
          </el-space>
        </el-form-item>
      </el-space>

      <div>
        <el-space v-if="isExpandMore" wrap :size="4">
          <template v-for="item in props.expanded" :key="item.field">
            <el-form-item :label="item.label" :label-width="props.labelCol?.style.width">
              <ItemRender ref="itemRenderRef" v-bind="item" v-model="model" />
            </el-form-item>
          </template>
        </el-space>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { Icon } from '@/components/Icon'
import ItemRender, { type QueryFormItem } from './ItemRender.vue'

export type QueryFormConfig = {
  disabled?: boolean
  main: QueryFormItem[]
  expanded: QueryFormItem[]
  labelCol?: { style: { width: string } }
}

const model = defineModel<Record<string, any>>({ required: true })
const props = withDefaults(defineProps<QueryFormConfig>(), {
  main: () => [],
  expanded: () => []
})

const emit = defineEmits(['update:modelValue', 'query', 'reset'])

const itemRenderRef = ref<typeof ItemRender | null>(null)
const isExpandMore = ref(false)

const query = () => {
  emit('query')
}

const reset = () => {
  if (itemRenderRef.value) {
    itemRenderRef.value.forEach((item: typeof ItemRender) => {
      item.init()
    })
  }

  emit('reset')
}
</script>

<style lang="scss" scoped>
.ace-query-form {
  margin-bottom: 4px;
  box-sizing: border-box;

  :deep(.el-row) {
    flex-wrap: nowrap;
  }
}

:deep(.el-form-item) {
  margin-bottom: 0 !important;

  .el-form-row {
    flex-wrap: nowrap;
  }
}
</style>
