# visual-drag-demo 研究总结

> 研究时间：2026-03-25
> GitHub：https://github.com/woai3c/visual-drag-demo
> Stars：5.6k
> 技术栈：Vue 3

## 一、项目定位

**visual-drag-demo** 是一个**低代码教学项目**，核心理念是 **"教学演示，原理清晰"**。

### 特点

| 特性 | visual-drag-demo | 其他项目 |
|------|------------------|----------|
| 定位 | 教学项目 | 生产项目 |
| 文档 | 5篇详细原理分析 | API 文档 |
| 复杂度 | 简单易懂 | 功能完整 |
| 适用场景 | 学习原理 | 实际使用 |

---

## 二、功能点

```
1.  编辑器
2.  自定义组件（文本、图片、矩形、圆形、直线、星形、三角形、按钮、表格、组合）
3.  接口请求（通过接口请求组件数据）
4.  组件联动
5.  拖拽
6.  删除组件、调整图层层级
7.  放大缩小
8.  撤消、重做
9.  组件属性设置
10. 吸附
11. 预览、保存代码
12. 绑定事件
13. 绑定动画
14. 拖拽旋转
15. 复制粘贴剪切
16. 多个组件的组合和拆分
17. 锁定组件
18. 网格线
```

---

## 三、核心架构

### 3.1 编辑器结构

```
┌─────────────────────────────────────────┐
│              顶部工具栏                   │
├──────────┬──────────────────┬───────────┤
│          │                  │           │
│  左侧    │    中间画布       │   右侧    │
│  组件    │    编辑区域       │   属性    │
│  面板    │                  │   面板    │
│          │                  │           │
└──────────┴──────────────────┴───────────┘
```

### 3.2 数据结构

```javascript
// 组件数据结构
const componentData = {
  id: 'component-1',
  componentName: 'VText',  // 组件名
  label: '文字',           // 组件标签
  propValue: 'Hello',      // 组件值
  icon: 'icon-text',       // 图标
  animations: [],          // 动画列表
  events: {},              // 事件绑定
  style: {                 // 样式
    width: 200,
    height: 100,
    top: 0,
    left: 0,
    rotate: 0
  },
  group: {},               // 组合信息
  isLock: false            // 是否锁定
}
```

### 3.3 核心功能实现

#### 拖拽
```javascript
// 拖拽核心逻辑
const handleMouseDown = (e) => {
  // 记录初始位置
  startX = e.clientX
  startY = e.clientY
  
  // 监听移动和释放
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  // 计算偏移
  const curX = e.clientX
  const curY = e.clientY
  const top = curY - startY
  const left = curX - startX
  
  // 更新组件位置
  component.style.top = top
  component.style.left = left
}
```

#### 撤销/重做
```javascript
// 快照模式
class Snapshot {
  constructor() {
    this.snapshots = []  // 快照栈
    this.index = -1      // 当前索引
  }
  
  // 保存快照
  save(data) {
    this.snapshots[++this.index] = JSON.stringify(data)
    this.snapshots = this.snapshots.slice(0, this.index + 1)
  }
  
  // 撤销
  undo() {
    if (this.index > 0) {
      return JSON.parse(this.snapshots[--this.index])
    }
  }
  
  // 重做
  redo() {
    if (this.index < this.snapshots.length - 1) {
      return JSON.parse(this.snapshots[++this.index])
    }
  }
}
```

#### 吸附
```javascript
// 吸附检测
const checkAdsorption = (component) => {
  const threshold = 5  // 吸附阈值
  
  // 检测与其他组件的对齐
  components.forEach(other => {
    // 水平对齐
    if (Math.abs(component.style.top - other.style.top) < threshold) {
      component.style.top = other.style.top
    }
    // 垂直对齐
    if (Math.abs(component.style.left - other.style.left) < threshold) {
      component.style.left = other.style.left
    }
  })
}
```

---

## 四、组件联动

### 4.1 事件绑定

```javascript
// 组件事件配置
const events = {
  onClick: [
    {
      action: 'changeStyle',
      target: 'component-2',
      value: { color: 'red' }
    }
  ]
}
```

### 4.2 联动执行

```javascript
// 执行联动
const executeEvent = (event, component) => {
  event.forEach(action => {
    const target = findComponent(action.target)
    switch (action.action) {
      case 'changeStyle':
        Object.assign(target.style, action.value)
        break
      case 'changeValue':
        target.propValue = action.value
        break
    }
  })
}
```

---

## 五、对 StdForm 的借鉴意义

### 5.1 可借鉴点

| visual-drag-demo 设计 | StdForm 可借鉴 |
|-----------------------|----------------|
| 快照撤销/重做 | 表单操作历史 |
| 拖拽吸附 | 字段对齐 |
| 组件联动 | 字段联动 |
| 事件绑定 | 字段事件 |
| 属性面板 | 字段属性配置 |

### 5.2 教学价值

这个项目最大的价值在于**清晰的原理讲解**：

1. **拖拽实现**：鼠标事件 + 坐标计算
2. **撤销/重做**：快照栈模式
3. **吸附对齐**：阈值检测
4. **组件组合**：树形数据结构
5. **画布缩放**：CSS transform

### 5.3 关键差异

| 维度 | visual-drag-demo | StdForm 需求 |
|------|------------------|--------------|
| 定位 | 画布编辑器 | 表单系统 |
| 数据 | 组件树 | 表单字段 |
| 布局 | 自由布局 | 栅格布局 |
| 表单 | 无 | 核心功能 |

---

## 六、优缺点分析

### 优点

1. **教学价值高**：5篇详细原理分析文章
2. **代码清晰**：易于理解和学习
3. **功能完整**：覆盖低代码核心功能
4. **开源免费**：MIT 协议

### 局限

1. **非生产级**：仅用于教学
2. **无表单功能**：不适用表单场景
3. **无国际化**：需要自行实现
4. **Vue 2**：未升级到 Vue 3

---

## 七、学习资源

### 文档链接

1. [可视化拖拽组件库一些技术要点原理分析](https://github.com/woai3c/Front-end-articles/issues/19)
2. [可视化拖拽组件库一些技术要点原理分析（二）](https://github.com/woai3c/Front-end-articles/issues/20)
3. [可视化拖拽组件库一些技术要点原理分析（三）](https://github.com/woai3c/Front-end-articles/issues/21)
4. [可视化拖拽组件库一些技术要点原理分析（四）](https://github.com/woai3c/Front-end-articles/issues/33)
5. [低代码与大语言模型的探索实践](https://github.com/woai3c/Front-end-articles/issues/45)

---

## 八、后续研究建议

1. **源码学习**：阅读源码理解实现细节
2. **原理应用**：将学到的原理应用到 StdForm
3. **Vue 3 迁移**：参考实现 Vue 3 版本
4. **表单扩展**：扩展表单相关功能

---

## 九、参考链接

- GitHub：https://github.com/woai3c/visual-drag-demo
- 在线演示：https://woai3c.github.io/visual-drag-demo
- 作者文章：https://github.com/woai3c/Front-end-articles