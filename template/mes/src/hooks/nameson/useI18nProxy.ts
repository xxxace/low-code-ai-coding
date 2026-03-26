import { useI18n } from 'vue-i18n'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'

export function useI18nProxy(scope: string) {
  const i18n = useI18n()

  return {
    t(key: string, value: any, replace?: any) {
      const tKey = `${scope}.${key}`
      const res = i18n.t(tKey, replace)
      return res === tKey ? i18n.t(value, replace) : res
    },
    c(text: string, ...args: any[]) {
      // eslint-disable-next-line prefer-spread
      const res = i18n.t.apply(i18n, args as any)
      return res === args[0] ? text : res
    }
  }
}

export function useStdFormI18n(scope?: string) {
  if (scope) return useI18nProxy(scope)
  return useI18nProxy(useStdForm().meta.objectName)
}
