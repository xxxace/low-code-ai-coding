import { h } from 'vue'
import type { VNode, RendererNode, RendererElement } from 'vue'

type Component = VNode<RendererNode, RendererElement, { [key: string]: any }>

const cacheMap = new Map()

export function CacheComponent(component: Component, key: string, include: string[]): Component {
  if (!include.length || include.includes(key)) {
    let cacheComponent
    if (cacheMap.has(key)) {
      cacheComponent = cacheMap.get(key)
    } else {
      cacheComponent = {
        name: key,
        render: () => component
      }
      cacheMap.set(key, cacheComponent)
    }

    return h(cacheComponent)
  } else {
    return component
  }
}

export function deleteCacheComponent(key: string) {
  cacheMap.delete(key)
}

export function clearCacheComponent() {
  cacheMap.clear()
}
