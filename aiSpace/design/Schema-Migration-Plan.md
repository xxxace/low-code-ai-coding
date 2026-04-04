# [已归档] Step 5: Schema 迁移方案 — layoutMode → x-position-type

> ✅ 此迁移方案已于 2026-03-29 执行完毕。
>
> - `layoutMode` 已完全移除
> - `x-position-type: 'relative' | 'absolute'` 已成为唯一布局模式标识
> - FlowLayout.vue / FreeLayout.vue / FreeCanvas.vue / Designer.vue / PropertyPanel.vue 均已删除
> - XLayout.vue + AbsoluteNodeOverlay.vue 已替代上述组件
>
> 当前架构请查阅：`ARCHITECTURE.md`（待更新）和 `FEATURE_CHECKLIST.md`
