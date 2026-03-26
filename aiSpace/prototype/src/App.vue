<!--
  App.vue - 演示入口
  
  提供两个标签页：
  1. 设计器（LowcodeDesigner）- 完整设计器体验
  2. 渲染器演示（FormRenderer）- 展示联动/校验等运行时能力
-->
<template>
  <el-config-provider :locale="zhCn">
    <div class="app">
      <!-- Tab 切换 -->
      <div class="app__nav">
        <div class="app__nav-brand">🔬 低代码设计器原型</div>
        <el-radio-group v-model="activeTab" size="default">
          <el-radio-button value="designer">设计器</el-radio-button>
          <el-radio-button value="renderer">渲染器演示</el-radio-button>
          <el-radio-button value="json">Schema 查看</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 设计器 -->
      <div v-if="activeTab === 'designer'" class="app__content">
        <LowcodeDesigner
          :initial-schema="demoSchema"
          @export="handleExport"
        />
      </div>

      <!-- 渲染器演示 -->
      <div v-else-if="activeTab === 'renderer'" class="app__content app__content--padded">
        <div class="demo-renderer">
          <div class="demo-renderer__form">
            <h3 class="demo-section-title">表单预览（带联动示例）</h3>
            <FormRenderer
              ref="formRendererRef"
              :schema="demoSchema"
              @submit="handleFormSubmit"
              @change="handleFormChange"
            />
            <div class="demo-actions">
              <el-button type="primary" @click="handleSubmit">提交</el-button>
              <el-button @click="handleReset">重置</el-button>
              <el-button @click="handleGetValues">获取值</el-button>
            </div>
          </div>

          <div class="demo-renderer__values">
            <h3 class="demo-section-title">当前表单值</h3>
            <pre class="demo-values-preview">{{ currentValues }}</pre>
          </div>
        </div>
      </div>

      <!-- Schema JSON 查看 -->
      <div v-else-if="activeTab === 'json'" class="app__content app__content--padded">
        <h3 class="demo-section-title">当前 Schema JSON</h3>
        <pre class="schema-json-preview">{{ JSON.stringify(demoSchema, null, 2) }}</pre>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { ElMessage } from 'element-plus'
import LowcodeDesigner from './designer/LowcodeDesigner.vue'
import FormRenderer from './renderer/FormRenderer.vue'
import type { PageSchema } from './types/schema'

// ============================================================
// 状态
// ============================================================

const activeTab = ref<'designer' | 'renderer' | 'json'>('designer')
const formRendererRef = ref()
const currentValues = ref<Record<string, any>>({})

// ============================================================
// 演示用 Schema（展示联动/多字段类型）
// ============================================================

const demoSchema: PageSchema = {
  version: '1.0',
  id: 'demo-form-001',
  name: '员工信息表单',
  layoutMode: 'flow',
  formConfig: {
    labelWidth: 120,
    labelPosition: 'right',
    layoutType: 'PC',
    columns: 24,
  },
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '姓名',
        'x-component': 'Input',
        'x-component-props': { placeholder: '请输入姓名' },
        'x-span': 12,
        'x-order': 10,
        'x-id': 'node-name',
        'x-validator': [
          { type: 'required', message: '姓名不能为空' },
          { type: 'maxLength', value: 50, message: '姓名最多50个字符' },
        ],
      },
      gender: {
        type: 'string',
        title: '性别',
        'x-component': 'Select',
        'x-span': 12,
        'x-order': 20,
        'x-id': 'node-gender',
        enum: ['male', 'female', 'other'],
        enumNames: ['男', '女', '其他'],
      },
      email: {
        type: 'string',
        title: '邮箱',
        'x-component': 'Input',
        'x-component-props': { placeholder: '请输入邮箱' },
        'x-span': 12,
        'x-order': 30,
        'x-id': 'node-email',
        'x-validator': [
          { type: 'email', message: '邮箱格式不正确' },
        ],
      },
      phone: {
        type: 'string',
        title: '手机号',
        'x-component': 'Input',
        'x-component-props': { placeholder: '请输入手机号' },
        'x-span': 12,
        'x-order': 40,
        'x-id': 'node-phone',
        'x-validator': [
          { type: 'phone', message: '手机号格式不正确' },
        ],
      },
      department: {
        type: 'string',
        title: '部门',
        'x-component': 'Select',
        'x-span': 12,
        'x-order': 50,
        'x-id': 'node-dept',
        enum: ['tech', 'sales', 'hr', 'finance'],
        enumNames: ['技术部', '销售部', '人事部', '财务部'],
      },
      isManager: {
        type: 'boolean',
        title: '是否管理层',
        'x-component': 'Switch',
        'x-span': 12,
        'x-order': 60,
        'x-id': 'node-ismanager',
        // 联动示例：是管理层才显示"下属人数"字段
        'x-reactions': [
          {
            target: 'subordinateCount',
            fulfill: {
              state: { visible: true },
            },
            otherwise: {
              state: { visible: false },
            },
            when: '$self.value === true',
          },
        ],
      },
      subordinateCount: {
        type: 'number',
        title: '下属人数',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, max: 999 },
        'x-span': 12,
        'x-order': 70,
        'x-id': 'node-subcount',
        'x-display': 'none', // 初始隐藏，由联动控制
      },
      hireDate: {
        type: 'string',
        title: '入职日期',
        'x-component': 'DatePicker',
        'x-component-props': {
          type: 'date',
          format: 'YYYY-MM-DD',
          valueFormat: 'YYYY-MM-DD',
        },
        'x-span': 12,
        'x-order': 80,
        'x-id': 'node-hiredate',
      },
      remark: {
        type: 'string',
        title: '备注',
        'x-component': 'Textarea',
        'x-component-props': { rows: 4, placeholder: '请输入备注信息' },
        'x-span': 24,
        'x-order': 90,
        'x-id': 'node-remark',
      },
    },
  },
}

// ============================================================
// 事件处理
// ============================================================

function handleExport(schema: PageSchema): void {
  ElMessage.success(`Schema 已导出：${schema.name}`)
}

function handleFormSubmit(values: Record<string, any>): void {
  ElMessage.success('表单提交成功')
  console.log('[Demo] 提交值：', values)
}

function handleFormChange(path: string, value: any): void {
  currentValues.value = formRendererRef.value?.getValues() ?? {}
}

async function handleSubmit(): Promise<void> {
  await formRendererRef.value?.submit()
}

function handleReset(): void {
  formRendererRef.value?.reset()
  currentValues.value = {}
}

function handleGetValues(): void {
  currentValues.value = formRendererRef.value?.getValues() ?? {}
  ElMessage.info('已获取表单值（见右侧面板）')
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.app__nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.app__nav-brand {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.app__content {
  flex: 1;
  overflow: hidden;
}

.app__content--padded {
  overflow: auto;
  padding: 24px;
}

.demo-renderer {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  height: 100%;
}

.demo-section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.demo-renderer__form,
.demo-renderer__values {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.demo-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.demo-values-preview {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow: auto;
  max-height: 500px;
}

.schema-json-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  padding: 20px;
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
}
</style>
