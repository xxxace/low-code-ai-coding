import { ElMessage, ElIcon } from 'element-plus'
import { Icon } from '@iconify/vue'

export const loadingMessage = (content: string) => {
  return ElMessage({
    type: 'info',
    duration: 0,
    icon: (
      <ElIcon class="is-loading">
        <Icon icon="ep:loading" />
      </ElIcon>
    ),
    message: content
  })
}
