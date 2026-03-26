import router from './router'
import { useAppStoreWithOut } from '@/store/modules/app'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useNamesonUserStore } from './store/modules/ns-user'
import { dynamicInterceptor, loginParseInterceptor } from '@/utils/interceptors'
// import { SearchPrjuserobject } from './api/nameson/auth'
import { toQueryString } from '@/utils/url'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()
let isInitialized = false

router.beforeEach(async (to, from, next) => {
  start()
  loadStart()

  const userStore = useUserStoreWithOut()

  if (!isInitialized) {
    isInitialized = true
    if (await loginParseInterceptor(to, from, next)) return
  }

  if (dynamicInterceptor(to, from, next)) return

  const permissionStore = usePermissionStoreWithOut()
  const appStore = useAppStoreWithOut()
  const nsUserStore = useNamesonUserStore()

  if (userStore.getUserInfo) {
    if (to.path === '/login') {
      next('/')
    } else {
      // if (nsUserStore.permissionList.length === 0) {
      //   const perms = await SearchPrjuserobject()
      //   nsUserStore.setPermissionList(perms)
      // }
      const { identity, objectId } = to.meta
      // 加载基础的翻译和SQL数据
      // TODO: 记录已加载过翻译的项，减少请求次数

      if (identity && objectId) await nsUserStore.loadBaseData(identity, objectId)

      if (permissionStore.getIsAddRouters) {
        next()
        return
      }

      // 开发者可根据实际情况进行修改
      const roleRouters = userStore.getRoleRouters || []

      // 是否使用动态路由
      if (appStore.getDynamicRouter) {
        appStore.serverDynamicRouter
          ? await permissionStore.generateRoutes('server', roleRouters as AppCustomRouteRecordRaw[])
          : await permissionStore.generateRoutes('frontEnd', roleRouters as string[])
      } else {
        await permissionStore.generateRoutes('static')
      }

      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
      })

      const redirectPath = from.query.redirect || to.path
      const redirect = decodeURIComponent(redirectPath as string)
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect }
      permissionStore.setIsAddRouters(true)
      next(nextData)
    }
  } else {
    if (NO_REDIRECT_WHITE_LIST.indexOf(to.path) !== -1) {
      next()
    } else {
      if (to.path.indexOf('/404') === 0) {
        next(`/login`)
      } else {
        const query = {
          redirect: to.path + toQueryString(to.query, true)
        }
        next(`/login${toQueryString(query, true)}`) // 否则全部重定向到登录页
      }
    }
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
