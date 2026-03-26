import { defineComponent, h, reactive, vShow, withDirectives, createApp } from 'vue'
import type { LoadingOptionsResolved } from './service'
import './loading.css'
import logoPng from './assets/logo.png'

export function createLoadingElement(options: LoadingOptionsResolved) {
  const data = reactive({
    ...options
  })

  const loadingComponent = defineComponent({
    setup() {
      return () => {
        const skeletonText = h('div', { class: 'skeleton-text' }, 'Nameson')
        const logo = h('img', { width: 64, src: logoPng, style: { display: 'inline-block', marginRight: '12px' } })
        const loadingTitle = h('div', { class: 'loading-title' }, [logo, skeletonText])
        const loadingContent = h('div', { class: 'loading-content' }, loadingTitle)
        const loadingContainer = h('div', { class: 'loading-container' }, loadingContent)

        return withDirectives(loadingContainer, [[vShow, data.visible]])
      }
    }
  })

  const show = function () {
    data.visible = true
  }
  const hide = function () {
    data.visible = false
  }

  const loadingApp = createApp(loadingComponent)
  const loadingInstance = loadingApp.mount(document.createElement('div'))

  return {
    loadingInstance,
    show,
    hide
  }
}

export type LoadingApp = ReturnType<typeof createLoadingElement>
