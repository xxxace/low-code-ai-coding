const modules = import.meta.glob('./modules/**/*.ts')

const dynamicRoutes: AppCustomRouteRecordRaw[] = []

for (const path in modules) {
  modules[path]().then((mod: { default: AppCustomRouteRecordRaw[] }) => {
    mod.default && mod.default.length && dynamicRoutes.push(mod.default[0])
  })
}

export default dynamicRoutes
