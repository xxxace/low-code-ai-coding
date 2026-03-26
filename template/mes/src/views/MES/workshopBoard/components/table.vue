<template>
  <div class="box-r box-s black-box p-10 overflow flex-column">
    <div class="text-bold text-center text-llg c-white">生产进度（本周）</div>
    <div class="flex1 overflow mt10">
      <el-table
        ref="table"
        :data="props.list"
        height="100%"
        class="black-table"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="WCNAME" show-overflow-tooltip label="生产线" />
        <el-table-column prop="ORDNO" label="在产批号" width="105" />
        <el-table-column prop="JOBNAME" width="60" show-overflow-tooltip label="工序" />
        <!-- <el-table-column prop="STYNO" show-overflow-tooltip label="款号" /> -->
        <el-table-column prop="FINISHDT" label="计划完成日期" width="100">
          <template slot-scope="scope">
            <span>{{ new Date(scope.row.FINISHDT).Format('yyyy-MM-dd') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="PSQTY" label="计划数量" width="70" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.PSQTY || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="QTY" label="完成数量" width="70" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.QTY || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="QCPCT" width="70" label="完成率%" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.PCT || '--' }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="STFG_NAME" width="60" label="状态" align="center" />
        <el-table-column prop="EFFCIENCY" width="70" label="生产效率" align="center">
          <template slot-scope="scope">
            <div v-if="scope.row.EFFCIENCY == -1" class="arrow-bottom">
              <i class="iconfont c-red">&#xe638;</i>
            </div>
            <div v-else-if="scope.row.EFFCIENCY == 1" class="arrow-top">
              <i class="iconfont c-green">&#xe638;</i>
            </div>
            <div v-else>--</div>
          </template>
        </el-table-column>
        <el-table-column prop="QCPCT" width="100" label="产品合格率%">
          <template slot-scope="scope">
            <span>{{ scope.row.QCPCT || '--' }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  list: {
    type: [Array, Object],
    default: () => []
  }
})
const tableData = ref([])
const table = ref()
onMounted(() => {})
const tableRowClassName = ({ row, rowIndex }) => {
  if (['EX_L', 'EX_D', 'EX_V'].includes(row.STFG)) {
    return 'error-row'
  }
  if (['EX_M', 'EX_F', 'EX_O'].includes(row.STFG)) {
    return 'warn-row'
  }
  return ''
}
const refugeListRef = () => {
  const table = table.value
  // 拿到表格中承载数据的div元素
  const divData = table.bodyWrapper
  // 拿到元素后，对元素进行定时增加距离顶部距离，实现滚动效果(此配置为每100毫秒移动1像素)
  setInterval(() => {
    // 元素自增距离顶部1像素
    divData.scrollTop += 1
    // 判断元素是否滚动到底部(可视高度+距离顶部=整个高度)
    if (divData.clientHeight + divData.scrollTop == divData.scrollHeight) {
      // 重置table距离顶部距离
      divData.scrollTop = 0
    }
  }, 100) // 滚动速度
}
</script>
