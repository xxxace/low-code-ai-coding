// import { onBeforeMount, Ref } from 'vue'
// import { StdFormHooks } from '../types'
import { createExtendedEventHook } from '../utils/createExtendedEventHook'

export function createHooks() {
  return {
    // 初始化hooks
    beforeInit: createExtendedEventHook(),
    init: createExtendedEventHook(undefined, true, true),
    afterInit: createExtendedEventHook(),
    initDone: createExtendedEventHook(),

    // 提交hooks
    beforeSubmit: createExtendedEventHook(undefined, true, true),
    collectSubmitData: createExtendedEventHook(undefined, true, true),
    validateSubmission: createExtendedEventHook(undefined, true, true),
    checkChanged: createExtendedEventHook(undefined, true, true),
    customValidate: createExtendedEventHook(undefined, true, true),
    submit: createExtendedEventHook(undefined, true, true),
    preData: createExtendedEventHook(),
    postData: createExtendedEventHook(),
    afterSubmit: createExtendedEventHook(),

    // 删除hooks
    beforeDelete: createExtendedEventHook(undefined, true, true),
    delete: createExtendedEventHook(undefined, true, true),
    afterDelete: createExtendedEventHook(),

    // 修改状态hooks
    beforeChangeStatus: createExtendedEventHook(undefined, true, true),
    changeStatus: createExtendedEventHook(undefined, true, true),
    afterChangeStatus: createExtendedEventHook(),

    createURLParams: createExtendedEventHook(undefined, true, true),
    customActionClick: createExtendedEventHook(),

    // 回滚hooks
    beforeRollback:createExtendedEventHook(undefined, true, true),
    rollback: createExtendedEventHook(undefined, true, true),
    afterRollback:createExtendedEventHook(),
  }
}

// export function useHooks(emit: (...args: any[]) => void, hooks: Ref<StdFormHooks>) {
//   onBeforeMount(() => {
//     for (const [key, value] of Object.entries(hooks.value)) {
//       const listener = (data: any) => {
//         emit(key, data)
//       }

//       value.fns.add(listener)
//     }
//   })
// }
