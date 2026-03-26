import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
import { NO_RESET_WHITE_LIST } from '@/constants'

const { t } = useI18n()

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/mes',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/dynamic',
    name: 'Dynamic',
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'Redirect',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/personal',
    component: Layout,
    redirect: '/personal/personal-center',
    name: 'Personal',
    meta: {
      title: t('router.personal'),
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: 'personal-center',
        component: () => import('@/views/Personal/PersonalCenter/PersonalCenter.vue'),
        name: 'PersonalCenter',
        meta: {
          title: t('router.personalCenter'),
          hidden: true,
          canTo: true
        }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  }
  // {
  //   path: '/demo',
  //   component: Layout,
  //   redirect: '/demo/task-confirm',
  //   name: 'Demo',
  //   meta: {
  //     title: 'Demo',
  //     icon: 'vi-ant-design:dashboard-filled',
  //     alwaysShow: true
  //   },
  //   children: [
  //     {
  //       name: 'workOrder',
  //       path: 'work-order',
  //       component: () => import('@/views/MES/workOrder/index.vue'),
  //       meta: {
  //         title: '工单查询',
  //         identity: 'VUE_MES_JOBSCH'
  //       }
  //     },
  //     {
  //       name: 'yarnReceive',
  //       path: 'yarn-receive',
  //       component: () => import('@/views/MES/yarnReceive/index.vue'),
  //       meta: {
  //         title: '车间纱线收料',
  //         identity: 'VUE_MES_JOBSCH'
  //       }
  //     },
  //     {
  //       name: 'materialReadinessAnalysis',
  //       path: 'material-readiness-analysis',
  //       component: () => import('@/views/MES/materialReadinessAnalysis/index.vue'),
  //       meta: {
  //         title: '毛料齐套分析',
  //         identity: 'VUE_MES_JOBSCH'
  //       }
  //     }
  //     // {
  //     //   name: 'SystemReport',
  //     //   path: 'report-production',
  //     //   component: () => import('@/views/MES/systemReport/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-每日生产',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'InstantIndex',
  //     //   path: 'instantIndex',
  //     //   component: () => import('@/views/MES/Instant/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-即时在制',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'RateOfProgress',
  //     //   path: 'rateOfProgress',
  //     //   component: () => import('@/views/MES/rateOfProgress/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-工单进度',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'Quality',
  //     //   path: 'quality',
  //     //   component: () => import('@/views/MES/quality/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-每日品質報表',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'Performance',
  //     //   path: 'performance',
  //     //   component: () => import('@/views/MES/performance/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-员工绩效',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'Transfer',
  //     //   path: 'transfer',
  //     //   component: () => import('@/views/MES/transfer/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-衫片移交查询',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'LoomMotor',
  //     //   path: 'loom-motor',
  //     //   component: () => import('@/views/MES/loomMotor/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-织机产线',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // },
  //     // {
  //     //   name: 'ProductionScheduling',
  //     //   path: 'production-scheduling',
  //     //   component: () => import('@/views/MES/productionScheduling/index.vue'),
  //     //   meta: {
  //     //     title: '系统报表-排产计划',
  //     //     identity: 'VUE_MES_JOBSCH'
  //     //   }
  //     // }
  //   ]
  // }
  // {
  //   path: '/dashboard',
  //   component: Layout,
  //   redirect: '/dashboard/analysis',
  //   name: 'Dashboard',
  //   meta: {
  //     title: t('router.dashboard'),
  //     icon: 'vi-ant-design:dashboard-filled',
  //     alwaysShow: true
  //   },
  //   children: [
  //     {
  //       path: 'analysis',
  //       component: () => import('@/views/Dashboard/Analysis.vue'),
  //       name: 'Analysis',
  //       meta: {
  //         title: t('router.analysis'),
  //         noCache: true,
  //         affix: true
  //       }
  //     },
  //     {
  //       path: 'workplace',
  //       component: () => import('@/views/Dashboard/Workplace.vue'),
  //       name: 'Workplace',
  //       meta: {
  //         title: t('router.workplace'),
  //         noCache: true
  //       }
  //     },
  //     {
  //       path: 'pre-order',
  //       component: () => import('@/views/hotel/preOrder/index-bak.vue'),
  //       name: 'PreOrder',
  //       meta: {
  //         title: t('router.workplace'),
  //         noCache: true
  //       }
  //     }
  //   ]
  // }
]

export const asyncRouterMap: AppRouteRecordRaw[] = []

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: constantRouterMap as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
