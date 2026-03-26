// vite.config.ts
import { resolve } from "path";
import { loadEnv } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite@5.3.4_@types+node@20.14.11_less@4.2.0_sass@1.79.3_terser@5.31.3/node_modules/vite/dist/node/index.js";
import Vue from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/@vitejs+plugin-vue@5.2.1_vite@5.3.4_vue@3.5.17/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueJsx from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/@vitejs+plugin-vue-jsx@4.1.1_vite@5.3.4_vue@3.5.17/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import progress from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-progress@0.0.7_vite@5.3.4/node_modules/vite-plugin-progress/dist/index.mjs";
import EslintPlugin from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-eslint@1.8.1_eslint@9.7.0_vite@5.3.4/node_modules/vite-plugin-eslint/dist/index.mjs";
import { ViteEjsPlugin } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-ejs@1.7.0_vite@5.3.4/node_modules/vite-plugin-ejs/index.js";
import { viteMockServe } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-mock@2.9.6_mockjs@1.1.0_rollup@4.18.1_vite@5.3.4/node_modules/vite-plugin-mock/dist/index.js";
import PurgeIcons from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-purge-icons@0.10.0_vite@5.3.4/node_modules/vite-plugin-purge-icons/dist/index.mjs";
import ServerUrlCopy from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-url-copy@1.1.4_vite@5.3.4/node_modules/vite-plugin-url-copy/dist/index.js";
import VueI18nPlugin from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/@intlify+unplugin-vue-i18n@4.0.0_rollup@4.18.1_vue-i18n@9.13.1/node_modules/@intlify/unplugin-vue-i18n/lib/vite.mjs";
import { createSvgIconsPlugin } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-svg-icons@2.0.1_vite@5.3.4/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import { createStyleImportPlugin, ElementPlusResolve } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-style-import@2.0.0_vite@5.3.4/node_modules/vite-plugin-style-import/dist/index.mjs";
import UnoCSS from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/unocss@0.61.5_postcss@8.4.39_rollup@4.18.1_vite@5.3.4/node_modules/unocss/dist/vite.mjs";
import { visualizer } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/rollup-plugin-visualizer@5.12.0_rollup@4.18.1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { lazyImport, VxeResolver } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/vite-plugin-lazy-import@1.0.7/node_modules/vite-plugin-lazy-import/dist/index.cjs";
import AutoImport from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/unplugin-auto-import@0.18.3_@vueuse+core@10.11.0_rollup@4.18.1/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/unplugin-vue-components@0.27.4_rollup@4.18.1_vue@3.5.17/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///D:/svn-workspace/VueH5/77_MES-APS/node_modules/.pnpm/unplugin-vue-components@0.27.4_rollup@4.18.1_vue@3.5.17/node_modules/unplugin-vue-components/dist/resolvers.js";
var __vite_injected_original_dirname = "D:\\svn-workspace\\VueH5\\77_MES-APS";
var root = process.cwd();
function pathResolve(dir) {
  return resolve(root, ".", dir);
}
var vite_config_default = ({ command, mode }) => {
  let env = {};
  const isBuild = command === "build";
  if (!isBuild) {
    env = loadEnv(process.argv[3] === "--mode" ? process.argv[4] : process.argv[3], root);
  } else {
    env = loadEnv(mode, root);
  }
  return {
    base: env.VITE_BASE_PATH,
    plugins: [
      // mode === 'pro'
      //   ? i18nKeyExtractPlugin({
      //       uploader: i18nKeyUploader
      //     })
      //   : undefined,
      Vue({
        script: {
          // 开启defineModel
          defineModel: true
        }
      }),
      VueJsx(),
      ServerUrlCopy(),
      progress(),
      env.VITE_USE_ALL_ELEMENT_PLUS_STYLE === "false" ? createStyleImportPlugin({
        resolves: [ElementPlusResolve()],
        libs: [
          {
            libraryName: "element-plus",
            esModule: true,
            resolveStyle: (name) => {
              if (["form-context-key", "click-outside", "dayjs"].includes(name)) return "";
              return `element-plus/es/components/${name.replace(/^el-/, "")}/style/css`;
            }
          }
        ]
      }) : void 0,
      EslintPlugin({
        cache: false,
        failOnWarning: false,
        failOnError: false,
        include: ["src/**/*.vue", "src/**/*.ts", "src/**/*.tsx"]
        // 检查的文件
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      }),
      VueI18nPlugin({
        runtimeOnly: true,
        compositionOnly: true,
        include: [resolve(__vite_injected_original_dirname, "src/locales/**")]
      }),
      createSvgIconsPlugin({
        iconDirs: [pathResolve("src/assets/svgs")],
        symbolId: "icon-[dir]-[name]",
        svgoOptions: true
      }),
      PurgeIcons(),
      env.VITE_USE_MOCK === "true" ? viteMockServe({
        ignore: /^\_/,
        mockPath: "mock",
        localEnabled: !isBuild,
        prodEnabled: isBuild,
        injectCode: `
          import { setupProdMockServer } from '../mock/_createProductionServer'

          setupProdMockServer()
          `
      }) : void 0,
      ViteEjsPlugin({
        title: env.VITE_APP_TITLE
      }),
      lazyImport({
        resolvers: [
          VxeResolver({
            libraryName: "vxe-table"
          }),
          VxeResolver({
            libraryName: "vxe-pc-ui"
          })
        ]
      }),
      UnoCSS()
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        },
        less: {
          additionalData: '@import "./src/styles/variables.module.less";',
          javascriptEnabled: true
        }
      }
    },
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".less", ".css"],
      alias: [
        {
          find: "vue-i18n",
          replacement: "vue-i18n/dist/vue-i18n.cjs.js"
        },
        {
          find: /\@\//,
          replacement: `${pathResolve("src")}/`
        },
        {
          find: /\$types\//,
          replacement: `${pathResolve("types")}/`
        }
      ]
    },
    esbuild: {
      pure: env.VITE_DROP_CONSOLE === "true" ? ["console.log"] : void 0,
      drop: env.VITE_DROP_DEBUGGER === "true" ? ["debugger"] : void 0
    },
    build: {
      target: "es2015",
      outDir: env.VITE_OUT_DIR || "dist",
      sourcemap: env.VITE_SOURCEMAP === "true",
      // brotliSize: false,
      rollupOptions: {
        plugins: env.VITE_USE_BUNDLE_ANALYZER === "true" ? [
          visualizer({
            open: true
          })
        ] : void 0,
        // 拆包
        output: {
          manualChunks: {
            "vue-chunks": ["vue", "vue-router", "pinia", "vue-i18n"],
            "element-plus": ["element-plus"],
            echarts: ["echarts", "echarts-wordcloud"]
          }
        }
      },
      cssCodeSplit: !(env.VITE_USE_CSS_SPLIT === "false"),
      cssTarget: ["chrome31"]
    },
    server: {
      port: 4050,
      proxy: {
        // 选项写法
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      },
      hmr: {
        overlay: false
      },
      host: "0.0.0.0",
      open: true
    },
    optimizeDeps: {
      include: [
        "vue",
        "vue-router",
        "vue-types",
        "element-plus/es/locale/lang/zh-cn",
        "element-plus/es/locale/lang/en",
        "@iconify/iconify",
        "@vueuse/core",
        "axios",
        "qs",
        "echarts",
        "echarts-wordcloud",
        "qrcode",
        "@wangeditor/editor",
        "@wangeditor/editor-for-vue",
        "vue-json-pretty",
        "@zxcvbn-ts/core",
        "dayjs",
        "cropperjs"
      ]
    }
  };
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxzdm4td29ya3NwYWNlXFxcXFZ1ZUg1XFxcXDc3X01FUy1BUFNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHN2bi13b3Jrc3BhY2VcXFxcVnVlSDVcXFxcNzdfTUVTLUFQU1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovc3ZuLXdvcmtzcGFjZS9WdWVINS83N19NRVMtQVBTL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXHJcbmltcG9ydCB7IGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdHlwZSB7IFVzZXJDb25maWcsIENvbmZpZ0VudiB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCBWdWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xyXG5pbXBvcnQgVnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXHJcbmltcG9ydCBwcm9ncmVzcyBmcm9tICd2aXRlLXBsdWdpbi1wcm9ncmVzcydcclxuaW1wb3J0IEVzbGludFBsdWdpbiBmcm9tICd2aXRlLXBsdWdpbi1lc2xpbnQnXHJcbmltcG9ydCB7IFZpdGVFanNQbHVnaW4gfSBmcm9tICd2aXRlLXBsdWdpbi1lanMnXHJcbmltcG9ydCB7IHZpdGVNb2NrU2VydmUgfSBmcm9tICd2aXRlLXBsdWdpbi1tb2NrJ1xyXG5pbXBvcnQgUHVyZ2VJY29ucyBmcm9tICd2aXRlLXBsdWdpbi1wdXJnZS1pY29ucydcclxuaW1wb3J0IFNlcnZlclVybENvcHkgZnJvbSAndml0ZS1wbHVnaW4tdXJsLWNvcHknXHJcbmltcG9ydCBWdWVJMThuUGx1Z2luIGZyb20gJ0BpbnRsaWZ5L3VucGx1Z2luLXZ1ZS1pMThuL3ZpdGUnXHJcbmltcG9ydCB7IGNyZWF0ZVN2Z0ljb25zUGx1Z2luIH0gZnJvbSAndml0ZS1wbHVnaW4tc3ZnLWljb25zJ1xyXG5pbXBvcnQgeyBjcmVhdGVTdHlsZUltcG9ydFBsdWdpbiwgRWxlbWVudFBsdXNSZXNvbHZlIH0gZnJvbSAndml0ZS1wbHVnaW4tc3R5bGUtaW1wb3J0J1xyXG5pbXBvcnQgVW5vQ1NTIGZyb20gJ3Vub2Nzcy92aXRlJ1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJ1xyXG5pbXBvcnQgeyBsYXp5SW1wb3J0LCBWeGVSZXNvbHZlciB9IGZyb20gJ3ZpdGUtcGx1Z2luLWxhenktaW1wb3J0J1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJ1xyXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xyXG5pbXBvcnQgeyBFbGVtZW50UGx1c1Jlc29sdmVyIH0gZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvcmVzb2x2ZXJzJ1xyXG5pbXBvcnQgeyBpMThuS2V5RXh0cmFjdFBsdWdpbiB9IGZyb20gJ0BuYW1lc29uL3ZpdGUtcGx1Z2luLXQtZXh0cmFjdG9yJ1xyXG5pbXBvcnQgeyBpMThuS2V5VXBsb2FkZXIgfSBmcm9tICcuL3ZpdGUtcGx1Z2lucy9pMThuS2V5VXBsb2FkZXInXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5jb25zdCByb290ID0gcHJvY2Vzcy5jd2QoKVxyXG5cclxuZnVuY3Rpb24gcGF0aFJlc29sdmUoZGlyOiBzdHJpbmcpIHtcclxuICByZXR1cm4gcmVzb2x2ZShyb290LCAnLicsIGRpcilcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgKHsgY29tbWFuZCwgbW9kZSB9OiBDb25maWdFbnYpOiBVc2VyQ29uZmlnID0+IHtcclxuICBsZXQgZW52ID0ge30gYXMgYW55XHJcbiAgY29uc3QgaXNCdWlsZCA9IGNvbW1hbmQgPT09ICdidWlsZCdcclxuICBpZiAoIWlzQnVpbGQpIHtcclxuICAgIGVudiA9IGxvYWRFbnYocHJvY2Vzcy5hcmd2WzNdID09PSAnLS1tb2RlJyA/IHByb2Nlc3MuYXJndls0XSA6IHByb2Nlc3MuYXJndlszXSwgcm9vdClcclxuICB9IGVsc2Uge1xyXG4gICAgZW52ID0gbG9hZEVudihtb2RlLCByb290KVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6IGVudi5WSVRFX0JBU0VfUEFUSCxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgLy8gbW9kZSA9PT0gJ3BybydcclxuICAgICAgLy8gICA/IGkxOG5LZXlFeHRyYWN0UGx1Z2luKHtcclxuICAgICAgLy8gICAgICAgdXBsb2FkZXI6IGkxOG5LZXlVcGxvYWRlclxyXG4gICAgICAvLyAgICAgfSlcclxuICAgICAgLy8gICA6IHVuZGVmaW5lZCxcclxuICAgICAgVnVlKHtcclxuICAgICAgICBzY3JpcHQ6IHtcclxuICAgICAgICAgIC8vIFx1NUYwMFx1NTQyRmRlZmluZU1vZGVsXHJcbiAgICAgICAgICBkZWZpbmVNb2RlbDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfSksXHJcbiAgICAgIFZ1ZUpzeCgpLFxyXG4gICAgICBTZXJ2ZXJVcmxDb3B5KCksXHJcbiAgICAgIHByb2dyZXNzKCksXHJcbiAgICAgIGVudi5WSVRFX1VTRV9BTExfRUxFTUVOVF9QTFVTX1NUWUxFID09PSAnZmFsc2UnXHJcbiAgICAgICAgPyBjcmVhdGVTdHlsZUltcG9ydFBsdWdpbih7XHJcbiAgICAgICAgICAgIHJlc29sdmVzOiBbRWxlbWVudFBsdXNSZXNvbHZlKCldLFxyXG4gICAgICAgICAgICBsaWJzOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeU5hbWU6ICdlbGVtZW50LXBsdXMnLFxyXG4gICAgICAgICAgICAgICAgZXNNb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlU3R5bGU6IChuYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChbJ2Zvcm0tY29udGV4dC1rZXknLCAnY2xpY2stb3V0c2lkZScsICdkYXlqcyddLmluY2x1ZGVzKG5hbWUpKSByZXR1cm4gJydcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGBlbGVtZW50LXBsdXMvZXMvY29tcG9uZW50cy8ke25hbWUucmVwbGFjZSgvXmVsLS8sICcnKX0vc3R5bGUvY3NzYFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICA6IHVuZGVmaW5lZCxcclxuICAgICAgRXNsaW50UGx1Z2luKHtcclxuICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgZmFpbE9uV2FybmluZzogZmFsc2UsXHJcbiAgICAgICAgZmFpbE9uRXJyb3I6IGZhbHNlLFxyXG4gICAgICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoudnVlJywgJ3NyYy8qKi8qLnRzJywgJ3NyYy8qKi8qLnRzeCddIC8vIFx1NjhDMFx1NjdFNVx1NzY4NFx1NjU4N1x1NEVGNlxyXG4gICAgICB9KSxcclxuICAgICAgQXV0b0ltcG9ydCh7XHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXVxyXG4gICAgICB9KSxcclxuICAgICAgQ29tcG9uZW50cyh7XHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXVxyXG4gICAgICB9KSxcclxuICAgICAgVnVlSTE4blBsdWdpbih7XHJcbiAgICAgICAgcnVudGltZU9ubHk6IHRydWUsXHJcbiAgICAgICAgY29tcG9zaXRpb25Pbmx5OiB0cnVlLFxyXG4gICAgICAgIGluY2x1ZGU6IFtyZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9sb2NhbGVzLyoqJyldXHJcbiAgICAgIH0pLFxyXG4gICAgICBjcmVhdGVTdmdJY29uc1BsdWdpbih7XHJcbiAgICAgICAgaWNvbkRpcnM6IFtwYXRoUmVzb2x2ZSgnc3JjL2Fzc2V0cy9zdmdzJyldLFxyXG4gICAgICAgIHN5bWJvbElkOiAnaWNvbi1bZGlyXS1bbmFtZV0nLFxyXG4gICAgICAgIHN2Z29PcHRpb25zOiB0cnVlXHJcbiAgICAgIH0pLFxyXG4gICAgICBQdXJnZUljb25zKCksXHJcbiAgICAgIGVudi5WSVRFX1VTRV9NT0NLID09PSAndHJ1ZSdcclxuICAgICAgICA/IHZpdGVNb2NrU2VydmUoe1xyXG4gICAgICAgICAgICBpZ25vcmU6IC9eXFxfLyxcclxuICAgICAgICAgICAgbW9ja1BhdGg6ICdtb2NrJyxcclxuICAgICAgICAgICAgbG9jYWxFbmFibGVkOiAhaXNCdWlsZCxcclxuICAgICAgICAgICAgcHJvZEVuYWJsZWQ6IGlzQnVpbGQsXHJcbiAgICAgICAgICAgIGluamVjdENvZGU6IGBcclxuICAgICAgICAgIGltcG9ydCB7IHNldHVwUHJvZE1vY2tTZXJ2ZXIgfSBmcm9tICcuLi9tb2NrL19jcmVhdGVQcm9kdWN0aW9uU2VydmVyJ1xyXG5cclxuICAgICAgICAgIHNldHVwUHJvZE1vY2tTZXJ2ZXIoKVxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICA6IHVuZGVmaW5lZCxcclxuICAgICAgVml0ZUVqc1BsdWdpbih7XHJcbiAgICAgICAgdGl0bGU6IGVudi5WSVRFX0FQUF9USVRMRVxyXG4gICAgICB9KSxcclxuICAgICAgbGF6eUltcG9ydCh7XHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbXHJcbiAgICAgICAgICBWeGVSZXNvbHZlcih7XHJcbiAgICAgICAgICAgIGxpYnJhcnlOYW1lOiAndnhlLXRhYmxlJ1xyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgICBWeGVSZXNvbHZlcih7XHJcbiAgICAgICAgICAgIGxpYnJhcnlOYW1lOiAndnhlLXBjLXVpJ1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICBdXHJcbiAgICAgIH0pLFxyXG4gICAgICBVbm9DU1MoKVxyXG4gICAgXSxcclxuXHJcbiAgICBjc3M6IHtcclxuICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgIGFwaTogJ21vZGVybi1jb21waWxlcidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxlc3M6IHtcclxuICAgICAgICAgIGFkZGl0aW9uYWxEYXRhOiAnQGltcG9ydCBcIi4vc3JjL3N0eWxlcy92YXJpYWJsZXMubW9kdWxlLmxlc3NcIjsnLFxyXG4gICAgICAgICAgamF2YXNjcmlwdEVuYWJsZWQ6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGV4dGVuc2lvbnM6IFsnLm1qcycsICcuanMnLCAnLnRzJywgJy5qc3gnLCAnLnRzeCcsICcuanNvbicsICcubGVzcycsICcuY3NzJ10sXHJcbiAgICAgIGFsaWFzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogJ3Z1ZS1pMThuJyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAndnVlLWkxOG4vZGlzdC92dWUtaTE4bi5janMuanMnXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXFxAXFwvLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiBgJHtwYXRoUmVzb2x2ZSgnc3JjJyl9L2BcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6IC9cXCR0eXBlc1xcLy8sXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogYCR7cGF0aFJlc29sdmUoJ3R5cGVzJyl9L2BcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBlc2J1aWxkOiB7XHJcbiAgICAgIHB1cmU6IGVudi5WSVRFX0RST1BfQ09OU09MRSA9PT0gJ3RydWUnID8gWydjb25zb2xlLmxvZyddIDogdW5kZWZpbmVkLFxyXG4gICAgICBkcm9wOiBlbnYuVklURV9EUk9QX0RFQlVHR0VSID09PSAndHJ1ZScgPyBbJ2RlYnVnZ2VyJ10gOiB1bmRlZmluZWRcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICB0YXJnZXQ6ICdlczIwMTUnLFxyXG4gICAgICBvdXREaXI6IGVudi5WSVRFX09VVF9ESVIgfHwgJ2Rpc3QnLFxyXG4gICAgICBzb3VyY2VtYXA6IGVudi5WSVRFX1NPVVJDRU1BUCA9PT0gJ3RydWUnLFxyXG4gICAgICAvLyBicm90bGlTaXplOiBmYWxzZSxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIHBsdWdpbnM6XHJcbiAgICAgICAgICBlbnYuVklURV9VU0VfQlVORExFX0FOQUxZWkVSID09PSAndHJ1ZSdcclxuICAgICAgICAgICAgPyBbXHJcbiAgICAgICAgICAgICAgICB2aXN1YWxpemVyKHtcclxuICAgICAgICAgICAgICAgICAgb3BlbjogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIC8vIFx1NjJDNlx1NTMwNVxyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgICd2dWUtY2h1bmtzJzogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYScsICd2dWUtaTE4biddLFxyXG4gICAgICAgICAgICAnZWxlbWVudC1wbHVzJzogWydlbGVtZW50LXBsdXMnXSxcclxuICAgICAgICAgICAgZWNoYXJ0czogWydlY2hhcnRzJywgJ2VjaGFydHMtd29yZGNsb3VkJ11cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGNzc0NvZGVTcGxpdDogIShlbnYuVklURV9VU0VfQ1NTX1NQTElUID09PSAnZmFsc2UnKSxcclxuICAgICAgY3NzVGFyZ2V0OiBbJ2Nocm9tZTMxJ11cclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogNDA1MCxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAvLyBcdTkwMDlcdTk4NzlcdTUxOTlcdTZDRDVcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBobXI6IHtcclxuICAgICAgICBvdmVybGF5OiBmYWxzZVxyXG4gICAgICB9LFxyXG4gICAgICBob3N0OiAnMC4wLjAuMCcsXHJcbiAgICAgIG9wZW46IHRydWVcclxuICAgIH0sXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgICd2dWUnLFxyXG4gICAgICAgICd2dWUtcm91dGVyJyxcclxuICAgICAgICAndnVlLXR5cGVzJyxcclxuICAgICAgICAnZWxlbWVudC1wbHVzL2VzL2xvY2FsZS9sYW5nL3poLWNuJyxcclxuICAgICAgICAnZWxlbWVudC1wbHVzL2VzL2xvY2FsZS9sYW5nL2VuJyxcclxuICAgICAgICAnQGljb25pZnkvaWNvbmlmeScsXHJcbiAgICAgICAgJ0B2dWV1c2UvY29yZScsXHJcbiAgICAgICAgJ2F4aW9zJyxcclxuICAgICAgICAncXMnLFxyXG4gICAgICAgICdlY2hhcnRzJyxcclxuICAgICAgICAnZWNoYXJ0cy13b3JkY2xvdWQnLFxyXG4gICAgICAgICdxcmNvZGUnLFxyXG4gICAgICAgICdAd2FuZ2VkaXRvci9lZGl0b3InLFxyXG4gICAgICAgICdAd2FuZ2VkaXRvci9lZGl0b3ItZm9yLXZ1ZScsXHJcbiAgICAgICAgJ3Z1ZS1qc29uLXByZXR0eScsXHJcbiAgICAgICAgJ0B6eGN2Ym4tdHMvY29yZScsXHJcbiAgICAgICAgJ2RheWpzJyxcclxuICAgICAgICAnY3JvcHBlcmpzJ1xyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlIsU0FBUyxlQUFlO0FBQ3JULFNBQVMsZUFBZTtBQUV4QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sY0FBYztBQUNyQixPQUFPLGtCQUFrQjtBQUN6QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLG1CQUFtQjtBQUMxQixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLDRCQUE0QjtBQUNyQyxTQUFTLHlCQUF5QiwwQkFBMEI7QUFDNUQsT0FBTyxZQUFZO0FBQ25CLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsWUFBWSxtQkFBbUI7QUFDeEMsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUywyQkFBMkI7QUFuQnBDLElBQU0sbUNBQW1DO0FBd0J6QyxJQUFNLE9BQU8sUUFBUSxJQUFJO0FBRXpCLFNBQVMsWUFBWSxLQUFhO0FBQ2hDLFNBQU8sUUFBUSxNQUFNLEtBQUssR0FBRztBQUMvQjtBQUVBLElBQU8sc0JBQVEsQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUE2QjtBQUMzRCxNQUFJLE1BQU0sQ0FBQztBQUNYLFFBQU0sVUFBVSxZQUFZO0FBQzVCLE1BQUksQ0FBQyxTQUFTO0FBQ1osVUFBTSxRQUFRLFFBQVEsS0FBSyxDQUFDLE1BQU0sV0FBVyxRQUFRLEtBQUssQ0FBQyxJQUFJLFFBQVEsS0FBSyxDQUFDLEdBQUcsSUFBSTtBQUFBLEVBQ3RGLE9BQU87QUFDTCxVQUFNLFFBQVEsTUFBTSxJQUFJO0FBQUEsRUFDMUI7QUFFQSxTQUFPO0FBQUEsSUFDTCxNQUFNLElBQUk7QUFBQSxJQUNWLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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
