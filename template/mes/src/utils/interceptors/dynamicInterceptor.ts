import router from '@/router'
import {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded
} from 'vue-router'
import { useNamesonUserStore } from '@/store/modules/ns-user'
import MsgSlaverManager from '@/plugins/dialog/MsgSlaverManager'

const modules = import.meta.glob('@/views/**/*.{vue,tsx}')

function parseSearch(search: string): undefined | Record<string, any> {
  if (!search) return

  return search.split('&').reduce((map, next) => {
    const [key, value] = next.split('=')
    map[key] = value
    return map
  }, {})
}

export function dynamicInterceptor(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
) {
  if (to.name === 'Dynamic') {
    if (!window['$$msgSlaverManager']) {
      // 连接父页面
      const msgSlaverManager = new MsgSlaverManager()
      window['$$msgSlaverManager'] = msgSlaverManager
    }

    if (to.query && to.query.to) {
      const [dynamicPath, search] = (to.query.to as string).split('?')

      function convertToGlobPath(path: string) {
        if (!path) return '/404'
        return path.replace('@dynamic', '/src') + '.vue'
      }

      const globPath = convertToGlobPath(dynamicPath)
      const query = parseSearch(search)
      const dynamicRoute = {
        path: `/${new Date().getTime()}-${Math.round(Math.random() * 1000)}`,
        name: dynamicPath,
        component: modules[globPath],
        meta: null as any
      }

      if (query && query.identity) {
        const perms = useNamesonUserStore().permissionList
        const prjuserobj = perms.find((perm) => perm.ENAME === query.identity)
        dynamicRoute.meta = {
          identity: prjuserobj?.ENAME,
          objectId: prjuserobj?.OBJECTID
        }
        delete query.identity
      }

      router.addRoute(dynamicRoute)

      next({ path: dynamicRoute.path, query: query })
      return true
    }
  }

  return false
}
