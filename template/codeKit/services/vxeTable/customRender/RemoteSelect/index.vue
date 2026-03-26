<template>
  <RemoteSelect
    v-if="currRow && currColumn"
    ref="remoteSelectRef"
    v-model="currRow[currColumn.field]"
    v-bind="attrs"
    :params="requestParams"
    :contentValue="currRow[attrs.contentKey]"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { computed, PropType, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'
import RemoteSelect from '@/components/RemoteSelect/index.vue'

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

const remoteSelectRef = ref<InstanceType<typeof RemoteSelect>>()
const currColumn = ref<VxeTableDefines.ColumnInfo>()
const currRow = ref()
const attrs = ref()
const parentId = ref()
const paramsGetter = ref()
const requestParams = ref()

const currentField = computed(() => currColumn.value?.field)

const load = () => {
  const { options, params } = props
  const { row, column } = params
  currRow.value = row
  currColumn.value = column
  const originAttrs = Object.assign({}, options.attrs || {})

  if (options.attrs) {
    delete options.attrs.valueMappings
  }

  parentId.value = originAttrs.parentId
  paramsGetter.value = originAttrs.params

  if (typeof paramsGetter.value !== 'function') {
    const obj_params = originAttrs.params
    paramsGetter.value = () => obj_params
    requestParams.value = paramsGetter.value(row)
  }
  delete originAttrs.parentId
  delete originAttrs.params

  attrs.value = originAttrs
}

const handleChange = async (_val, item) => {
  const valueMappings = attrs.value.valueMappings
  if (currColumn.value && valueMappings) {
    if (valueMappings && valueMappings.length > 0) {
      await nextTick()
      valueMappings.forEach((valueMapping) => {
        if (typeof valueMapping !== 'function') {
          const [targetKey, sourceKey] = valueMapping.split(':')
          currRow.value[targetKey] = item[sourceKey]
        } else {
          const [key, value] = valueMapping(currRow.value, item)
          currRow.value[key] = value
        }
      })
    }
  }
}

const getOptionCacheKey = () => {
  const { params } = props
  const rowid = params.rowid
  const key = `@remote-select-${rowid}-${params.column.id}`
  return key
}

watch(
  () => props.params,
  () => {
    load()
  },
  { immediate: true }
)

onMounted(() => {
  if (attrs.value.associated || parentId.value) {
    const associatedLink: VxeTableDefines.ColumnInfo[] = []

    const loadAssociatedLink = (columns: VxeTableDefines.ColumnInfo[]) => {
      for (const col of columns) {
        if (col.children) {
          loadAssociatedLink(col.children)
        } else if (
          col.editRender &&
          col.editRender.attrs &&
          col.editRender.attrs.parentId &&
          col.editRender.attrs.parentId === currentField.value
        ) {
          associatedLink.push(col)
        }
      }
    }

    watch(
      () => {
        const deps: any[] = []
        if (currColumn.value) {
          deps.push(currRow.value[parentId.value])
          if (currentField.value) deps.push(currRow.value[currentField.value])
        }
        return deps
      },
      () => {
        if (!associatedLink.length && props.params.$grid) {
          const columns = props.params.$grid.getColumns()
          loadAssociatedLink(columns)
        }

        if (associatedLink.length) {
          associatedLink.forEach((col) => {
            const row = currRow.value
            row[col.field] = undefined
            if (col.editRender && col.editRender.attrs) {
              const contentKey = col.editRender.attrs.contentKey
              if (contentKey) {
                row[contentKey] = undefined
              }

              const { params } = props
              const rowid = params.rowid
              const key = `@remote-select-${rowid}-${col.id}`
              if (col.params) delete col.params[key]
            }
          })
        }
      }
    )
  }

  if (parentId.value) {
    watch(
      () => parentId.value && currRow.value[parentId.value],
      () => {
        requestParams.value = paramsGetter.value(currRow.value)
      },
      { immediate: true }
    )
  }
})

const collectSelectOptions = () => {
  if (attrs.value.cacheId) return
  const options = remoteSelectRef.value?.getOptions()
  if (options && options.length > 0) {
    if (currColumn.value) {
      const key = getOptionCacheKey()
      currColumn.value.params = Object.assign(currColumn.value?.params || {}, { [key]: options })
    }
  }
}

onMounted(() => {
  if (attrs.value.cacheId) return
  if (currColumn.value) {
    if (currColumn.value.params) {
      const key = getOptionCacheKey()
      const options = currColumn.value.params[key]

      if (options && options.length) {
        setTimeout(() => {
          remoteSelectRef.value?.setOptions(options)
        }, 40)
      }
    }
  }
})

onBeforeUnmount(() => {
  collectSelectOptions()
})
</script>
