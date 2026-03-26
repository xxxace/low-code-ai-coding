import { App, ComponentInstance } from 'vue'

export function setupParamsForm(app: App): void {
  const modules = import.meta.glob('./*ParamsForm.vue')
  for (const path in modules) {
    modules[path]().then((mod: { default: ComponentInstance<any> }) => {
      const component = mod.default
      if (component) {
        app.component(component.__name, component)
      }
    })
  }
}
