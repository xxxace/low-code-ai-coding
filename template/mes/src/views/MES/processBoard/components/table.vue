<template>
  <div
    class="box-r box-s black-box p-10 overflow flex-column"
    style="height: 350px"
    @mouseenter="mouseenter"
    @mouseleave="mouseout"
  >
    <el-table
      ref="table"
      :data="list"
      height="100%"
      class="black-table"
      :row-class-name="tableRowClassName"
      :header-cell-class-name="tableCellClassName"
    >
      <el-table-column prop="WCNAME" show-overflow-tooltip label="产线名称" width="120" />
      <el-table-column prop="YXJ" show-overflow-tooltip label="优先级" width="120" sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.YXJ > 200" style="color: #89d961">{{ scope.row.YXJ }} 正常</span>
          <span v-else style="color: red">{{ scope.row.YXJ }} 急单</span>
        </template>
      </el-table-column>
      <el-table-column prop="ORDNO" show-overflow-tooltip label="在产批号" width="120" />
      <!-- <el-table-column prop="PMNO" show-overflow-tooltip label="合约号">
        <template slot-scope="scope">
          <span>{{ scope.row.PMNO||'--' }}</span>
        </template>
      </el-table-column> -->
      <el-table-column prop="PMNO" show-overflow-tooltip label="工单">
        <template slot-scope="scope">
          <span>{{ scope.row.PMNO || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="STYNO" show-overflow-tooltip label="款号" width="120" />
      <el-table-column prop="FINISHDT" label="计划完成日期" width="100">
        <template slot-scope="scope">
          <span>{{ new Date(scope.row.FINISHDT).Format('yyyy-MM-dd') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="PSQTY" label="计划数量" align="right" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.PSQTY || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="QTY" label="完成数量" align="right" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.QTY || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="PCT" label="完成率%" align="right" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.PCT || '--' }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="YGRS" label="用工人数" align="right" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.YGRS || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="RP_RQTY" label="返工数" align="right" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.RP_RQTY || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="RW_RQTY" label="翻工数" align="right" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.RW_RQTY || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="BADQTY" label="次衫数" align="right" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.BADQTY || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="QCPCT"
        show-overflow-tooltip
        label="产品合格率%"
        align="right"
        width="100"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.QCPCT || 0 }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="EFFCIENCY" label="生产效率" align="center" width="70">
        <template slot-scope="scope">
          <div>{{ scope.row.QCPCT || 0 }}%</div>
          <!-- <div v-if="scope.row.EFFCIENCY==-1" class="arrow-bottom">
            <i class="iconfont  c-red">&#xe638;</i>
          </div>
          <div v-else-if="scope.row.EFFCIENCY==1" class="arrow-top">
            <i class="iconfont c-green">&#xe638;</i>
          </div>
          <div v-else>--</div> -->
        </template>
      </el-table-column>
      <el-table-column prop="STFG_NAME" label="状态" align="center" width="60" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})
const setInterval = ref('')
const table = ref()
onMounted(() => {
  refugeListRef()
})
const tableRowClassName = ({ row, rowIndex }) => {
  if (['EX_L', 'EX_D', 'EX_V'].includes(row.STFG)) {
    return 'error-row'
  }
  if (['EX_M', 'EX_F', 'EX_O'].includes(row.STFG)) {
    return 'warn-row'
  }
  return ''
}
const tableCellClassName = ({ column }) => {
  if (column.label == '优先级') {
    return 'cellRed'
  }
  return ''
}
const mouseout = () => {
  refugeListRef()
}
const mouseenter = () => {
  window.clearInterval(setInterval.value)
  setInterval.value = ''
}
const refugeListRef = () => {
  const tableRef = table.value
  // 拿到表格中承载数据的div元素
  const divData = tableRef.bodyWrapper
  // 拿到元素后，对元素进行定时增加距离顶部距离，实现滚动效果(此配置为每100毫秒移动1像素)
  if (setInterval.value) return
  // setInterval.value = setInterval(() => {
  //   // 元素自增距离顶部1像素
  //   divData.scrollTop += 1
  //   // 判断元素是否滚动到底部(可视高度+距离顶部=整个高度)
  //   if (divData.clientHeight + divData.scrollTop == divData.scrollHeight) {
  //     // 重置table距离顶部距离
  //     divData.scrollTop = 0
  //   }
  // }, 100) // 滚动速度
}
</script>
