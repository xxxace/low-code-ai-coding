import { MaybeRef, onMounted, Ref, ref, toValue, watch, toRef } from 'vue'
import { cloneDeep } from 'lodash-es'
import { createEventHook } from '@vueuse/core'
import dayjs from 'dayjs'

export type RowInitializer<T> = (
  row: T,
  utils: { getMax: (key: any) => number; now: typeof dayjs }
) => T

export function useDataTable<T>() {
  const triger: any = ref(null)
  const dataSource = ref<T[]>([]) as Ref<T[]>
  const fullData = ref<T[]>([]) as Ref<T[]>
  const visibleData = ref<T[]>([]) as Ref<T[]>
  const insertRecords = ref<T[]>([]) as Ref<T[]>
  const updateRecords = ref<T[]>([]) as Ref<T[]>
  const deleteRecords = ref<T[]>([]) as Ref<T[]>
  const filters = ref<Ref<Partial<T>>>({} as Ref<Partial<T>>)
  const paramsCahche = ref<Ref<Partial<T>>>({} as Ref<Partial<T>>)
  const maxKey = ref(0)
  const currentRow = ref<T | null>()

  const onRemove = createEventHook<T | T[]>()
  const onCurrentRowChange = createEventHook<T>()
  const rowInitializer = ref<RowInitializer<T>>((row: T) => row)
  const arrayProxy = ref<InstanceType<typeof Proxy> | null>()

  function init() {
    initData()
    initRecords()
    paramsCahche.value = {}
  }

  function initData() {
    maxKey.value = 0
    dataSource.value = []
    fullData.value = []
    visibleData.value = []
  }

  function initRecords() {
    insertRecords.value = []
    updateRecords.value = []
    deleteRecords.value = []
  }

  function reset() {
    init()
    clearFilter()
  }

  function loadData(data: MaybeRef<T[]>) {
    initData()
    initRecords()
    triger.value = data
    dataSource.value = toValue(data)
    const dataCopy = cloneDeep(dataSource.value)

    arrayProxy.value = new Proxy(dataCopy, {
      set(target, key, value) {
        return Reflect.set(target, key, value)
      }
    })
    processNewRows(dataCopy)
    fullData.value = dataCopy
    visibleData.value = dataCopy

    if (Object.keys(paramsCahche.value).length) {
      filter()
    }
  }

  function getTableData() {
    return {
      fullData: cloneDeep(fullData.value),
      visibleData: cloneDeep(visibleData.value)
    }
  }

  function processNewRows(rows: T[]) {
    rows.forEach((row) => {
      maxKey.value += 1
      row['@@index'] = maxKey.value
    })

    return rows
  }

  async function insert(record?: Partial<T> | Partial<T>[]) {
    const newRows: T[] = []
    if (!record) {
      newRows.push({} as T)
    } else if (record instanceof Array) {
      newRows.push(...(record as T[]))
    } else {
      newRows.push(record as T)
    }

    for (const row of newRows) {
      row['@@index'] = maxKey.value += 1
      await rowInitializer.value(row, { getMax: getMax, now: dayjs })
      fullData.value.push(row)
      insertRecords.value.push(row)
      filter()
    }

    return newRows
  }

  async function insertAt(records: Partial<T> | Partial<T>[], row?: Partial<T> | 0 | -1) {
    let index = 0
    if (row === null || row === undefined) {
      index = 0
    } else if (typeof row !== 'number') {
      index = fullData.value.findIndex((r) => r['@@index'] === row!['@@index']) + 1
    } else {
      index = row
    }

    const newRows = (records instanceof Array ? records : [records]) as T[]

    let rowIndex = 0
    for (const row of newRows) {
      row['@@index'] = maxKey.value += 1
      await rowInitializer.value(row, { getMax: getMax, now: dayjs })
      if (index === -1) {
        fullData.value.splice(fullData.value.length, 0, row)
      } else {
        fullData.value.splice(index + rowIndex, 0, row)
      }

      insertRecords.value.push(row)
      filter()
      rowIndex++
    }

    return newRows
  }

  function update(row) {}

  function query(validator: (row: T) => boolean) {
    return visibleData.value.filter(validator)
  }

  function getMax(key: keyof T) {
    const max = visibleData.value.reduce((prev, next) => {
      if (prev < Number(next[key])) return Number(next[key])
      return prev
    }, 0)

    return max || 0
  }

  async function remove(row: T | T[] | number) {
    let index = -1
    if (typeof row === 'number') {
      if (row < 0 || row >= visibleData.value.length) return
      row = visibleData.value.find((r, i) => i === row)!
    }

    if (!(row instanceof Array)) {
      row = [row]
    }

    const success: T[] = []
    const fail: T[] = []
    for (const item of row) {
      index = fullData.value.findIndex((r) => r['@@index'] === item['@@index'])
      if (index < 0 || index >= fullData.value.length) {
        fail.push(item)
        continue
      }
      fullData.value.splice(index, 1)

      success.push(item)
    }

    filter()

    deleteRecords.value.push(...success)
    onRemove.trigger(success)

    return { rows: success, fail }
  }

  function revertData() {
    loadData(dataSource.value)
  }

  function setFilter(key: string, value: any) {
    filters.value[key] = value
  }

  function clearFilter(key?: string) {
    if (key) Reflect.deleteProperty(filters.value, key)
    else filters.value = {}
  }

  function filter(params?: Partial<T>) {
    if (!params) {
      if (Object.keys(paramsCahche.value).length) {
        params = paramsCahche.value
      } else {
        visibleData.value = fullData.value
        return
      }
    } else {
      paramsCahche.value = { ...params }
    }

    const filteredData = fullData.value.filter((item) => {
      const baseFlag = Object.keys(filters.value).every((key) => item[key] === filters.value[key])
      return baseFlag && Object.keys(params).every((key) => item[key] === params[key])
    })

    visibleData.value = filteredData
  }

  function setCurrentRow(row?: T) {
    if (currentRow.value === row) {
      return
    }

    currentRow.value = row
    onCurrentRowChange.trigger(row)
  }

  function getCurrentRecord() {
    return currentRow.value
  }

  function setRowInitializer(initializer: RowInitializer<T>) {
    rowInitializer.value = initializer
  }

  watch(
    visibleData,
    () => {
      setCurrentRow(visibleData.value[0])
    },
    { immediate: true }
  )

  onMounted(() => {
    // 用于监测数据源是否变化，变化则重置
    watch(
      () => triger.value?.value,
      () => {
        loadData(triger.value)
      }
    )
  })

  return toRef({
    init,
    loadData,
    getTableData,
    insert,
    insertAt,
    update,
    query,
    remove,
    revertData,
    filter,
    setFilter,
    clearFilter,
    setCurrentRow,
    setRowInitializer,
    onRemove: onRemove.on,
    onCurrentRowChange: onCurrentRowChange.on,
    getCurrentRecord,
    currentRow
  })
}
