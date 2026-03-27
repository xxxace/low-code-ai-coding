/// <reference types="vite/client" />

// element-plus locale 模块类型声明
declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const zhCn: { name: string; el: Record<string, string> }
  export default zhCn
}
