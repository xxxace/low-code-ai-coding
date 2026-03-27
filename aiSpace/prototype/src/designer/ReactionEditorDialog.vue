<!--
  ReactionEditorDialog.vue
  联动规则编辑器 —— 主从三区布局

  布局：
  ┌─────────────────────────────────────────┐
  │  顶栏：搜索框 + 新增按钮                  │
  ├───────────────┬─────────────────────────┤
  │  左：规则列表  │  右：规则详情编辑区       │
  │  - 规则名称   │  - 规则名称（可编辑）     │
  │  - 启用徽章   │  - 启用/禁用 toggle      │
  │  - 点击选中   │  - 条件/依赖/目标/效果    │
  └───────────────┴─────────────────────────┘

  徽章语义：绿 = 规则已启用，灰 = 规则已禁用
-->
<template>
  <el-dialog
    v-model="visible"
    title="联动规则编辑"
    width="780px"
    :close-on-click-modal="false"
    append-to-body
    class="reaction-dialog"
    :style="{ '--dialog-body-padding': '0' }"
  >
    <!-- ① 顶部工具栏 -->
    <div class="rd-toolbar">
      <el-input
        v-model="searchText"
        placeholder="搜索规则名称或条件..."
        size="small"
        clearable
        class="rd-search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button size="small" type="primary" @click="addReaction">
        + 新增规则
      </el-button>
    </div>

    <!-- ② 主体：左列表 + 右详情 -->
    <div class="rd-body">

      <!-- 左侧规则列表 -->
      <div class="rd-list">
        <div v-if="filteredIndexes.length === 0" class="rd-list__empty">
          {{ searchText ? '无匹配规则' : '暂无规则' }}
        </div>
        <div
          v-for="idx in filteredIndexes"
          :key="idx"
          class="rd-list__item"
          :class="{ 'is-active': activeIndex === idx, 'is-disabled': localReactions[idx].enabled === false }"
          @click="activeIndex = idx"
        >
          <div class="rd-list__item-name">
            {{ localReactions[idx].name || `规则 ${idx + 1}` }}
          </div>
          <div class="rd-list__item-meta">
            <!-- 启用/禁用状态徽章 -->
            <span
              class="rd-badge"
              :class="localReactions[idx].enabled === false ? 'rd-badge--disabled-rule' : 'rd-badge--enabled'"
            >
              {{ localReactions[idx].enabled === false ? '禁用' : '启用' }}
            </span>
            <span class="rd-list__item-when">{{ localReactions[idx].when || '始终' }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧详情区 -->
      <div class="rd-detail">

        <!-- 未选中 / 无规则 提示 -->
        <div v-if="activeIndex === -1" class="rd-detail__empty">
          <div v-if="localReactions.length === 0">
            点击「新增规则」开始添加
          </div>
          <div v-else>
            从左侧选择一条规则进行编辑
          </div>
        </div>

        <!-- 规则详情表单 -->
        <template v-else>
          <div class="rd-detail__header">
            <!-- 规则名称（可编辑） -->
            <el-input
              v-model="localReactions[activeIndex].name"
              placeholder="规则名称（可自定义，便于识别）"
              size="small"
              class="rd-name-input"
            />
            <!-- 启用/禁用 toggle -->
            <el-tooltip
              :content="localReactions[activeIndex].enabled === false ? '点击启用此规则' : '点击禁用此规则'"
              placement="top"
            >
              <el-button
                size="small"
                :type="localReactions[activeIndex].enabled === false ? 'info' : 'success'"
                plain
                @click="toggleEnabled(activeIndex)"
              >
                {{ localReactions[activeIndex].enabled === false ? '已禁用' : '已启用' }}
              </el-button>
            </el-tooltip>
            <el-button size="small" text type="danger" @click="removeReaction(activeIndex)">
              删除
            </el-button>
          </div>

          <!-- 变量说明 -->
          <div class="rd-vars-tip">
            <code>$self.value</code> 当前字段值 &nbsp;
            <code>$deps[0]</code> 依赖字段[0]值 &nbsp;
            <code>$values.路径</code> 任意字段值
          </div>

          <el-form
            label-width="80px"
            label-position="left"
            size="small"
            class="rd-form"
          >
            <!-- 条件表达式 -->
            <el-form-item label="条件表达式">
              <el-input
                v-model="localReactions[activeIndex].when"
                placeholder="如：$self.value === true 或 $deps[0] > 10"
              />
              <div class="form-hint">空 = 始终执行「满足时」的效果</div>
            </el-form-item>

            <!-- 依赖字段 -->
            <el-form-item label="依赖字段">
              <el-input
                v-model="depsInput[activeIndex]"
                placeholder="字段路径，逗号分隔（使用 $deps 时填写）"
                @change="updateDeps(activeIndex, $event)"
              />
              <div class="form-hint">仅在条件中使用了 $deps[n] 时才需填写</div>
            </el-form-item>

            <!-- 目标字段 -->
            <el-form-item label="目标字段">
              <el-input
                v-model="targetInput[activeIndex]"
                placeholder="空 = 作用自身；主动联动时填字段路径"
                @change="updateTarget(activeIndex, $event)"
              />
              <div class="form-hint">例：subordinateCount（多个用逗号分隔）</div>
            </el-form-item>

            <el-divider style="margin: 8px 0" />

            <!-- 满足时效果 -->
            <el-form-item label="满足时">
              <el-select
                v-model="fulfillType[activeIndex]"
                style="width:100%"
                @change="updateFulfill(activeIndex)"
              >
                <el-option label="设置显示" value="visible" />
                <el-option label="设置隐藏" value="hidden" />
                <el-option label="禁用字段" value="disabled" />
                <el-option label="设置必填" value="required" />
                <el-option label="取消必填" value="notRequired" />
              </el-select>
            </el-form-item>

            <!-- 不满足时（自动推导，只读） -->
            <el-form-item label="不满足时">
              <div class="rd-otherwise">{{ otherwiseLabel(activeIndex) }}</div>
            </el-form-item>

            <el-divider style="margin: 8px 0" />

            <!-- 备注（多行，允许用户写注释） -->
            <el-form-item label="备注">
              <el-input
                v-model="localReactions[activeIndex].remark"
                type="textarea"
                :rows="3"
                placeholder="记录这条规则的用途、背景或注意事项..."
              />
            </el-form-item>

          </el-form>
        </template>

      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type { Reaction } from '../types/schema'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  modelValue: boolean
  reactions: Reaction[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', reactions: Reaction[]): void
}>()

// ============================================================
// 常量
// ============================================================

/** 效果类型 → 满足时的自然语言描述（用于摘要卡片） */
const FULFILL_LABELS: Record<string, string> = {
  visible: '显示',
  hidden: '隐藏',
  disabled: '禁用字段',
  required: '必填',
  notRequired: '取消必填',
}

/** 效果类型 → "不满足时"自动推导描述 */
const OTHERWISE_LABELS: Record<string, string> = {
  visible: '隐藏',
  hidden: '显示',
  disabled: '恢复可编辑',
  required: '取消必填',
  notRequired: '设为必填',
}

// ============================================================
// 弹窗可见性
// ============================================================

const visible = ref(props.modelValue)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) syncFromProps()
})

watch(visible, (v) => {
  emit('update:modelValue', v)
})

// ============================================================
// 本地状态（打开弹窗时深拷贝）
// ============================================================

const localReactions = ref<Reaction[]>([])
const depsInput = ref<string[]>([])
const targetInput = ref<string[]>([])
const fulfillType = ref<string[]>([])

/** 当前选中规则下标，-1 = 未选中 */
const activeIndex = ref(-1)
/** 搜索关键词 */
const searchText = ref('')

function syncFromProps() {
  localReactions.value = props.reactions.map((r) => JSON.parse(JSON.stringify(r)))
  depsInput.value = localReactions.value.map((r) => r.dependencies?.join(', ') ?? '')
  targetInput.value = localReactions.value.map((r) => {
    if (!r.target) return ''
    return Array.isArray(r.target) ? r.target.join(', ') : r.target
  })
  fulfillType.value = localReactions.value.map(parseFulfillType)
  // 默认选中第一条
  activeIndex.value = localReactions.value.length > 0 ? 0 : -1
  searchText.value = ''
}

syncFromProps()

// ============================================================
// 搜索过滤
// ============================================================

const filteredIndexes = computed<number[]>(() => {
  const kw = searchText.value.trim().toLowerCase()
  return localReactions.value
    .map((_, i) => i)
    .filter((i) => {
      if (!kw) return true
      const r = localReactions.value[i]
      const name = (r.name ?? `规则 ${i + 1}`).toLowerCase()
      const when = (r.when ?? '').toLowerCase()
      return name.includes(kw) || when.includes(kw)
    })
})

// ============================================================
// 工具函数
// ============================================================

function parseFulfillType(r: Reaction): string {
  const state = r.fulfill?.state ?? {}
  if ('visible' in state) return (state.visible as boolean) ? 'visible' : 'hidden'
  if ('disabled' in state) return 'disabled'
  if ('required' in state) return (state.required as boolean) ? 'required' : 'notRequired'
  return 'visible'
}

function otherwiseLabel(idx: number): string {
  return OTHERWISE_LABELS[fulfillType.value[idx]] ?? '—'
}

// ============================================================
// 操作
// ============================================================

function addReaction() {
  localReactions.value.push({
    name: '',
    remark: '',
    enabled: true,
    dependencies: [],
    when: '',
    fulfill: { state: { visible: true } },
    otherwise: { state: { visible: false } },
  })
  depsInput.value.push('')
  targetInput.value.push('')
  fulfillType.value.push('visible')
  // 自动选中新增的规则
  activeIndex.value = localReactions.value.length - 1
}

function removeReaction(idx: number) {
  localReactions.value.splice(idx, 1)
  depsInput.value.splice(idx, 1)
  targetInput.value.splice(idx, 1)
  fulfillType.value.splice(idx, 1)
  // 重新选中
  if (localReactions.value.length === 0) {
    activeIndex.value = -1
  } else {
    activeIndex.value = Math.min(idx, localReactions.value.length - 1)
  }
}

/** 切换规则启用/禁用状态 */
function toggleEnabled(idx: number) {
  const r = localReactions.value[idx]
  // enabled 默认为 true，所以 undefined 等同于 true
  r.enabled = r.enabled === false ? true : false
}

function updateDeps(idx: number, value: string) {
  localReactions.value[idx].dependencies = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function updateTarget(idx: number, value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    delete localReactions.value[idx].target
    return
  }
  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean)
  localReactions.value[idx].target = parts.length === 1 ? parts[0] : parts
}

function updateFulfill(idx: number) {
  const type = fulfillType.value[idx]
  const r = localReactions.value[idx]
  if (type === 'visible') {
    r.fulfill = { state: { visible: true } }
    r.otherwise = { state: { visible: false } }
  } else if (type === 'hidden') {
    r.fulfill = { state: { visible: false } }
    r.otherwise = { state: { visible: true } }
  } else if (type === 'disabled') {
    r.fulfill = { state: { disabled: true } }
    r.otherwise = { state: { disabled: false } }
  } else if (type === 'required') {
    r.fulfill = { state: { required: true } }
    r.otherwise = { state: { required: false } }
  } else if (type === 'notRequired') {
    r.fulfill = { state: { required: false } }
    r.otherwise = { state: { required: true } }
  }
}

// ============================================================
// 确认 / 取消
// ============================================================

function handleConfirm() {
  const result: Reaction[] = localReactions.value.map((r, i) => {
    const reaction: Reaction = {
      ...(r.name ? { name: r.name } : {}),
      ...(r.remark ? { remark: r.remark } : {}),
      // enabled 为 false 时保留，为 true 时省略（减少 schema 冗余）
      ...(r.enabled === false ? { enabled: false } : {}),
      dependencies: r.dependencies,
      when: r.when,
      fulfill: r.fulfill,
      otherwise: r.otherwise,
    }
    // 目标字段
    const t = targetInput.value[i]?.trim()
    if (t) {
      const parts = t.split(',').map((s) => s.trim()).filter(Boolean)
      reaction.target = parts.length === 1 ? parts[0] : parts
    }
    return reaction
  })
  emit('confirm', result)
  visible.value = false
}

function handleCancel() {
  visible.value = false
}
</script>

<style scoped>
/* ============================================================
   弹窗整体 —— 去掉 el-dialog body 默认 padding
   ============================================================ */
:deep(.el-dialog__body) {
  padding: 0 !important;
}

/* ============================================================
   顶部工具栏
   ============================================================ */
.rd-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.rd-search {
  flex: 1;
}

/* ============================================================
   主体：左列表 + 右详情
   ============================================================ */
.rd-body {
  display: flex;
  height: 440px;
  overflow: hidden;
}

/* ---- 左侧列表 ---- */
.rd-list {
  width: 210px;
  flex-shrink: 0;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
  background: #fafafa;
}

.rd-list__empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 32px 8px;
}

.rd-list__item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
  min-height: 52px;
}

.rd-list__item:hover {
  background: #f0f7ff;
}

.rd-list__item.is-active {
  background: #e8f4ff;
  border-left: 3px solid #409eff;
  padding-left: 9px;
}

/* 禁用状态的规则行：整体半透明 */
.rd-list__item.is-disabled {
  opacity: 0.5;
}

.rd-list__item-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-list__item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ---- 状态徽章 ---- */
.rd-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 2px;
  flex-shrink: 0;
  font-weight: 500;
}

/* 绿 = 规则已启用 */
.rd-badge--enabled       { background: #f0f9eb; color: #67c23a; }
/* 灰 = 规则已禁用 */
.rd-badge--disabled-rule { background: #f5f5f5; color: #909399; }

.rd-list__item-when {
  font-size: 10px;
  color: #c0c4cc;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* ---- 右侧详情 ---- */
.rd-detail {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.rd-detail__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
  font-size: 13px;
  text-align: center;
  padding: 0 24px;
}

.rd-detail__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.rd-name-input {
  flex: 1;
}

/* 变量说明 */
.rd-vars-tip {
  background: #f0f9ff;
  border-bottom: 1px solid #e8f4ff;
  padding: 6px 16px;
  font-size: 11px;
  color: #555;
  line-height: 1.8;
}

.rd-vars-tip code {
  background: #e6f4ff;
  border-radius: 2px;
  padding: 1px 4px;
  font-family: monospace;
  font-size: 10px;
  color: #0958d9;
  margin-right: 2px;
}

/* 表单区 */
.rd-form {
  padding: 12px 16px 16px;
}

.rd-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.form-hint {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.4;
}

.rd-otherwise {
  font-size: 12px;
  color: #909399;
  line-height: 28px;
  padding-left: 2px;
}
</style>
