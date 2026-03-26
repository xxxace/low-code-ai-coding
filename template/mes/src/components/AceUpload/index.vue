<template>
  <div class="inline-block">
    <el-button v-if="!slots.trigger" size="small" :loading="props.loading" @click="handleClick">
      <component :is="'FileAddOutlined'" />
      <span>{{ props.label }}({{ maxSize }}M)</span>
    </el-button>
    <div v-else class="h-full" @click="handleClick">
      <slot name="trigger"></slot>
    </div>
    <div class="h-[0px] overflow-hidden">
      <label ref="labelRef" :for="unique_name"></label>
      <input
        class="file-input"
        type="file"
        :id="unique_name"
        :multiple="props.multiple"
        @change="handleFileChanged"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, computed, ref, useSlots } from 'vue'
import { stdFormContextKey } from '@/constants/key'

const props = withDefaults(
  defineProps<{
    label?: string
    size?: number
    multiple?: boolean
    loading?: boolean
  }>(),
  {
    label: '添加附件',
    size: 1024 * 1024 * 20,
    multiple: false
  }
)

const slots = useSlots()

const emit = defineEmits<{
  (e: 'change', files: FileInfo[]): void
}>()

const stdFormContext = inject(stdFormContextKey)

export interface FileInfo {
  name: string
  fullname: string
  base64: string
  type: string
  ext: string
}

const unique_name =
  'ace_upload_' +
  new Date().getTime() +
  Math.floor(Math.random() * 10) +
  '_' +
  Math.floor(Math.random() * 100) +
  '_' +
  Math.floor(Math.random() * 1000)

const labelRef = ref()
const maxSize = computed(() => props.size / 1024 / 1024)

const handleClick = () => {
  if (stdFormContext?.disabled) return
  labelRef.value && labelRef.value.click()
}

const handleFileChanged = async (e) => {
  const files = [...e.target.files]

  try {
    for (const file of files) {
      if (file.size > props.size) {
        throw new Error('文件大小超过限制,请选择小于' + maxSize.value + 'M的文件')
      }
    }
    const base64List = await Promise.all<FileInfo>(files.map(fileToBase64))
    emit('change', base64List)
  } catch (e: any) {
    console.log(e)
    alert(e.message)
  } finally {
    e.target.value = ''
  }
}

const fileToBase64 = (file: File): Promise<FileInfo> => {
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    const filename = file.name.substring(0, file.name.lastIndexOf('.'))
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1)
    reader.onload = () =>
      resolve({
        name: filename,
        fullname: file.name,
        base64: reader.result as string,
        type: file.type,
        ext: ext
      })
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}
</script>

<style lang="scss" scoped>
.file-input {
  width: 0;
  height: 0;
  opacity: 0;
}
</style>
