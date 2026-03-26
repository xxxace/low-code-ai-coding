export type EventMap = Record<string, Function[]>

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

  once(eventName: string, listener: Function) {
    const onceListener = (...args: any[]) => {
      listener(...args)
      this.off(eventName, onceListener)
    }
    this.on(eventName, onceListener)
  }
}

export type TEventEmitter = typeof EventEmitter

export default EventEmitter
