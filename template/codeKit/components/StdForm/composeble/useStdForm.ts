import { getCurrentScope, inject, effectScope, provide } from 'vue'
import type { EffectScope, InjectionKey } from 'vue'
import { tryOnScopeDispose } from '@vueuse/core'
import type { StdFormProps } from '../types/stdForm'
import { StdFormStore } from '../types/store'
import { Storage } from '../utils/storage'

type Injection = StdFormStore | null | undefined
type Scope = (EffectScope & { stdFormId: string }) | undefined

export const StdFormKey: InjectionKey<StdFormStore> = Symbol('stdForm')

export function useStdForm(id?: string): StdFormStore
export function useStdForm(options?: StdFormProps): StdFormStore
export function useStdForm(idOrOpts?: any): StdFormStore {
  const storage = Storage.getInstance()
  const scope = getCurrentScope() as Scope

  const isObject = typeof idOrOpts === 'object'

  const options = isObject ? idOrOpts : { id: idOrOpts }

  const id = options.id
  const stdFormId = id ?? scope?.stdFormId

  let stdForm: Injection

  if (scope) {
    const injectedState = inject(StdFormKey, null)
    if (
      typeof injectedState !== 'undefined' &&
      injectedState !== null &&
      (!stdFormId || injectedState.id === stdFormId)
    ) {
      stdForm = injectedState
    }
  }

  if (!stdForm) {
    if (stdFormId) {
      stdForm = storage.get(stdFormId)
    }
  }

  if (!stdForm || (stdFormId && stdForm.id !== stdFormId)) {
    const name = id ?? storage.getId()

    const state = storage.create(name, options)

    stdForm = state

    const vfScope = scope ?? effectScope(true)

    vfScope.run(() => {
      tryOnScopeDispose(() => {
        if (stdForm) {
          const storeInstance = storage.get(stdForm.id)
          if (storeInstance) {
            storeInstance.$destroy()
          }
        }
      })
    })
  } else {
    if (isObject) {
      stdForm.setState(options)
    }
  }

  if (scope) {
    provide(StdFormKey, stdForm)
    scope.stdFormId = stdForm.id
  }

  return stdForm
}
