<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-mask">
      <div class="spinner"></div>
      <p>数据加载中...</p>
    </div>
    <!-- 查询条件区 -->

    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '年份')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.year"
            type="year"
            value-format="YYYY"
            placeholder="选择年份"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工厂')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.FTYNO"
            :sql="remoteSqlMap['工厂下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工厂下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工序')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.JOBNO"
            :sql="remoteSqlMap['工序下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工序下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="isLoading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>
    <AceFieldset legend="图表" class="overflow-hidden">
      <div class="chart-card">
        <div class="">
          <Echart :options="optionsEchartData" style="height: 800px" />
        </div>
      </div>
    </AceFieldset>
  </div>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { onMounted, reactive, ref } from 'vue'
import { searchList } from '@/api/nameson'
import { formatString } from '@/utils'
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
const { t, c } = useI18nProxy('VUE_MES_PRODUCTANALYSIS')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_PRODUCTANALYSIS' })
console.log(remoteSqlMap, 'remoteSqlMap')

const queryForm = reactive({})

const [query, queryManager] = useParamsRefManager(() => {
  return {
    year: dayjs().format('YYYY'),
    FTYNO: '',
    JOBNO: ''
  }
})
const [reportList, reportListManager] = useArrayRefManager<any[]>([])
// 状态管理
const isLoading = ref(false)
const charts = ref({}) // 存储图表实例

const optionsEchartData = reactive<EChartsOption>({}) as EChartsOption
// 产线效率数据处理
const grenEchartsData = (list: any[]) => {
  const clist = [
    {
      REPDT: '202501',
      WCNAME: '缝盘',
      PVL: 10
    },
    {
      V_FYEARMONTH: '202502',
      JOBNO: '1002',
      CNAME: '缝盘2',
      V_SUMBADQTY: 20,
      V_SUMQTY: 200,
      V_BADRATE: 10
    },
    {
      V_FYEARMONTH: '202502',
      JOBNO: '1001',
      CNAME: '缝盘',
      V_SUMBADQTY: 100,
      V_SUMQTY: 200,
      V_BADRATE: 50
    }
  ]
  const xData: any[] = []
  const jobData = list.reduce((acc: any, current: any) => {
    if (!acc[current.WCNAME]) {
      acc[current.WCNAME] = {
        name: current.WCNAME,
        type: 'line',
        barCategoryGap: '0',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }
    }
    const index = parseInt(current.REPDT.substring(4, 6), 10)
    acc[current.WCNAME].data.splice(index, 1, current.PVL)
    return acc
  }, {})

  for (let index = 1; index <= 12; index++) {
    xData.push(index)
  }
  const options = {
    title: {
      text: '产线效率',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    legend: {
      orient:'vertical',
      left:'right',
      top:'center'
    },
    xAxis: [
      {
        type: 'category',
        name: '月份',
        nameLocation: 'end',
        data: xData
      }
    ],
    yAxis: [
      {
        type: 'value',
        //纵坐标轴上的各个值对应的横线是否显示：默认显示
        name: '百分率%',
        min: 0,
        max: 100,
        // interval: 50,
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: Object.values(jobData)
  }
  Object.assign(optionsEchartData, options)
}
// 查询
const loadData = async () => {
  isLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['效率分析查询']
    const list = await searchList<[]>({
      sql: formatString(DBQUERY, query.value.year, query.value.FTYNO, query.value.JOBNO),
      sortby: SORTBYCONTENT
    })
    grenEchartsData(list)
  } catch (e: any) {
    ElMessageBox.alert(`不良品率分析图:${e.message || JSON.stringify(e)}`)
  }
  isLoading.value = false
}
// 初始化
onMounted(async () => {
  loadData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.dashboard-controls {
  display: flex;
  gap: 10px;
}

.refresh-btn {
  background-color: #5470c6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #435fc6;
  }
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.chart-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: 1px solid #e5e5e5;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    border-color: #d9d9d9;
  }
}

.chart-content {
  padding: 20px;
}

.myEcharts,
.echartsCom {
  width: 100%;
  transition: height 0.3s;
}

.myEcharts {
  height: 600px;
}

.echartsCom {
  height: 400px; /* 增加高度提升可读性 */
}

/* 加载状态样式 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #5470c6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }

  .myEcharts {
    height: 400px;
  }

  .echartsCom {
    height: 300px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .chart-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
