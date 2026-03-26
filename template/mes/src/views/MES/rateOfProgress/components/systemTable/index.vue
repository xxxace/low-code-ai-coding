<!--
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-10 15:45:00
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-29 09:05:33
 * @FilePath: \77_MES-APS\src\views\MES\rateOfProgress\components\systemTable\index.vue
 * @Description: 系统报表-工单进度 表格
-->
<template>
  <ProgressTable />
</template>

<script setup lang="tsx">
import { ref, reactive, defineComponent } from 'vue'
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { getEditableTableExposeProxy } from '@/utils'

// const props = withDefaults(defineProps<{ data: any[] }>(), {
//   data: () => []
// })

const tableRef = ref<any>()

const columns = reactive<ReportTableColumn[]>([
  { field: 'TSKNO', title: '工单号', width: '', align: 'center' },
  { field: 'TSKTY', title: '工单类型', width: '', align: 'center' },
  { field: 'ORDNO', title: '批号', width: '', align: 'center' },
  { field: 'STYNO', title: '厂款号', width: '', align: 'center' },
  { field: 'PMNO', title: '合约号', width: '', align: 'center' },
  { field: 'WCNAME', title: '产线', width: '', align: 'center' },
  { field: 'STFG', title: '工单状态', width: '', align: 'center' },
  {
    field: 'TARGETQUANTITY',
    title: '目标数量',
    width: '',
    align: 'center',
    slots: { default: 'assignedQuantity' }
  },
  {
    field: 'ASSIGNEDQUANTITY',
    title: '已派工',
    width: '',
    align: 'center',
    slots: { default: 'assignedQuantity' }
  },
  { field: 'TQTY', title: '投入数量', width: '', align: 'center' },
  { field: 'RQTY', title: '产出数量', width: '', align: 'center' },
  {
    field: 'WORKORDERPROGRESS',
    title: '工单进度',
    width: '',
    align: 'center',
    slots: { default: 'workOrderProgress' }
  },
  { field: 'BADQTY', title: '不良数量', width: '', align: 'center' },
  {
    field: 'DEFECTRATE',
    title: '不良率%',
    width: '',
    align: 'center',
    slots: { default: 'defectRate' }
  },
  { field: 'JOBNO', title: '工序编码', width: '', align: 'center' },
  { field: 'JOBCNAME', title: '工序名称', width: '', align: 'center' }
])

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

const ProgressTable = defineComponent({
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: () => false
    }
  },
  setup(props) {
    console.log(props.data)
    return () => (
      <>
        <ReportTable
          ref={tableRef}
          class="h-full"
          footer
          columns={columns}
          data={props.data}
          loading={props.loading}
          v-slots={{
            workOrderProgress: ({ row }: any) => (
              <div class="progress-container">
                <div class="progress-bar">
                  <div
                    class={['progress-fill', getProgressClass(row.workOrderProgress)]}
                    style={{ width: `${row.workOrderProgress || 0}%` }}
                  ></div>
                </div>
                <span class="progress-text">
                  {((row.RQTY / (row.TQTY + row.BTQTY)) * 100).toFixed(2) || 0}%
                </span>
              </div>
            ),
            defectRate: ({ row }: any) => (
              <div class="progress-container">
                <span class="progress-text">
                  {(row.BADQTY || 0 / row.RQTY || 0 * 100).toFixed(2) || 0}%
                </span>
              </div>
            ),
            assignedQuantity: ({ row }: any) => (
              <div class="progress-container">
                <span class="progress-text">{row.TQTY + row.BTQTY || 0}</span>
              </div>
            )
          }}
        />
      </>
    )
  }
})

// 根据进度值返回对应的CSS类名
function getProgressClass(progress: number) {
  if (progress >= 80) return 'progress-success'
  if (progress >= 50) return 'progress-warning'
  return 'progress-danger'
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>

<style scoped>
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-success {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.progress-warning {
  background: linear-gradient(90deg, #e6a23c, #f0c78a);
}

.progress-danger {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}
</style>
