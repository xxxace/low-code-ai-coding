import isequal from 'lodash.isequal'
import { Coldatasource } from './DataModelTypes'

export function diffItem(
  newVal: Coldatasource[] = [],
  oldVal: Coldatasource[] | null,
  isSameItem: (a: any, b: any) => boolean = () => true
): [Coldatasource | null, Coldatasource | null][] {
  if (!oldVal) oldVal = []
  const originIsSameItem = isSameItem

  // 自定义相等比较函数
  isSameItem = (a, b) => (!a && !b ? false : originIsSameItem(a || {}, b || {}))

  // 有删除有新增
  if (newVal.length && oldVal.length) {
    return computeDiff(newVal, oldVal, isSameItem)
  } else if (newVal.length) {
    // 全新增
    return newVal.map((item) => [item, null])
  } else if (oldVal.length) {
    // 全删除
    return oldVal.map((item) => [null, item])
  }
  return []
}

// 计算差异的核心逻辑
function computeDiff(
  newVal: Coldatasource[],
  oldVal: Coldatasource[],
  isSameItem: (a: any, b: any) => boolean
): [Coldatasource | null, Coldatasource | null][] {
  const diffList: [Coldatasource | null, Coldatasource | null][] = []
  let newStartIndex = 0
  let oldStartIndex = 0
  let newEndIndex = newVal.length - 1
  let oldEndIndex = oldVal.length - 1

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    const newStartItem = newVal[newStartIndex]
    const newEndItem = newVal[newEndIndex]
    const oldStartItem = oldVal[oldStartIndex]
    const oldEndItem = oldVal[oldEndIndex]

    if (!newStartItem) {
      newStartIndex++
    } else if (!newEndItem) {
      newEndIndex--
    } else if (!oldStartItem) {
      oldStartIndex++
    } else if (!oldEndItem) {
      oldEndIndex--
    } else if (isSameItem(newStartItem, oldStartItem)) {
      handleItemDiff(newStartItem, oldStartItem, diffList)
      newStartIndex++
      oldStartIndex++
    } else if (isSameItem(newEndItem, oldEndItem)) {
      handleItemDiff(newEndItem, oldEndItem, diffList)
      newEndIndex--
      oldEndIndex--
    } else if (isSameItem(newEndItem, oldStartItem)) {
      handleItemDiff(newEndItem, oldStartItem, diffList)
      newEndIndex--
      oldStartIndex++
    } else if (isSameItem(newStartItem, oldEndItem)) {
      handleItemDiff(newStartItem, oldEndItem, diffList)
      newStartIndex++
      oldEndIndex--
    } else {
      // 找不到匹配项，遍历 oldVal 查找
      let foundMatch = false
      for (let i = oldStartIndex; i <= oldEndIndex; i++) {
        const currentItem = oldVal[i]
        if (isSameItem(currentItem, newStartItem)) {
          // 在旧的里面找到了且不同则为修改
          if (!isequal(currentItem, newStartItem)) {
            diffList.push([newStartItem, currentItem])
          }
          foundMatch = true
          oldVal[i] = null // 标记为已处理
          break
        }
      }
      if (!foundMatch) {
        // 如果没有找到匹配项，则为新增
        diffList.push([newStartItem, null])
      }
      newStartIndex++
    }
  }

  // 处理剩余的新增项
  addRemainingItems(newVal, newStartIndex, newEndIndex, diffList)
  // 处理剩余的删除项
  addRemainingItems(oldVal, oldStartIndex, oldEndIndex, diffList, true)

  return diffList
}

// 处理项的差异
function handleItemDiff(
  newItem: Coldatasource,
  oldItem: Coldatasource,
  diffList: [Coldatasource | null, Coldatasource | null][]
) {
  if (!isequal(newItem, oldItem)) {
    diffList.push([newItem, oldItem])
  }
}

// 添加剩余项
function addRemainingItems(
  items: Coldatasource[],
  startIndex: number,
  endIndex: number,
  diffList: [Coldatasource | null, Coldatasource | null][],
  isOld: boolean = false
) {
  for (let i = startIndex; i <= endIndex; i++) {
    if (isOld) {
      items[i] && diffList.push([null, items[i]])
    } else {
      items[i] && diffList.push([items[i], null])
    }
  }
}
