import { ref, h, render as vueRender, createVNode, nextTick } from 'vue'
import { VNode, VNodeArrayChildren } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import { ResizeModalInstance, ModalProps } from '@/components/ResizeModal/types'
import { getMainApp } from '@/plugins/dialog/appContextShare'

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
}

export function useModal({
  component,
  componentProps,
  componentChildren,
  modalProps
}: UseModalProps) {
  modalProps = Object.assign({}, modalProps || {}, { showMinimize: true })

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
  const componentRef = ref()
  const modalRef = ref<ResizeModalInstance>()
  const modal = () => {
    return h(
      ResizeModal,
      { ...modalProps, ref: modalRef, noOverflow: true, onClose: unmount },
      {
        default: () =>
          h(
            component as VNode,
            { ...componentProps, ref: componentRef },
            (componentChildren as VNode[]) || []
          )
      }
    )
  }

  function render() {
    modalContainer = document.createElement('div')
    const vnode = createVNode(modal)
    const mainApp = getMainApp()
    if (!mainApp) throw new Error('app instance is not registered')
    vnode.appContext = mainApp._context
    vueRender(vnode, modalContainer)
    document.body.appendChild(modalContainer)

    setTimeout(() => {
      console.log(vnode, modalRef.value)
      modalRef.value?.open()
    }, 100)
  }

  async function unmount() {
    if (modalContainer) {
      modalRef.value?.close()
      await nextTick()
      vueRender(null, modalContainer)
      document.body.removeChild(modalContainer)
      modalContainer = null
    }
  }

  render()

  return {
    unmount
  }
}
