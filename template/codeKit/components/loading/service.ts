import { createLoadingElement, type LoadingApp } from './loading'

export type LoadingOptionsResolved = {
  /**
   * @description v-show使用
   */
  visible: boolean
  /**
   * @description 父级元素
   */
  parent: HTMLElement
  target: HTMLElement
}

export type LoadingOptions = Partial<Omit<LoadingOptionsResolved, 'parent' | 'target'>> & {
  target: string | HTMLElement
}

function isString(value: any): value is string {
  return typeof value === 'string'
}

export const LoadingService = function (options: LoadingOptions): LoadingApp {
  const targetOptions = resolveOptions(options)
  // 创建loading元素
  const loadingApp = createLoadingElement(targetOptions)

  // 添加到父元素
  targetOptions.parent.appendChild(loadingApp.loadingInstance.$el)
  if (['position', 'absolute', 'fixed'].indexOf(targetOptions.parent.style.position) === -1) {
    targetOptions.parent.style.position = 'relative'
  }

  return loadingApp
}

const resolveOptions = (options: LoadingOptions): LoadingOptionsResolved => {
  let target: HTMLElement
  if (isString(options.target)) {
    target = document.querySelector<HTMLElement>(options.target) ?? document.body
  } else {
    target = options.target || document.body
  }

  return {
    visible: options.visible ?? false,
    parent: target === document.body ? document.body : target,
    target: target
  }
}
