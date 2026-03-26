<template>
  <div
    class="ranking box-r box-s black-box p-10 flex-column"
    @mouseenter="mouseenter"
    @mouseleave="mouseout"
  >
    <div class="text-llg text-bold c-white text-center mb10">产线生产数据汇总</div>
    <div class="flex1">
      <el-table
        ref="table"
        :data="props.list"
        class="black-table"
        height="100%"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="WCNAME" show-overflow-tooltip label="排行" width="50">
          <template slot-scope="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="WCNAME" show-overflow-tooltip label="产线名称" />
        <el-table-column prop="FINISHDT" label="计划完成日期" width="100">
          <template slot-scope="scope">
            <span>{{ new Date(scope.row.FINISHDT).Format('yyyy-MM-dd') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="PSQTY" label="计划数量" align="right" width="70">
          <template slot-scope="scope">
            <span>{{ scope.row.PSQTY || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="QTY" label="完成数量" align="right" width="70">
          <template slot-scope="scope">
            <span>{{ scope.row.QTY || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="PCT" label="完成率%" align="right" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.PCT || '--' }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="RP_RQTY" label="返工数" align="right" width="70">
          <template slot-scope="scope">
            <span>{{ scope.row.RP_RQTY || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="RW_RQTY" label="翻工数" align="right" width="70">
          <template slot-scope="scope">
            <span>{{ scope.row.RW_RQTY || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="BADQTY" label="次衫数" align="right" width="70">
          <template slot-scope="scope">
            <span>{{ scope.row.BADQTY || '--' }}</span>
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
            <span>{{ scope.row.QCPCT || '--' }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="EFFCIENCY" label="生产效率" align="center" width="70">
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
        <el-table-column prop="STFG_NAME" label="状态" align="center" width="60" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})
const tableData = ref([])
const table = ref()
const setInterval = ref('')
onMounted(() => {
  refugeListRef()
})
const tableRowClassName = ({ row, rowIndex }) => {
  if (rowIndex === 0) {
    return 'frist-row'
  }
  if (rowIndex === props.list.length - 1) {
    return 'last-row'
  }
}
const mouseout = () => {
  refugeListRef()
}
const mouseenter = () => {
  console.log('mouseenter')
  window.clearInterval(setInterval.value)
  setInterval.value = ''
}
const refugeListRef = () => {
  // 拿到表格中承载数据的div元素
  const divData = table.value.bodyWrapper
  // 拿到元素后，对元素进行定时增加距离顶部距离，实现滚动效果(此配置为每100毫秒移动1像素)
  // if (setInterval.value) return
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

<style lang="scss" scoped>
::v-deep .el-table {
  .frist-row {
    position: sticky;
    top: 0;
    background: #489125;
    z-index: 99;
  }
  .last-row {
    position: sticky;
    bottom: 0;
    background: #c12f2f;
    z-index: 99;
  }
}
</style>
