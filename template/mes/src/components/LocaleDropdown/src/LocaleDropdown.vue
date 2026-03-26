<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { useLocaleStore } from '@/store/modules/locale'
import { useLocale } from '@/hooks/web/useLocale'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { loadingMessage } from '@/components/Message/loading'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('locale-dropdown')

defineProps({
  color: propTypes.string.def('')
})

const loading = ref(false)
const localeStore = useLocaleStore()

const langMap = computed(() => localeStore.getLocaleMap)

const currentLang = computed(() => localeStore.getCurrentLocale)

const setLang = async (lang: LocaleType) => {
  if (loading.value || lang === unref(currentLang).lang) return
  // 需要重新加载页面让整个语言多初始化
  // window.location.reload()
  loading.value = true
  const loadingInstance = loadingMessage('Loading...')
  try {
    localeStore.setCurrentLocale({
      lang
    })
    const { changeLocale } = useLocale()
    await changeLocale(lang)
  } catch (e) {
    console.log(e)
  } finally {
    loadingInstance.close()
    loading.value = false
  }
}

function clearSelection() {
  if (window.getSelection) {
    // 获取当前的文本选择对象
    const selection = window.getSelection()
    // 清除所有的文本选择范围
    selection && selection.removeAllRanges()
  } else if ((document as any).selection) {
    // 对于 IE，使用 document.selection
    ;(document as any).selection.empty()
  }
}

const handleClick = () => {
  clearSelection()
}
</script>

<template>
  <ElDropdown :class="[prefixCls, 'h-full']" trigger="click" @command="setLang" :disabled="loading">
    <div class="custom-hover">
      <Icon
        :size="18"
        icon="vi-ion:language-sharp"
        class="cursor-pointer !p-0"
        :class="$attrs.class"
        :color="color"
        @click="handleClick"
      />
    </div>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-for="item in langMap"
          :class="[currentLang.lang === item.lang ? 'active-drop-down-item' : '']"
          :key="item.lang"
          :command="item.lang"
        >
          {{ item.name }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style lang="scss">
.active-drop-down-item {
  position: relative;
  color: var(--el-color-primary) !important;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 3px;
    height: 14px;
    background-color: var(--el-color-primary);
    transform: translateY(-50%);
  }
}
</style>
