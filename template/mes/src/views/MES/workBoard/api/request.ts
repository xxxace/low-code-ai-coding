// import qs from 'qs'
import Request from '@/utils/axios'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'

const request = new Request({
  baseURL: 'http://116.6.194.123:9501/JsonService.asmx',
  timeout: 5 * 60 * 1000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  interceptors: {
    requestInterceptor: (conifg) => {
      const { userInfo } = useUserStore()
      if (
        conifg.method === 'post' &&
        userInfo?.username &&
        userInfo?.sessionId &&
        !conifg.data.pUser
      ) {
        conifg.data.p_user = userInfo?.username
        conifg.data.p_sessionID = userInfo?.sessionId
        // conifg.data = qs.stringify(conifg.data)
      }
      return conifg
    },
    responseComplete: (res, resolve, _reject) => {
      if (res.statusCode === '-1' && res.message.indexOf('未登录') !== -1) {
        if (useAppStore().isFromOutside) {
          useUserStore().clearAuthState()
        } else {
          // 可以考虑弹窗提示，点击确认后再跳转至登录页
          useUserStore().reset()
        }
      } else {
        resolve(res)
      }
    }
  }
})

export default request
