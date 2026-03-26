import { App, Directive } from 'vue'

const watchUpdatedDirective: Directive<HTMLElement, Function> = {
  mounted(el, binding, vnode) {
    console.log('mounted', el, binding, vnode)
  },
  updated(el, binding, vnode) {
    console.log('updated', el, binding, vnode)
  }
}

export default {
  install(app: App) {
    app.directive('watch-updated', watchUpdatedDirective)
  }
}
