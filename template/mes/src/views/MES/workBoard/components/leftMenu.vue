<template>
  <!-- 搜索出的信息 -->
  <div class="c-white mb15 text-bold"> 批號信息 </div>
  <div class="flex-column border-top pt10 bg-gray">
    <div class="flex-between c-white">
      <span class="stitle">图片</span>
      <el-image
        v-if="props.ordInfo.IMG"
        style="width: 100px; height: 100px"
        :src="props.ordInfo.IMG"
        :preview-src-list="[props.ordInfo.IMG]"
        fit="contain"
      />
      <div v-else>
        <span>暂无图片</span>
      </div>
    </div>
    <div class="flex-between c-white">
      <span class="stitle">批號</span>
      <span>{{ props.ordInfo.ORDNO || '--' }}</span>
    </div>
    <div class="flex-between c-white">
      <span class="stitle">款號</span>
      <span>{{ props.ordInfo.V_STYNO || '--' }}</span>
    </div>
    <div class="flex-between c-white">
      <span class="stitle">辦單號</span>
      <span>{{ props.ordInfo.V_SMPNO || '--' }}</span>
    </div>
    <div class="flex-column pt10 c-white">
      <span class="stitle pb10">款式描述</span>
      <span class="text-content">{{ props.ordInfo.V_LNAME || '--' }}</span>
    </div>
  </div>
  <!-- 表格 -->
  <div class="c-white mt10 mb10 text-bold"> 步骤 </div>
  <el-table
    class="black-table"
    ref="empTable"
    :data="empInfo"
    highlight-current-row
    style="width: 100%"
    @row-click="rowClick"
    :row-class-name="rowClassName"
    v-loading="props.tableloading"
  >
    <el-table-column prop="DTLNO" label="工序編碼">
      <template #default="scope">
        <div>
          {{ scope.row.DTLNO || '--' }}
        </div>
      </template>
    </el-table-column>

    <el-table-column prop="DTLNAME" label="名稱">
      <template #default="scope">
        <div>
          {{ scope.row.DTLNAME || '--' }}
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useManual } from '../store/index'
import { storeToRefs } from 'pinia'

const { setOrdseq } = useManual()
const { ordseq } = storeToRefs(useManual())
const empTable = ref(null)
const props = defineProps({
  ordInfo: {
    type: Object,
    default: () => {}
  },
  empInfo: {
    type: Array,
    default: () => []
  },
  tableloading: {
    type: Boolean,
    default: false
  }
})
watch(
  () => props.empInfo,
  () => {
    empTable.value.setCurrentRow(props.empInfo[0])
    setTimeout(() => {
      if (props.empInfo[0]) {
        setOrdseq(props.empInfo[0].DTLSEQ)
      } else {
        setOrdseq('')
      }
    }, 200)
  },
  { deep: true }
)

const rowClick = (e) => {
  setOrdseq(e.DTLSEQ)
}
// 高亮行
const rowClassName = ({ row }) => {
  if (row.DTLSEQ == ordseq.value) {
    return 'seleceRow'
  }
}
</script>

<style lang="scss" scoped>
.bg-gray {
  background: #262f3e;
  border-radius: 10px;
  padding: 10px;
  border: 1px solid #353d49;
  .stitle {
    color: #c8d1dd;
  }
  .flex-between {
    border-bottom: 1px solid #353d49;
    padding: 10px 0;
    &:last-child {
      border-bottom: 0;
    }
  }
  .text-content {
    line-height: 26px;
  }
}
.black-table {
  background: #262f3e;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #353d49;
  :deep(tr) {
    background: #212b35;
  }
  :deep(.el-loading-mask) {
    background: rgba(0, 0, 0, 0.3) !important;
  }
  :deep(td.el-table__cell, th.el-table__cell.is-leaf) {
    border-bottom: 1px solid #353d49;
  }
  :deep(th.el-table__cell.is-leaf) {
    border-bottom: 1px solid #353d49;
  }
  :deep(th.el-table__cell) {
    background: #262f3e;
  }
  :deep(.cell) {
    color: #fff;
  }
  :deep(.el-table__inner-wrapper) {
    &:before {
      display: none;
    }
  }
  :deep(.el-table__body) {
    tr:hover > td.el-table__cell {
      background-color: #353d49;
    }
    tr.current-row > td.el-table__cell {
      background-color: #353d49;
    }
  }
  :deep(.seleceRow) {
    background-color: #314e79 !important;
  }
}
.pt10 {
  padding-top: 15px;
}
.mb15 {
  margin-bottom: 15px;
}
.pb10 {
  padding-bottom: 10px;
}
</style>
