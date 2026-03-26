import type {Ref, UnwrapRef} from 'vue'
import type {EditableTableInstance} from '../components/EditableTable/types.ts'
import type {ResizeModalInstance} from '../components/ResizeModal/types.ts'

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

export function getEditableTableExposeProxy<T>(ref: T extends Ref<any> ? T : Ref<T>): EditableTableInstance<any> {
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

export function getResizeModelExposeProxy<T, I extends object>(
    ref: T extends Ref<any> ? T : Ref<T>,
    interceptor?: I
) {
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
    ) as ResizeModalInstance & I
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// export function parseImgSrc(seqOrBase64: string | number | undefined): string {
//     if (!seqOrBase64) return ''
//     if (typeof seqOrBase64 === 'string') return seqOrBase64
//     return `${import.meta.env.VITE_BASE_URL}/Image?IMGSEQ=${seqOrBase64}&pUser=DEV&sessionID=1&_t=${new Date().getTime()}`
// }

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
