import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, Axios } from 'axios'
import type { RequestConfig, RequestInterceptors } from './types'

class RequestQueue<T> {
  queue: T[] = []
  excutorMap: WeakMap<any, Function> = new WeakMap()
  emitsMap: WeakMap<any, Function> = new WeakMap()
  requestCount: number = 0

  add(item: T, excutor: Axios['request']) {
    this.queue.push(item)
    this.excutorMap.set(item, async (config) => await excutor(config as any))
  }

  async next() {
    this.requestCount++
    const item = this.queue.shift()
    const exqutor = this.excutorMap.get(item)!

    try {
      const res = await exqutor(item)
      this.emitsMap.get(item)?.(null, res)
    } catch (e) {
      this.emitsMap.get(item)?.(e, null)
    }

    this.emitsMap.delete(item)
    this.excutorMap.delete(item)
    this.requestCount--

    if (this.queue.length > 0 && this.requestCount === 0) {
      await this.next()
    }
  }

  on(item: T, handler: (err: any, data: any) => void) {
    this.emitsMap.set(item, handler)
  }

  request(item: T, excutor: Axios['request']) {
    this.add(item, excutor)

    // @ts-ignore
    !(async () => {
      await Promise.resolve()
      if (this.queue.length && this.requestCount === 0) {
        this.next()
      }
    })()
  }
}

const requestQueue = new RequestQueue<RequestConfig<any>>()

class Request {
  instance: AxiosInstance
  interceptorMap?: RequestInterceptors<AxiosResponse>

  constructor(config: RequestConfig) {
    this.instance = axios.create(config)

    if (config.interceptors) this.interceptorMap = config.interceptors

    this.instance.interceptors.request.use(
      (res: InternalAxiosRequestConfig) => {
        return res
      },
      (err: any) => err
    )

    const {
      requestInterceptor,
      requestInterceptorCatch,
      responseInterceptor,
      responseInterceptorCatch
    } = config.interceptors || {}

    if (requestInterceptor || requestInterceptorCatch) {
      this.instance.interceptors.request.use(requestInterceptor, requestInterceptorCatch)
    }

    if (responseInterceptor || responseInterceptorCatch) {
      this.instance.interceptors.response.use(responseInterceptor, responseInterceptorCatch)
    }

    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        return res.data
      },
      (err: any) => err
    )
  }

  request<T>(config: RequestConfig<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 如果我们为单个请求设置拦截器，这里使用单个请求的拦截器
      if (this.interceptorMap?.requestInterceptor) {
        config = this.interceptorMap.requestInterceptor(config as any)
      }

      requestQueue.on(config, (err, res) => {
        if (err) {
          reject(err)
        } else {
          if (this.interceptorMap?.responseInterceptor) {
            res = this.interceptorMap.responseInterceptor(res)
          }

          if (this.interceptorMap?.responseComplete) {
            this.interceptorMap.responseComplete(res, resolve, reject)
          } else {
            resolve(res)
          }
        }
      })

      requestQueue.request(config, this.instance.request)
    })
  }
}

export default Request
