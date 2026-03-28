/**
 * @file core/__tests__/smoke.test.ts
 * @description 冒烟测试 —— 验证 Vitest 脚手架可用
 */

// @vitest-environment node

import { describe, it, expect } from 'vitest'

describe('Vitest 脚手架冒烟测试', () => {
  it('基础断言正常工作', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toContain('ell')
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('imports 正常工作', async () => {
    const { resolveLocalizedString } = await import('../schema')
    expect(resolveLocalizedString('你好')).toBe('你好')
    expect(resolveLocalizedString({ zh: '中文', en: 'English' })).toBe('中文')
    expect(resolveLocalizedString({ zh: 'English', en: 'English' }, 'en')).toBe('English')
  })
})
