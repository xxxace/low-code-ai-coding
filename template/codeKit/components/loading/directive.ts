import type { Directive, DirectiveBinding } from 'vue'
import { type LoadingApp } from './loading'
import { LoadingService, type LoadingOptions } from './service'

const INSTANCE_KEY = Symbol('loading')

export interface LoadingHTMLElement extends HTMLElement {
  [INSTANCE_KEY]: {
    options: LoadingOptions
    instance: LoadingApp
  }
}

const createInstace = (el: LoadingHTMLElement, binding: DirectiveBinding<boolean>) => {
  const options: LoadingOptions = {
    target: el,
    visible: binding.value
  }

  const app = {
    options,
    instance: LoadingService(options)
  }

  el[INSTANCE_KEY] = app

  return app
}

export const loadingDirective: Directive<LoadingHTMLElement, boolean> = {
  mounted(el, binding) {
    if (binding.value) {
      createInstace(el, binding)
    }
  },
  updated(el, binding) {
    let app = el[INSTANCE_KEY]
    if (!app) app = createInstace(el, binding)

    if (binding.value) {
      app.instance.show()
    } else {
      app.instance.hide()
    }
  }
}
