import { onActivated, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStdForm } from '../composeble/useStdForm'
import { createHandler, editHandler, setupData, type DefaultValueItem } from './initHandler'
import { ElMessageBox } from 'element-plus'
import { useFetchSqlByRoute } from '@/hooks/nameson/useFetchSql'
import { StdFormAction } from '../types/store'

export function initRegister() {
  const route = useRoute()
  const stdForm = useStdForm()
  const remoteSqlMap = useFetchSqlByRoute()
  const currentId = ref<any>(null)

  stdForm.onBeforeInit(() => {
    console.log('before init')
  }, true)

  stdForm.onInit(async (id) => {
    console.log('init', id)
    currentId.value = id
    if (id) {
      return await editHandler(id, stdForm)
    } else {
      return createHandler(stdForm)
    }
  })

  stdForm.onAfterInit((res) => {
    console.log('after init', res)
  }, true)

  stdForm.registerInit(async (id) => {
    console.log('register init', id)
    let isSuccess = false
    try {
      await stdForm.emits.beforeInit()
      stdForm.loading = true
      const result = ((await stdForm.emits.init(id))[0] || []) as DefaultValueItem[]
      stdForm.loading = false
      await stdForm.emits.afterInit(result as any)
      setupData(stdForm, result)
      setTimeout(() => {
        stdForm.emits.initDone()
      })
      isSuccess = true
    } catch (e: any) {
      console.log(e)
      ElMessageBox.alert(`${e.message || JSON.stringify(e)}`, 'Error', {
        type: 'error'
      })

      isSuccess = false
    } finally {
      stdForm.loading = false
    }
    return isSuccess
  })

  stdForm.onInitDone(() => {
    const { relationRegister } = stdForm
    const root = relationRegister.root
    const manager = relationRegister.getNestedProperty(root!.relation, 'manager')
    stdForm.orderStatus = manager.value.STFG
  })

  stdForm.onBeforeRollback(() => {
    console.log('onBeforeRollback')
  })

  stdForm.onAfterRollback(() => {
    console.log('onAfterRollback')
  })

  stdForm.registerRollback(async () => {
    try {
      await stdForm.emits.beforeRollback()
      if (stdForm.actionType !== StdFormAction.EDIT) {
        await stdForm.reset()
      } else {
        const seq = currentId.value
        const isInitSuccess = await stdForm.init(seq)

        if (isInitSuccess && isInitSuccess[0]) {
          stdForm.actionType = StdFormAction.RADEONLY
        } else {
          return
        }
      }
      setTimeout(async () => {
        await stdForm.emits.afterRollback()
      })
    } catch (e: any) {
      console.log(e)
      ElMessageBox.alert(`${e.message || JSON.stringify(e)}`, 'Error', {
        type: 'error'
      })
    }
  })

  const init = (id?: any) => {
    if (currentId.value === id) return
    currentId.value = id
    stdForm.init(id)
  }

  onActivated(() => {
    if (route.query.id) {
      init(route.query.id)
    }
  })

  watch(remoteSqlMap, () => {
    route.query.id && init(route.query.id)
  })
}
