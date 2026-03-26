import { provide, inject } from 'vue'

type EventMap = Record<string, Function[]>

class EventEmitter {
  events: EventMap
  constructor() {
    this.events = {}
  }

  // 注册事件监听器
  on(eventName: string, listener: Function) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function')
    }
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(listener)
  }

  // 触发事件
  emit(eventName: string, ...args: any[]) {
    if (this.events[eventName]) {
      this.events[eventName].forEach((listener) => {
        listener(...args)
      })
    }
  }

  // 移除事件监听器
  off(eventName: string, listenerToRemove: Function) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter((listener) => {
        return listener !== listenerToRemove
      })
    }
  }
}

class ParentScope<T extends Record<string, any>> extends EventEmitter {
  private childrenMap = new Map<keyof T, T[keyof T]>()

  registry<K extends keyof T>(key: K, value: T[K]) {
    this.childrenMap.set(key, value)
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.childrenMap.get(key)
  }

  invoke<K extends keyof T>(key: K, ...args: any[]): any {
    const handler = this.childrenMap.get(key)
    if (typeof handler === 'function') {
      return handler(...args)
    } else {
      return handler
    }
  }
}

export const parentScopeKey = '$$parentScope'

export function setupParentScope<T extends Record<string, any>>(scopeKey?: string) {
  const parentScope = new ParentScope<T>()
  provide(scopeKey || parentScopeKey, parentScope)
  return parentScope
}

export function useParentScope<T extends Record<string, any>>(scopeKey?: string): ParentScope<T> {
  return inject<ParentScope<T>>(scopeKey || parentScopeKey)!
}
