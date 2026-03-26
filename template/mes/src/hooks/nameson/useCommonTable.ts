import { ref, reactive, type Ref } from 'vue'
import { searchList } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'

export type Hooks<T> = {
  beforeRequest: (params: Record<string, any>) => void
  afterRequest: (list: T[]) => T[]
}

type Param = Record<string, any>

function getValue(val: string | (() => string)) {
  return typeof val === 'function' ? val() : val
}

export default function useCommonTable<T>({
  sql,
  sortby
}: {
  sql: string | (() => string)
  sortby?: string | (() => string)
}) {
  const data: Ref<T[]> = ref([])
  const loading = ref<boolean>(false)
  const params: Ref<Param> = ref({})
  const hooks = reactive<Hooks<T>>({
    beforeRequest: () => {},
    afterRequest: (list) => list
  })
  const sortbyStatment = ref(sortby || '')
  const sqlStatment = ref(sql || '')

  const getParams = (): Param => {
    return typeof params.value === 'function' ? params.value() : params.value
  }

  const setupParams = (getter: () => Param) => {
    params.value = getter()
  }

  const setSql = (sql: string | (() => string)) => {
    sqlStatment.value = sql
  }

  const setSortby = (sortby: string | (() => string)) => {
    sortbyStatment.value = sortby
  }

  const loadData = async () => {
    if (loading.value) return
    let resultData: T[] = []
    loading.value = true
    try {
      const params = getParams()
      hooks.beforeRequest(params)

      resultData = await searchList<T[]>({
        sql: getValue(sqlStatment.value),
        params,
        sortby: getValue(sortbyStatment.value)
      })
    } catch (e: any) {
      ElMessageBox.alert(`${e.message || JSON.stringify(e)}`, 'Error', {
        type: 'error'
      })
    }
    data.value = hooks.afterRequest(resultData)
    loading.value = false
  }

  const onBeforeRquest = (cb: (typeof hooks)['beforeRequest']) => {
    hooks.beforeRequest = cb
  }
  const onAfterRquest = (cb: (typeof hooks)['afterRequest']) => {
    hooks.afterRequest = cb
  }

  return {
    data,
    loading,
    setupParams,
    loadData,
    setSql,
    setSortby,
    onBeforeRquest,
    onAfterRquest
  }
}
