import { Ref } from 'vue'
import type { EditableTableInstance } from '@/components/EditableTable/types'
import type { ResizeModalInstance } from '@/components/ResizeModal/types'

/**
 *
 * @param component 需要注册的组件
 * @param alias 组件别名
 * @returns any
 */
export const withInstall = <T>(component: T, alias?: string) => {
  const comp = component as any
  comp.install = (app: any) => {
    app.component(comp.name || comp.displayName, component)
    if (alias) {
      app.config.globalProperties[alias] = component
    }
  }
  return component as T & Plugin
}

/**
 * @param str 需要转下划线的驼峰字符串
 * @returns 字符串下划线
 */
export const humpToUnderline = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * @param str 需要转驼峰的下划线字符串
 * @returns 字符串驼峰
 */
export const underlineToHump = (str: string): string => {
  if (!str) return ''
  return str.replace(/\-(\w)/g, (_, letter: string) => {
    return letter.toUpperCase()
  })
}

/**
 * 驼峰转横杠
 */
export const humpToDash = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export const setCssVar = (prop: string, val: any, dom = document.documentElement) => {
  dom.style.setProperty(prop, val)
}

export const getCssVar = (prop: string, dom = document.documentElement) => {
  return getComputedStyle(dom).getPropertyValue(prop)
}

/**
 * 查找数组对象的某个下标
 * @param {Array} ary 查找的数组
 * @param {Functon} fn 判断的方法
 */
export const findIndex = <T = Recordable>(ary: Array<T>, fn: Fn): number => {
  if (ary.findIndex) {
    return ary.findIndex(fn)
  }
  let index = -1
  ary.some((item: T, i: number, ary: Array<T>) => {
    const ret: T = fn(item, i, ary)
    if (ret) {
      index = i
      return ret
    }
  })
  return index
}

export const trim = (str: string) => {
  return str.replace(/(^\s*)|(\s*$)/g, '')
}

/**
 * @param {Date | number | string} time 需要转换的时间
 * @param {String} fmt 需要转换的格式 如 yyyy-MM-dd、yyyy-MM-dd HH:mm:ss
 */
export function formatTime(time: Date | number | string, fmt: string) {
  if (!time) return ''
  else {
    const date = new Date(time)
    const o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'H+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds()
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
        )
      }
    }
    return fmt
  }
}

/**
 * 生成随机字符串
 */
export function toAnyString() {
  const str: string = 'xxxxx-xxxxx-4xxxx-yxxxx-xxxxx'.replace(/[xy]/g, (c: string) => {
    const r: number = (Math.random() * 16) | 0
    const v: number = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString()
  })
  return str
}

/**
 * 首字母大写
 */
export function firstUpperCase(str: string) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

/**
 * 把对象转为formData
 */
export function objToFormData(obj: Recordable) {
  const formData = new FormData()
  Object.keys(obj).forEach((key) => {
    formData.append(key, obj[key])
  })
  return formData
}

export function toFixedPlus(num: number | string | undefined | null, digits = 0, number = false) {
  if (num) {
    if (typeof num === 'string') {
      if (num.indexOf(',') !== -1) {
        num = num.split(',').join('')
      }
      num = Number(num)
    }
    const value = Number(num.toFixed(digits))
    if (number === true) return value as number
    const valueParts = String(value).split('.')
    valueParts[0] = valueParts[0].replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,') //将整数部分逢三一断
    return valueParts[1] ? valueParts.join('.') : valueParts[0]
  } else {
    return num
  }
}

export function getEditableTableExposeProxy(ref: Ref<any>): EditableTableInstance<any> {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return ref.value ? ref.value[prop] : undefined
      },
      has(_target, prop) {
        return ref.value ? prop in ref.value : false
      }
    }
  ) as EditableTableInstance<any>
}

export function getResizeModelExposeProxy<T>(
  ref: Ref<T>,
  interceptor?: Record<any, Function>
): ResizeModalInstance {
  return new Proxy(
    {},
    {
      get(_target, prop: any) {
        if (interceptor && interceptor[prop]) return interceptor[prop]
        return ref.value ? ref.value[prop] : undefined
      },
      has(_target, prop: any) {
        if (interceptor && interceptor[prop]) return true
        // @ts-ignore
        return ref.value ? prop in ref.value : false
      }
    }
  ) as ResizeModalInstance
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parseImgSrc(seqOrBase64: string | number | undefined): string {
  if (!seqOrBase64) return ''
  if (typeof seqOrBase64 === 'string') return seqOrBase64
  return `${import.meta.env.VITE_BASE_URL}/Image?IMGSEQ=${seqOrBase64}&pUser=DEV&sessionID=1&_t=${new Date().getTime()}`
}

// 挑选出对象中需要的字段 target = [ "targetKey", "targetKey:sourceKey"]
export function pickByTarget<T>(obj: T, target: keyof T | any[]) {
  if (!(obj instanceof Object)) {
    throw new Error('参数[obj]类型必须为 [Object]!')
    return
  }
  if (!(target instanceof Array)) {
    throw new Error('参数[target]类型必须为 [Array]!')
    return
  }
  const result = {}
  target.forEach((key) => {
    const keyMap = key.split(':')
    if (obj[keyMap[1]] || obj[keyMap[1]] === 0) {
      result[keyMap[0]] = obj[keyMap[1]]
    } else if (keyMap[0] || keyMap[0] === 0) {
      result[keyMap[0]] = obj[keyMap[0]]
    } else {
      result[keyMap[0]] = ''
    }
  })

  console.log('pickByTarget:', result)
  return result as T
}

export function formatString(template: string, ...values: any[]) {
  if (!template) return ''
  return template.replace(/{(\d+)}/g, (_, index) => {
    return values[index] || '' // 如果找不到对应的值，返回原始的占位符
  })
}
