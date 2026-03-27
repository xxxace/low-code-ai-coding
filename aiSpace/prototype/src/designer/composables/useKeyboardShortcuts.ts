/**
 * @file designer/composables/useKeyboardShortcuts.ts
 * @description 设计器键盘快捷键 Composable
 *
 * 支持快捷键：
 * - Ctrl+Z：撤销
 * - Ctrl+Y / Ctrl+Shift+Z：重做
 * - Delete / Backspace：删除选中节点
 * - Escape：取消选中
 */

import type { DesignerEngine } from '../engine/designerEngine'

export function useKeyboardShortcuts(engine: DesignerEngine) {
  function handleKeyDown(e: KeyboardEvent): void {
    const isCtrl = e.ctrlKey || e.metaKey

    if (isCtrl && e.key === 'z') {
      e.preventDefault()
      engine.undo()
    } else if (isCtrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      engine.redo()
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (engine.selectedNodeId.value) {
        e.preventDefault()
        engine.removeNode(engine.selectedNodeId.value)
      }
    } else if (e.key === 'Escape') {
      engine.selectNode(null)
    }
  }

  return { handleKeyDown }
}
