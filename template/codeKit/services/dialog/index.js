import {ref, h, nextTick} from 'vue'
import ResizeModal from '../../components/ResizeModal/index.vue'
import {createChildApp} from './appContextShare.js'
import MsgMasterManager from './messageManager'

export {setupMainApp as setuoDialogMainApp} from './appContextShare.js'

let hasRender = false

function bindEvents() {
    if (!hasRender) {
        hasRender = true
        window.addEventListener('message', async (event) => {
            if (window.top === window.self) {
                const data =
                    typeof event.data === 'string' ? (event.data ? JSON.parse(event.data) : {}) : event.data
                if (data.type === 'openModal') {
                    useModal({
                        modalProps: data.modalProps || {},
                        componentProps: data.componentProps || {},
                        // <iframe {...data.props} />
                        component: () => h('iframe', {...data.props})
                    })
                }
            }
        })
    }
}

const MODAL_EXPOSE_KEY = '$$modalExpose'

// To-do:当组件为iframe时,无法跨窗口完全同步i18n状态,后续可考虑实现 2025-07-28 ace
export function useModal({
                             component,
                             componentProps,
                             componentChildren,
                             modalProps,
                             params
                         }) {
    modalProps = Object.assign({}, modalProps || {}, {showMinimize: true})
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

    let modalContainer = null
    const events = {}
    const componentRef = ref()
    const modalRef = ref()

    const componentRefSetter = (el) => {
        componentRef.value = el
        if (el) {
            let originDisconnected = () => {
            }
            if (events.disconnected) {
                originDisconnected = events.disconnected
            }
            events.disconnected = () => {
                originDisconnected()
                unmount()
            }
            new MsgMasterManager(el, events)
        }
    }
    const modal = () => {
        return h(
            ResizeModal,
            {...modalProps, ref: modalRef, noOverflow: true, onClose: unmount},
            {
                default: () =>
                    h(
                        component,
                        {...componentProps, ref: componentRefSetter},
                        componentChildren || []
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
        }, 50)
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
        on: (event, handler) => events[event] = handler,
        params: Object.assign({}, params || {})
    }

    window[MODAL_EXPOSE_KEY] = modalExpose

    return modalExpose
}

export function useModalExpose() {
    const ctx = window.top || window
    return ctx[MODAL_EXPOSE_KEY]
}
