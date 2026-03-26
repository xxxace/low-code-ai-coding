# 物料系统研究清单

> 创建时间：2026-03-26
> 目标：研究物料注册机制，为低代码设计器组件扩展提供参考

## 核心问题

1. 如何注册自定义组件？
2. 如何定义组件 props schema？
3. 如何处理设计器中的组件生命周期？
4. 如何与现有 StdForm 组件（RemoteSelect、OptionInput 等）集成？

## 研究计划

| 序号 | 研究主题 | 来源项目 | 状态 | 完成日期 |
|------|----------|----------|------|----------|
| 1 | Formily 组件装饰器模式 | Formily | ⏳ 待研究 | - |
| 2 | VTJ.PRO BlockSchema 物料 | VTJ.PRO | ⏳ 待研究 | - |
| 3 | variant-form Widget 注册 | variant-form3-vite | ⏳ 待研究 | - |
| 4 | 现有 StdForm 组件适配方案 | 项目代码 | ⏳ 待研究 | - |

## 输出目录

每个主题完成后输出到：
- `D:\demo\ai\aiSpace\research\material-system\`
  - `01-formily-component.md`
  - `02-vtj-block.md`
  - `03-variant-widget.md`
  - `04-stdform-adapter.md`
  - `SUMMARY.md` - 最终汇总

## 研究方法

1. **代码阅读**：直接阅读源码，提取核心模式
2. **文档查阅**：查阅官方文档，理解设计意图
3. **对比分析**：对比不同方案的优缺点
4. **适配设计**：设计适合当前原型的物料系统

## 当前进度

- [x] 研究主题 1：Formily 组件装饰器模式 ✅ 2026-03-26
- [x] 研究主题 2：VTJ.PRO BlockSchema 物料 ✅ 2026-03-26
- [x] 研究主题 3：variant-form Widget 注册 ✅ 2026-03-26
- [ ] 研究主题 4：现有 StdForm 组件适配方案
- [ ] 输出 SUMMARY.md 汇总文档