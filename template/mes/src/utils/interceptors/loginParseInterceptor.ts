import {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  type RouteRecordRaw
} from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useUserStoreWithOut } from '@/store/modules/user'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { SearchPrjuserobject, Logon_JS2 } from '@/api/nameson/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { premsToNamesonRoutes } from '@/utils/routerHelper'
import { useNamesonUserStore } from '@/store/modules/ns-user'

export async function loginParseInterceptor(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
) {
  const appStore = useAppStoreWithOut()
  const userStore = useUserStoreWithOut()

  // 判断来源
  const query = to.query
  const isFromDynamic = to.name === 'Dynamic'

  if (Object.hasOwn(query, 'loginid')) {
    // 1.外部调用（其他系统的页面、OA、ERP） loginid
    appStore.setIsFromOutside(true)
    appStore.setIsWithoutLayout(true)
    // 清空之前的权限
    userStore.clearAuthState()

    try {
      await login(query.loginid as string, query.pwd as string)
      if (!isFromDynamic) {
        next({ ...to, replace: true })
      }
    } catch (err: any) {
      ElMessage.error(`登录错误：${err.message || JSON.stringify(err)}`)
    }

    return !isFromDynamic
  } else if (isFromDynamic) {
    // 2.内部dynamic加载
    // 从父页面获取相关权限
  }

  return false
}

async function login(loginid: string, pwd: string) {
  const router = useRouter()
  const appStore = useAppStoreWithOut()
  const userStore = useUserStoreWithOut()
  const nsUserStore = useNamesonUserStore()
  const permissionStore = usePermissionStoreWithOut()

  async function getRole() {
    const perms = await SearchPrjuserobject()

    if (perms && perms.length) {
      nsUserStore.setPermissionList(perms)
      const routers = premsToNamesonRoutes(perms)
      userStore.setRoleRouters(routers)
      if (appStore.getDynamicRouter && appStore.getServerDynamicRouter) {
        await permissionStore.generateRoutes('server', routers)
      } else {
        await permissionStore.generateRoutes('frontEnd', routers)
      }
      permissionStore.getAddRouters.forEach((route) => {
        router.addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
      })
      permissionStore.setIsAddRouters(true)
    }
  }

  const res = await Logon_JS2({
    username: loginid.toUpperCase(),
    password: pwd
  })

  if (res.statusCode === '1' && res.data !== -1) {
    userStore.setUserInfo({
      username: loginid.toUpperCase(),
      sessionId: res.data,
      pwd
    })

    if (appStore.getDynamicRouter) {
      await getRole()
    }
  } else {
    ElMessage.warning(res.message)
  }
}
