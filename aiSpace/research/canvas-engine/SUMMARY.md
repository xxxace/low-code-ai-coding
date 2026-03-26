# 画布引擎与自由布局调研总结

> 调研时间：2026-03-26
> 目的：研究设计器画布的核心实现，为自由布局拖拽提供技术方案

## 一、核心问题分析

### 1.1 自由布局的数据结构

```typescript
interface FreePosition {
  x: number        // 距左边距（px）
  y: number        // 距顶边距（px）
  width: number    // 宽度（px）
  height: number   // 高度（px）
  zIndex: number   // 层级（用于重叠）
  rotate: number   // 旋转角度（°）
  locked: boolean  // 是否锁定
}
```

### 1.2 需要解决的技术问题

| 问题 | 描述 | 复杂度 |
|------|------|--------|
| 拖拽移动 | mousedown → mousemove → mouseup 事件链 | 中 |
| 缩放手柄 | 8方向（nw/n/ne/e/se/s/sw/w）拖拽缩放 | 高 |
| 吸附对齐 | 组件间对齐、网格吸附、中心线吸附 | 高 |
| 多选拖拽 | 框选多个组件同时移动 | 中 |
| 组合/解组 | 多个组件组合为一个整体 | 中 |
| 画布缩放 | 鼠标滚轮缩放、抓手平移 | 低 |

## 二、技术方案对比

### 2.1 方案A：纯 DOM + CSS 实现（推荐）

**原理**：
- 使用 `position: absolute` 定位组件
- 通过 `mousedown/mousemove/mouseup` 计算坐标偏移
- 使用 CSS `transform` 实现缩放和旋转

**优点**：
- 轻量，无额外依赖
- 与 Vue 3 响应式天然集成
- 调试方便（DOM 可见）

**缺点**：
- 大量组件（> 100）时性能可能下降
- 需要自己实现吸附算法

**适用场景**：表单设计器（通常 < 50 个组件）

**核心代码示例**：
```typescript
// 拖拽核心逻辑
const useDrag = (element: Ref<HTMLElement | null>) => {
  const position = reactive({ x: 0, y: 0 })
  let startX = 0, startY = 0, startPosX = 0, startPosY = 0

  const onMouseDown = (e: MouseEvent) => {
    startX = e.clientX
    startY = e.clientY
    startPosX = position.x
    startPosY = position.y
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    position.x = startPosX + dx
    position.y = startPosY + dy
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  return { position, onMouseDown }
}
```

### 2.2 方案B：使用 moveable 库

**简介**：
- GitHub: https://github.com/daybrush/moveable
- Stars: 10.7k
- License: MIT

**核心能力**：
| 能力 | 说明 |
|------|------|
| Draggable | 拖拽移动 |
| Resizable | 8方向缩放 |
| Rotatable | 旋转 |
| Scalable | 缩放（保持比例） |
| Snappable | 吸附对齐（内置） |
| Groupable | 组合 |
| Pinchable | 双指缩放（移动端） |

**优点**：
- 功能完整，开箱即用
- 吸附算法内置
- 多框架支持（React/Vue/Angular）

**缺点**：
- 包体积较大（~100KB gzip）
- 与 Vue 3 响应式需要适配
- 某些高级功能需要付费版

**使用示例**：
```typescript
import Moveable from 'moveable'

const moveable = new Moveable(document.body, {
  target: document.querySelector('.target'),
  draggable: true,
  resizable: true,
  snappable: true,
  snapThreshold: 5,
})

moveable.on('drag', (e) => {
  e.target.style.transform = e.transform
})

moveable.on('resize', (e) => {
  e.target.style.width = `${e.width}px`
  e.target.style.height = `${e.height}px`
})
```

### 2.3 方案C：Canvas 实现（fabric.js / Konva.js）

**适用场景**：大屏可视化、图形编辑器（大量元素）

**优点**：
- 高性能（GPU 加速）
- 丰富的图形变换能力

**缺点**：
- 与 Vue 集成复杂
- 调试困难（Canvas 内容不可见）
- 学习曲线陡峭

**结论**：对于表单设计器场景，不推荐使用 Canvas 方案。

## 三、吸附算法原理

### 3.1 吸附类型

| 类型 | 说明 | 阈值建议 |
|------|------|----------|
| 网格吸附 | 对齐到网格线 | 10px 网格 |
| 组件吸附 | 对齐到其他组件边缘 | 5px |
| 中心线吸附 | 对齐到其他组件的中心线 | 5px |
| 等间距吸附 | 组件间等距排列 | 5px |

### 3.2 吸附算法核心

```typescript
interface SnapLine {
  type: 'horizontal' | 'vertical'
  position: number  // 线的位置（x 或 y）
  start: number     // 起始点
  end: number       // 结束点
}

// 检测吸附
const checkSnap = (
  currentPos: { x: number; y: number; width: number; height: number },
  otherComponents: FreePosition[],
  threshold = 5
): { x: number | null; y: number | null; lines: SnapLine[] } => {
  const lines: SnapLine[] = []
  let snapX: number | null = null
  let snapY: number | null = null

  const currentLeft = currentPos.x
  const currentRight = currentPos.x + currentPos.width
  const currentTop = currentPos.y
  const currentBottom = currentPos.y + currentPos.height
  const currentCenterX = currentPos.x + currentPos.width / 2
  const currentCenterY = currentPos.y + currentPos.height / 2

  for (const other of otherComponents) {
    const otherLeft = other.x
    const otherRight = other.x + other.width
    const otherTop = other.y
    const otherBottom = other.y + other.height
    const otherCenterX = other.x + other.width / 2
    const otherCenterY = other.y + other.height / 2

    // 左边对齐
    if (Math.abs(currentLeft - otherLeft) < threshold) {
      snapX = otherLeft
      lines.push({ type: 'vertical', position: otherLeft, start: Math.min(currentTop, otherTop), end: Math.max(currentBottom, otherBottom) })
    }
    // 右边对齐
    if (Math.abs(currentRight - otherRight) < threshold) {
      snapX = otherRight - currentPos.width
      lines.push({ type: 'vertical', position: otherRight, start: Math.min(currentTop, otherTop), end: Math.max(currentBottom, otherBottom) })
    }
    // 中心线对齐
    if (Math.abs(currentCenterX - otherCenterX) < threshold) {
      snapX = otherCenterX - currentPos.width / 2
      lines.push({ type: 'vertical', position: otherCenterX, start: Math.min(currentTop, otherTop), end: Math.max(currentBottom, otherBottom) })
    }
    // Y 方向同理...
  }

  return { x: snapX, y: snapY, lines }
}
```

## 四、推荐方案

### 4.1 技术选型

对于 MES 表单设计器场景，**推荐方案A（纯 DOM + CSS）**，原因：

1. **组件数量有限**：表单通常 < 50 个字段，DOM 性能足够
2. **与 Vue 3 集成简单**：直接使用响应式数据驱动
3. **包体积小**：无需引入额外库
4. **调试方便**：DOM 可见，Vue DevTools 可追踪

### 4.2 可选增强

如果后续需要更强大的吸附能力，可以**按需引入 moveable**：

```typescript
// 仅在自由布局模式下加载
const Moveable = await import('moveable')
```

### 4.3 实现优先级

| 优先级 | 功能 | 预计工作量 |
|--------|------|-----------|
| P0 | 拖拽移动 | 1 天 |
| P0 | 坐标存储到 Schema | 0.5 天 |
| P1 | 8方向缩放手柄 | 2 天 |
| P1 | 吸附对齐（基础） | 2 天 |
| P2 | 多选拖拽 | 1 天 |
| P2 | 组合/解组 | 1 天 |
| P3 | 画布缩放/平移 | 1 天 |

## 五、参考资源

- [visual-drag-demo 原理分析](https://github.com/woai3c/Front-end-articles/issues/19)
- [moveable 官方文档](https://daybrush.com/moveable/)
- [fabric.js](http://fabricjs.com/) - Canvas 方案备选
- [Konva.js](https://konvajs.org/) - Canvas 方案备选