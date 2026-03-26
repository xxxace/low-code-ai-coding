import { reactive, watchEffect } from 'vue'
import { useI18nProxy } from './useI18nProxy'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'

export function useI18nReactive<T extends object>(init: (proxy: { t: any; c: any }) => T) {
  let r: any
  const stdForm = useStdForm()
  const { t, c } = useI18nProxy(stdForm.meta.objectName)

  watchEffect(() => {
    const updateValue = init({ t, c })

    if (r) {
      if (Object.prototype.toString.call(r) === '[object Array]') {
        ;(updateValue as T[]).forEach((item: any, index: number) => {
          Object.assign(r[index], item)
        })
      } else {
        Object.assign(r, updateValue)
      }
    } else {
      r = reactive(updateValue)
    }
  })

  return r as T
}

export function createI18nReactive(objectName: string) {
  return function useI18nReactive<T extends object>(init: (proxy: { t: any; c: any }) => T) {
    let r: any
    const { t, c } = useI18nProxy(objectName)

    watchEffect(() => {
      const updateValue = init({ t, c })

      if (r) {
        if (Object.prototype.toString.call(r) === '[object Array]') {
          ;(updateValue as T[]).forEach((item: any, index: number) => {
            Object.assign(r[index], item)
          })
        } else {
          Object.assign(r, updateValue)
        }
      } else {
        r = reactive(updateValue)
      }
    })

    return r as T
  }
}
