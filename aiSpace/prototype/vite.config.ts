import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  optimizeDeps: {
    include: ['vue', 'element-plus', '@element-plus/icons-vue', 'pinia'],
  },

  // ---- Vitest 测试配置 ----
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/designer/engine/**'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts'],
    },
  },
})
