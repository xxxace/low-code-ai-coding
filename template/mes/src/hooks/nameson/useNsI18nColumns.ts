import { ref, computed } from 'vue'
import { useI18nProxy } from './useI18nProxy'

/**
 * 表格列国际化hook，支持列的动态操作和翻译
 * @param {object} options - 配置选项
 * @param {string} options.scope - 国际化命名空间前缀
 * @param {Array} options.columns - 原始列配置数组
 * @returns {object} 包含翻译后列和操作方法的对象
 */
export function useNsI18nColumns<T>({ scope, columns }) {
  const { t } = useI18nProxy(scope)

  const columnsRef = ref([...columns])

  const traverseColumns = (cols: any[]) => {
    const newCols: any[] = []
    cols.forEach((col) => {
      const newCol = { ...col }
      if (newCol.children) {
        newCol.children = traverseColumns(newCol.children)
      } else if (col.i18nKey) {
        newCol.title = t(col.i18nKey, col.title)
      }
      newCols.push(newCol)
    })

    return newCols
  }

  const translatedColumns = computed(() => {
    return traverseColumns(columnsRef.value)
  })

  return translatedColumns as T

  // return {
  //   columns: translatedColumns,
  //   addColumn: (newColumn) => columnsRef.value.push({ ...newColumn }),
  //   removeColumn: (index) => columnsRef.value.splice(index, 1),
  //   updateColumn: (index, updates) => {
  //     columnsRef.value[index] = { ...columnsRef.value[index], ...updates };
  //   },
  // };
}
