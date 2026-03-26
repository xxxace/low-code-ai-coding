import type { Directive, App, VNode, DirectiveBinding } from 'vue'
import { useNamesonUserStore } from '@/store/modules/ns-user'
import './permission.css'

export type Permission = 'ADD' | 'AUD' | 'UPD' | 'DEL' | 'QRY'

function setDisabled(el: HTMLElement) {
  if (!el.classList.contains('no-permission')) el.classList.add('no-permission')
  if (!el.classList.contains('is-disabled')) el.classList.add('is-disabled')
  el.style.pointerEvents = 'none'
  el.style.cursor = 'not-allowed'
  // @ts-ignore
  el.disabled = true
}

function validatePermission(
  el: HTMLElement,
  binding: DirectiveBinding<Permission[]>,
  vnode: VNode
) {
  if (binding.value && binding.value.length) {
    const userStore = useNamesonUserStore()
    const { appContext } = (vnode as VNode & { ctx: VNode }).ctx
    const route = appContext?.config.globalProperties.$route
    const objectId = route?.meta.objectId
    if (objectId) {
      const currentPage = userStore.permissionList.find((item) => item.OBJECTID === objectId)
      if (!currentPage) {
        setDisabled(el)
      } else {
        const hasPermission = binding.value.some(
          (item: Permission) => currentPage[`IS${item}`] === 'Y'
        )
        if (!hasPermission) setDisabled(el)
      }
    }
  }
}

const permissionDirective: Directive<HTMLElement, Permission[]> = {
  mounted(el, binding, vnode) {
    validatePermission(el, binding, vnode)
  },
  updated(el, binding, vnode) {
    validatePermission(el, binding, vnode)
  }
}

export default {
  install(app: App) {
    app.directive('permission', permissionDirective)
  }
}
