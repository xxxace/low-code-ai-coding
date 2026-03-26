import type { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

export interface RequestInterceptors<T> {
  requestInterceptor?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  requestInterceptorCatch?: (error: any) => any
  responseInterceptor?: (config: T) => T
  responseInterceptorCatch?: (error: any) => any
  responseComplete?: (
    res: RequestResponse<T>,
    resolve: (value: any) => void,
    reject: (reason?: any) => void
  ) => any
}

export interface RequestConfig<T = AxiosResponse> extends AxiosRequestConfig {
  interceptors?: RequestInterceptors<T>
}

export type RequestResponse<T> = {
  statusCode: '-1' | '0' | '1'
  data: T
  message: string
}
