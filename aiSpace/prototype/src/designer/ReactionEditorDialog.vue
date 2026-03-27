<!--
  ReactionEditorDialog.vue
  联动规则编辑弹窗

  设计原则（奥卡姆剃刀）：
  - 面板只显示摘要，编辑全在这里
  - 表达式直接编辑 when 字符串，不区分 $self / $deps
  - 目标字段（target）可选填，空 = 作用自身
-->
<template>
  <el-dialog
    v-model="visible"
    title="联动规则编辑"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    class="reaction-dialog"
  >
    <!-- 帮助说明 -->
    <div class="reaction-help">
      <div class="reaction-help__title">可用变量</div>
      <div class="reaction-help__vars">
        <code>$self.value</code> 当前字段的值 &nbsp;|&nbsp;
        <code>$deps[0]</code> 依赖字段 [0] 的值 &nbsp;|&nbsp;
        <code>$values.字段路径</code> 任意字段的值
      </div>
    </div>

    <!-- 规则列表 -->
    <div v-if="localReactions.length === 0" class="reaction-empty">
      暂无联动规则，点击「添加规则」开始
    </div>

    <div
      v-for="(reaction, idx) in localReactions"
      :key="idx"
      class="reaction-card"
    >
      <div class="reaction-card__header">
        <span class="reaction-card__index">规则 {{ idx + 1 }}</span>
        <el-button size="small" text type="danger" @click="removeReaction(idx)">删除</el-button>
      </div>

      <el-form label-width="80px" label-position="left" size="small" class="reaction-form">

        <!-- 条件表达式（直接编辑 when，不区分 $self / $deps） -->
        <el-form-item label="条件表达式">
          <el-input
            v-model="reaction.when"
            placeholder="如：$self.value === true 或 $deps[0] > 10"
          />
          <div class="form-hint">空 = 始终执行「满足时」的效果</div>
        </el-form-item>

        <!-- 依赖字段路径（对应 $deps 数组，仅在表达式中用 $deps 时才需填） -->
        <el-form-item label="依赖字段">
          <el-input
            v-model="depsInput[idx]"
            placeholder="字段路径，逗号分隔（使用 $deps 时填写）"
            @change="updateDeps(idx, $event)"
          />
          <div class="form-hint">例：isManager，多个用逗号分隔。仅当条件中用了 $deps[n] 时才需填</div>
        </el-form-item>

        <!-- 目标字段（target，空 = 作用自身） -->
        <el-form-item label="目标字段">
          <el-input
            v-model="targetInput[idx]"
            placeholder="空 = 作用自身，填字段路径则作用于指定字段"
            @change="updateTarget(idx, $event)"
          />
          <div class="form-hint">主动联动时填写，如：subordinateCount</div>
        </el-form-item>

        <el-divider style="margin: 8px 0" />

        <!-- 满足时 -->
        <el-form-item label="满足时">
          <el-select
            v-model="fulfillType[idx]"
            style="width:100%"
            @change="updateFulfill(idx)"
          >
            <el-option label="设置显示" value="visible" />
            <el-option label="设置隐藏" value="hidden" />
            <el-option label="设置禁用" value="disabled" />
            <el-option label="设置只读" value="readOnly" />
            <el-option label="设置必填" value="required" />
          </el-select>
        </el-form-item>

        <!-- 不满足时（只读展示，由满足时自动推导） -->
        <el-form-item label="不满足时">
          <div class="reaction-otherwise-label">{{ otherwiseLabel(idx) }}</div>
        </el-form-item>

      </el-form>
    </div>

    <el-button size="small" class="add-btn" @click="addReaction">
      + 添加规则
    </el-button>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

function syncFromProps() {
  localReactions.value = props.reactions.map((r) => JSON.parse(JSON.stringify(r)))
  depsInput.value = localReactions.value.map((r) => r.dependencies?.join(', ') ?? '')
  targetInput.value = localReactions.value.map((r) => {
    if (!r.target) return ''
    return Array.isArray(r.target) ? r.target.join(', ') : r.target
  })
  fulfillType.value = localReactions.value.map((r) => parseFulfillType(r))
}

syncFromProps()

// ============================================================
// 工具函数
// ============================================================

function parseFulfillType(r: Reaction): string {
  const state = r.fulfill?.state ?? {}
  if ('visible' in state) return state.visible ? 'visible' : 'hidden'
  if ('pattern' in state) return state.pattern as string
  if ('required' in state) return 'required'
  return 'visible'
}

function otherwiseLabel(idx: number): string {
  const map: Record<string, string> = {
    visible: '隐藏',
    hidden: '显示',
    disabled: '恢复可编辑',
    readOnly: '恢复可编辑',
    required: '取消必填',
  }
  return map[fulfillType.value[idx]] ?? '—'
}

// ============================================================
// 操作
// ============================================================

function addReaction() {
  localReactions.value.push({
    dependencies: [],
    when: '',
    fulfill: { state: { visible: true } },
    otherwise: { state: { visible: false } },
  })
  depsInput.value.push('')
  targetInput.value.push('')
  fulfillType.value.push('visible')
}

function removeReaction(idx: number) {
  localReactions.value.splice(idx, 1)
  depsInput.value.splice(idx, 1)
  targetInput.value.splice(idx, 1)
  fulfillType.value.splice(idx, 1)
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
    r.fulfill = { state: { pattern: 'disabled' } }
    r.otherwise = { state: { pattern: 'editable' } }
  } else if (type === 'readOnly') {
    r.fulfill = { state: { pattern: 'readOnly' } }
    r.otherwise = { state: { pattern: 'editable' } }
  } else if (type === 'required') {
    r.fulfill = { state: { required: true } }
    r.otherwise = { state: { required: false } }
  }
}

// ============================================================
// 确认 / 取消
// ============================================================

function handleConfirm() {
  emit('confirm', localReactions.value)
  visible.value = false
}

function handleCancel() {
  visible.value = false
}
</script>

<style scoped>
.reaction-help {
  background: #f0f9ff;
  border: 1px solid #bae0ff;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 12px;
  font-size: 12px;
}

.reaction-help__title {
  color: #1677ff;
  font-weight: 500;
  margin-bottom: 4px;
}

.reaction-help__vars {
  color: #555;
  line-height: 1.8;
}

.reaction-help__vars code {
  background: #e6f4ff;
  border-radius: 2px;
  padding: 1px 4px;
  font-family: monospace;
  font-size: 11px;
  color: #0958d9;
}

.reaction-empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 20px 0;
}

.reaction-card {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.reaction-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reaction-card__index {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.reaction-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.form-hint {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.4;
}

.reaction-otherwise-label {
  font-size: 12px;
  color: #909399;
  line-height: 28px;
  padding-left: 2px;
}

.add-btn {
  width: 100%;
  margin-top: 4px;
  border-style: dashed;
}
</style>
