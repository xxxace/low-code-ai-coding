import { ref, onMounted } from 'vue'
import EventEmitter from '../utils/eventEmit'

const cache = ref<Record<string, any>>({})

class RequestCenter extends EventEmitter {
  async request(key, request: () => Promise<any>) {
    let task = cache.value[key] || {}

    if (task.loading) return
    if (!task.value) {
      cache.value[key] = task = {
        loading: true
      }

      try {
        const result = await request()
        task.value = result
        this.emit(key, null, JSON.parse(JSON.stringify(task.value)))
      } catch (e) {
        this.emit(key, e)
      } finally {
        task.loading = false
      }
    } else {
      this.emit(key, null, JSON.parse(JSON.stringify(task.value)))
    }
  }
}

export function getCacheValue(key: string) {
  return cache.value[key]?.value
}

export function clearCacheValue(key) {
  Reflect.deleteProperty(cache.value, key)
}

const requestCenter = new RequestCenter()

export function useRequestCache<T>(
  key: string,
  request: () => Promise<T>,
  immediate: boolean = true
) {
  const loading = ref(false)
  const response = ref<T | undefined>(undefined)

  const load = () => {
    loading.value = true
    requestCenter.once(key, (err, res) => {
      if (!err) {
        response.value = res
      }
      loading.value = false
    })
    try {
      requestCenter.request(key, request)
    } catch (e) {
      console.log(e)
    }
    loading.value = false
  }

  onMounted(() => immediate && load())

  return { loading, response, load }
}

export function requestCache<T>(key: string, request: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    requestCenter.once(key, (err, res) => {
      !err ? resolve(res) : reject(err)
    })
    try {
      requestCenter.request(key, request)
    } catch (e) {
      reject(e)
    }
  })
}
