<template>
  <ResizeModal ref="rmRef" v-bind="attrs" @confirm="confirmEvent">
    <div v-if="isLoaded" class="flex flex-col h-full vxe-table--ignore-clear">
      <div class="flex-1 vxe-table--ignore-clear overflow-hidden">
        <el-scrollbar height="100%" :view-style="{ height: '100%' }">
          <el-tree
            ref="treeRef"
            class="w-full h-full outline-tree vxe-table--ignore-clear"
            :data="treeData"
            :expand-on-click-node="false"
            :default-expand-all="false"
            :node-key="props.valueKey"
            empty-text=" "
          >
            <!--            @node-click="handleNodeClick"-->
            <template #default="{ node }">
              <div class="custom-tree-node" @dblclick="() => handleNodeDblClick(node)">
                <div class="outline-label">
                  <!--                  <Icon class="text-[16px]" icon="ep:tickets" />-->
                  <span class="outline-label-text">{{ node.data[props.labelKey] }}</span>
                </div>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
    </div>
    <div v-else class="flex flex-col h-full vxe-table--ignore-clear" v-loading="true"></div>
  </ResizeModal>
</template>

<script setup lang="ts">
import { useAttrs, ref, computed } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import { getResizeModelExposeProxy } from '@/utils'
import useCommonTable from '@/hooks/nameson/useCommonTable'
import type { ResizeModalInstance } from '@/components/ResizeModal/types'
import { RefManager } from '@/hooks/nameson/useRefManager'
import { loadMessageByObjectName } from '@/plugins/vueI18n/lazyLoader'
import { ElMessageBox, ElTree } from 'element-plus'
import { Icon } from '@/components/Icon'
import { cloneDeep } from 'lodash-es'

export interface DialogTreePickerProps {
  objectName?: string
  manager: RefManager<any>
  valueKey: string
  labelKey: string
  parentKey: string
  sql: string | (() => string)
  sortBy?: string | (() => string)
  multi?: boolean
  leafOnly?: boolean
}

const props = defineProps<DialogTreePickerProps>()

const emit = defineEmits(['confirm'])
const attrs = useAttrs()

const rmRef = ref<ResizeModalInstance>()
const treeRef = ref<InstanceType<typeof ElTree>>()

const isLoaded = ref(false)

const { loading, data, loadData, setupParams } = useCommonTable({
  sql: props.sql,
  sortby: props.sortBy
})

const treeData = computed(() => {
  const dataSource = cloneDeep(data.value)

  // 创建哈希映射和结果树
  const map = new Map()
  const tree = []

  // 第一遍遍历：创建所有节点的映射并初始化children
  dataSource.forEach((item) => {
    const node = { ...item, children: [] }
    map.set(node[props.valueKey], node)
  })

  // 第二遍遍历：建立父子关系
  dataSource.forEach((item) => {
    const node = map.get(item[props.valueKey])
    const parentId = item[props.parentKey]

    if (parentId !== undefined && parentId !== null) {
      const parent = map.get(parentId)
      parent?.children?.push(node)
    } else {
      tree.push(node) // 没有parentId的作为根节点
    }
  })

  return tree
})

setupParams(() => {
  return () => {
    const params = {}
    if (props.manager.value) {
      Object.keys(props.manager.value).forEach((key) => {
        const value = props.manager.value[key]
        const queryKey = key
        params[queryKey] = value
      })
    }

    return params
  }
})

const onSearch = () => {
  loadData()
}

const onReset = () => {
  props.manager.reset()
}

const handleNodeClick = (node: any) => {
  const currNode = treeRef.value?.store.nodesMap[node[props.valueKey]]
  emit('confirm', node)
}

const handleNodeDblClick = (node: any) => {
  console.log(node)
  const currNode = treeRef.value?.store.nodesMap[node.key]
  if (currNode && currNode.isLeaf) {
    emit('confirm', node.data)
    rmRef.value?.close()
  }
}

const confirmEvent = () => {
  if (props.multi) {
    const result = treeRef.value?.getCheckboxRecords()
    if (result) {
      emit('confirm', result)
    }
  } else {
    const result = treeRef.value?.getRadioRecord()
    if (result) {
      emit('confirm', result)
    }
  }
}

const open = async () => {
  rmRef.value?.open()

  if (!isLoaded.value) {
    await load()
  }

  if (!data.value.length) await onSearch()
}

const load = async () => {
  if (!props.objectName) {
    isLoaded.value = true
    return
  }
  try {
    await loadMessageByObjectName(props.objectName)
    isLoaded.value = true
  } catch (e: any) {
    ElMessageBox.alert(`获取翻译失败：${e.message || JSON.stringify(e)}`, 'Error', {
      type: 'error'
    })
  }
}

defineExpose(
  getResizeModelExposeProxy(rmRef, {
    open
  })
)
</script>
