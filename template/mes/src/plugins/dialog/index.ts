import { ref, h, nextTick } from 'vue'
import { VNode, VNodeArrayChildren } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import { ResizeModalInstance, ModalProps } from '@/components/ResizeModal/types'
import { createChildApp } from '@/plugins/dialog/appContextShare'
import MsgMasterManager from './MsgMasterManager'
import type MsgSlaverManager from './MsgSlaverManager'
import type { MsgMasterEvents } from './MsgMasterManager'

export { setupMainApp } from '@/plugins/dialog/appContextShare'

type RawSlots = {
  [name: string]: unknown
  $stable?: boolean
}

type RawChildren = string | number | boolean | VNode | VNodeArrayChildren | (() => any)

type UseModalProps = {
  component: RawChildren | RawSlots
  componentProps?: Record<string, any>
  componentChildren?: Array<RawChildren | RawSlots>
  modalProps?: ModalProps
  params?: Record<string, any>
}

let hasRender = false

function bindEvents() {
  if (!hasRender) {
    hasRender = true
    window.addEventListener('message', async (event: MessageEvent) => {
      if (window.top === window.self) {
        const data =
          typeof event.data === 'string' ? (event.data ? JSON.parse(event.data) : {}) : event.data
        if (data.type === 'openModal') {
          useModal({
            modalProps: data.modalProps || {},
            componentProps: data.componentProps || {},
            // <iframe {...data.props} />
            component: () => h('iframe', { ...data.props })
          })
        }
      }
    })
  }
}

const MODAL_EXPOSE_KEY = '$$modalExpose'

// To-do:但组件为iframe时,无法跨窗口完全同步i18n状态,后续可考虑实现 2025-07-28 ace
export function useModal({
  component,
  componentProps,
  componentChildren,
  modalProps,
  params
}: UseModalProps) {
  modalProps = Object.assign({}, modalProps || {}, { showMinimize: true })
  // console.log('modalProps:', modalProps)
  if (window.top !== window.self) {
    const iframe = typeof component === 'function' ? component() : component
    window.parent.postMessage({
      type: 'openModal',
      props: iframe.props,
      modalProps,
      componentProps
    })
    return {}
  }

  let modalContainer: HTMLDivElement | null = null
  const events: MsgMasterEvents = {}
  const componentRef = ref()
  const modalRef = ref<ResizeModalInstance>()

  const componentRefSetter = (el) => {
    componentRef.value = el
    if (el) {
      new MsgMasterManager(el, events)
    }
  }
  const modal = () => {
    return h(
      ResizeModal,
      { ...modalProps, ref: modalRef, noOverflow: true, onClose: unmount },
      {
        default: () =>
          h(
            component as VNode,
            { ...componentProps, ref: componentRefSetter },
            (componentChildren as VNode[]) || []
          )
      }
    )
  }

  const app = createChildApp(modal)

  function render() {
    bindEvents()
    modalContainer = document.createElement('div')
    document.body.appendChild(modalContainer)
    app.mount(modalContainer)
    setTimeout(() => {
      modalRef.value?.open()
    }, 100)
  }

  async function unmount() {
    if (modalContainer) {
      modalRef.value?.close()
      await nextTick()
      app.unmount()
      document.body.removeChild(modalContainer)
      modalContainer = null
    }
  }

  render()

  const modalExpose = {
    unmount,
    on: (event: keyof MsgMasterEvents, handler) => (events[event] = handler),
    params: Object.assign({}, params || {})
  } as const

  window[MODAL_EXPOSE_KEY] = modalExpose

  return modalExpose
}

export function useModalExpose() {
  const ctx = window.top || window
  return ctx[MODAL_EXPOSE_KEY] as { unmount: () => Promise<void>; params: Record<string, any> }
}

export function useModalMsgSlaverManager() {
  return window['$$msgSlaverManager'] as MsgSlaverManager
}
