export * from '@/hooks/nameson/useFetchSQL';
import {ElMessage, ElMessageBox} from 'element-plus';
import type {SearchDataHandler} from '@/hooks/nameson/useFetchSQL'

// 获取数据列表接口：无论如何都返回数组
// 获取数据项接口：无论如何都返回对象
// 默认错误要报错
// 传参错误不要报错
export type FetchWrapperOptions = {
    slient?: boolean
    defaultValue?: any
    errorPrefix?: string,
    messageMode?: 'message' | 'messagebox'
}

export async function fetchDataList<T>(promiseResponse: ReturnType<SearchDataHandler>, option?: FetchWrapperOptions): Promise<T> {
    option = option || {} as FetchWrapperOptions
    const errorHandler = function (error: any, type: 'warning' | 'error') {
        if (!option.slient) {
            const message = `${option.errorPrefix || 'error:'}${error.message || JSON.stringify(error)}`
            if (option.messageMode === 'messagebox') {
                ElMessageBox.alert(message, 'Tips', {
                    confirmButtonText: 'OK',
                    type: type
                })
            } else {
                ElMessage[type](message)
            }
        }

        return option.defaultValue || []
    }

    try {
        const res = await promiseResponse
        if (res.statusCode == '1') {
            return res.data as T
        } else {
            return errorHandler(res.message, 'warning')
        }
    } catch (e) {
        return errorHandler(e, 'error')
    }
}

export async function fetchDataItem<T>(promiseResponse: ReturnType<SearchDataHandler>, option?: FetchWrapperOptions): Promise<T> {
    option = option || {} as FetchWrapperOptions
    const errorHandler = function (error: any, type: 'warning' | 'error') {
        if (!option.slient) {
            const message = `${option.errorPrefix || 'error:'}${error.message || JSON.stringify(error)}`
            if (option.messageMode === 'messagebox') {
                ElMessageBox.alert(message, 'Tips', {
                    confirmButtonText: 'OK',
                    type: type
                })
            } else {
                ElMessage[type](message)
            }
        }

        return option.defaultValue || {}
    }

    try {
        const res = await promiseResponse
        if (res.statusCode == '1') {
            return (res.data[0] || option.defaultValue || {}) as T
        } else {
            return errorHandler(res.message, 'warning')
        }
    } catch (e) {
        return errorHandler(e, 'error')
    }
}
