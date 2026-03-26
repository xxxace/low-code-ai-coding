/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent, ComponentOptionsBase } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
