/**
 * @file designer/composables/useKeyboardShortcuts.ts
 * @description 设计器键盘快捷键 Composable
 *
 * 支持快捷键：
 * - Ctrl+Z：撤销
 * - Ctrl+Y / Ctrl+Shift+Z：重做
 * - Delete：删除选中节点
 * - Escape：取消选中
 * - Ctrl+D / Ctrl+C+Ctrl+V：复制选中节点
 * - Arrow keys：微调 absolute 节点位置（1px，Shift+方向键 10px）
 */

import type { DesignerEngine } from "../engine/designerEngine";

export function useKeyboardShortcuts(engine: DesignerEngine) {
  /** 内存中的复制节点 ID（Ctrl+C 写入，Ctrl+V 读取） */
  let copiedNodeId: string | null = null;

  function handleKeyDown(e: KeyboardEvent): void {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && e.key === "z") {
      e.preventDefault();
      engine.undo();
    } else if (isCtrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
      e.preventDefault();
      engine.redo();
    } else if (e.key === "Delete") {
      if (engine.selectedNodeId.value) {
        e.preventDefault();
        engine.removeNode(engine.selectedNodeId.value);
      }
    } else if (e.key === "Escape") {
      engine.selectNode(null);
    }
    // Ctrl+D：复制（duplicate）选中节点
    else if (isCtrl && e.key === "d") {
      e.preventDefault();
      if (engine.selectedNodeId.value) {
        engine.duplicateNode(engine.selectedNodeId.value);
      }
    }
    // Ctrl+C：复制节点 ID 到内存缓冲区
    else if (isCtrl && e.key === "c") {
      if (engine.selectedNodeId.value) {
        copiedNodeId = engine.selectedNodeId.value;
      }
    }
    // Ctrl+V：从内存缓冲区粘贴（复制并偏移）
    else if (isCtrl && e.key === "v") {
      if (copiedNodeId) {
        e.preventDefault();
        engine.duplicateNode(copiedNodeId);
        copiedNodeId = null;
      }
    }
    // 方向键微调 absolute 节点
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      if (!engine.selectedNodeId.value) return;
      const step = e.shiftKey ? 10 : 1;
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };
      engine.nudgeNode(engine.selectedNodeId.value, map[e.key], step);
      e.preventDefault();
    }
  }

  return { handleKeyDown };
}
