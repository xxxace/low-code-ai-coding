import request from '@/utils/request'
import requestNx from './request'
import type { RequestResponse } from '@/utils/axios/types'

type getOrdInfoParams = {
  pBarcode: string
  pUser?: string
  pID?: number
}
export const postAction = <T>(url: string, data?: Record<string, any>) => {
  return request.request<RequestResponse<T>>({
    method: 'post',
    url,
    data: data || {}
  })
}
export const postActionNx = <T>(url: string, data?: Record<string, any>) => {
  return requestNx.request<RequestResponse<T>>({
    method: 'post',
    url,
    data: data || {}
  })
}
// 返回右侧数据
export const GetOrd2Workinstruct = <T>(params: Record<string, any>) => {
  return postActionNx<T>('/GetOrd2Workinstruct', params)
}
// 返回批號信息
export const GetOrdinfo = <T>(params: getOrdInfoParams) => {
  return postAction<T>('/GetOrdinfo', params)
}
// 返回table
export const GetEmpinfo = <T>(params: Record<string, any>) => {
  return postAction<T>('/GetEmpinfo', params)
}
// 左侧图片信息
export const Image = <T>(params: Record<string, any>) => {
  return postAction<T>('/Image', params)
}

