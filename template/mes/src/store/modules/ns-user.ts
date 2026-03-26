import { reactive, toRefs } from 'vue'
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { type Prjuserobject } from '@/api/nameson/auth'

export type UserInfo = { name: string; sessionId: number } & Record<string, any>
import { fetchSql } from '@/hooks/nameson/useFetchSql'
import { PrjobjItem, searchPrjobjitem } from '@/api/nameson'
import { requestCache } from '@/hooks/nameson/useRequestCache'
import { setRemoteLocale, updateLocaleMessage } from '@/plugins/vueI18n/lazyLoader'

const flatRoutes = (routes: RouteRecordRaw[]) => {
  const flatList: RouteRecordRaw[] = []
  routes.forEach((route) => {
    if (route.children) {
      flatList.push(...flatRoutes(route.children))
    } else {
      flatList.push(route as RouteRecordRaw)
    }
  })

  return flatList
}

export const useNamesonUserStore = defineStore(
  'ns-user',
  () => {
    const user = reactive<{
      name: string
      sessionId: number
      userInfo: UserInfo
      permissionList: Prjuserobject[]
    }>({
      name: '',
      sessionId: 0,
      userInfo: { name: '', sessionId: 0 },
      permissionList: []
    })

    const setInfo = (info: UserInfo) => {
      user.name = info.name
      user.sessionId = info.sessionId
      user.userInfo = Object.assign({}, info)
    }
    const setPermissionList = (permissionList: Prjuserobject[]) => {
      user.permissionList = JSON.parse(JSON.stringify(permissionList || []))
      user.permissionList.some((item) => {
        if (item.OBJECTID === 870401) {
          item.REPORTURL =
            'http://10.3.0.115:7778/reports/rwservlet?newerp&report=newerp/sale/REPBLUECARD&repname=REPBLUECARD.cpt&format=pdf'
          return true
        }
      })
    }

    const logout = () => {
      setInfo({ name: '', sessionId: 0 })
      setPermissionList([])
    }

    const loadBaseData = async (ename: string, objectId: number) => {
      await fetchSql({
        objectId: objectId,
        tabseq: 0
      })
      // console.log('加载完成！')
      const prjobjItems = await requestCache<PrjobjItem[] | null>(
        `prjobjItems-${objectId}`,
        async () => {
          return await searchPrjobjitem({ p_Objectid: objectId })
        }
      )
      prjobjItems && setRemoteLocale(ename, prjobjItems)

      // console.log(i18nRemoteMap)

      updateLocaleMessage()
    }

    const getPrjobjItem = (objectName: string) => {
      return user.permissionList.find((item) => item.ENAME === objectName)
    }

    const getObjectId = (ename: string) => {
      const prjobjItem = getPrjobjItem(ename)
      return prjobjItem ? prjobjItem.OBJECTID : undefined
    }

    return {
      ...toRefs(user),
      setInfo,
      logout,
      setPermissionList,
      loadBaseData,
      getPrjobjItem,
      getObjectId
    }
  },
  {
    persist: {
      // omit: ['permissionList']
    }
  }
)
