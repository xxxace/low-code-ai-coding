/**
 * @file types/schema.ts
 * @description 兼容垫片（Compatibility Shim）
 *
 * 此文件保持向后兼容，将现有的 20+ 个 import '../types/schema' 导向新位置。
 * 新代码请直接从 '../core/schema' 导入。
 */
export * from '../core/schema'
