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
        <FieldItem :label="t('lbBOOKER', '产线')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.WCSEQ"
            :sql="remoteSqlMap['产线下拉框'].DBQUERY"
            :orderby="remoteSqlMap['产线下拉框'].SORTBYCONTENT"
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
      <!-- <div class="">
        <Echart :options="optionsEchartData" />
      </div> -->
      <div class="">
        <Echart :options="optionsEchartData" />
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
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'

const { t, c } = useI18nProxy('VUE_MES_STAFFANALYSIS')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_STAFFANALYSIS' })
console.log(remoteSqlMap)

const [query, queryManager] = useParamsRefManager(() => {
  return {
    FTYNO: '',
    WCSEQ: '',
    JOBNO: ''
  }
})
const [reportList, reportListManager] = useArrayRefManager<any[]>([])
// 状态管理
const isLoading = ref(false)
const charts = ref({}) // 存储图表实例

const optionsEchartData = reactive<EChartsOption>({}) as EChartsOption
const echartsData=ref({})
// 产线效率数据处理
const grenEchartsData = (list: any[]) => {
  const xData: any[] = list.map((item) => item.EMPNAME)
  const sData: any[] = list.map((item) => item.AVGEFF)
  const yValue: any[] = [90, 80, 60]
  const markLineData: any[] = []
  const markAreaData: any[] = []
  // 分割线
  const textOption: any[] = [
    // 优的分割线（100分位置）
    {
      xAxis: '',
      label: {
        position: 'start',
        formatter: '',
        color: '#52c41a',
        fontSize: 20,
        fontWeight: 'bold'
      }
    },
    // 良的分割线（80分位置）
    {
      xAxis: '',
      label: {
        position: 'start',
        formatter: '',
        color: '#1890ff',
        fontSize: 20,
        fontWeight: 'bold'
      }
    },
    // 合格的分割线（60分位置）
    {
      xAxis: '',
      label: {
        position: 'end',
        formatter: '',
        color: '#faad14',
        fontSize: 20,
        fontWeight: 'bold',
        offset: [-20, 0] // 右移避免重叠
      }
    }
  ]
  yValue.forEach((item, index) => {
    if (item) {
      const fData = list.filter((fItem) => fItem.AVGEFF >= item)
      if (fData.length > 0) {
        const ojb = textOption[index]
        ojb.xAxis = fData[fData.length - 1].EMPNAME
        markLineData.push(ojb)
        if (yValue.length - 1 == index) {
          markLineData.push(
            // 差的分割线（60分位置，右侧文字）
            {
              xAxis: fData[fData.length - 1].EMPNAME,
              label: {
                position: 'end',
                formatter: '',
                color: '#f5222d',
                fontSize: 20,
                fontWeight: 'bold',
                Offset: ['center', 0] // 右移避免重叠
              }
            }
          )
        }
      }
    }
  })
  // 区域
  const yArea = [
    { name: '优秀', max: 100, min: 90, value: 90, color: '#52c41a' },
    { name: '良', max: 90, min: 80, value: 80, color: '#1890ff' },
    { name: '合格', max: 80, min: 60, value: 60, color: '#faad14' }
  ]
  yArea.forEach((item, index) => {
    let area: any[] = []
    const array = list.filter((fItem) => fItem.AVGEFF >= item.value)
    if (array.length > 0) {
      if (markAreaData.length == 0) {
        area.push({
          name: item.name,
          xAxis: array[0].EMPNAME,
          label: { color: item.color, fontSize: 20 }
        })
        area.push({ name: item.name, xAxis: array[array.length - 1].EMPNAME })
        markAreaData.push(area)
      } else {
        area.push({
          name: item.name,
          xAxis: markAreaData[markAreaData.length - 1][0].xAxis,
          label: { color: item.color, fontSize: 20 }
        })
        area.push({ name: item.name, xAxis: array[array.length - 1].EMPNAME })
        markAreaData.push(area)
      }
      if (index == yArea.length - 1) {
        area = []
        area.push({
          name: '差',
          xAxis: markAreaData[markAreaData.length - 1][1].xAxis,
          label: { color: '#f5222d', fontSize: 20 }
        })
        area.push({ name: '差', xAxis: list[list.length - 1].EMPNAME })
        markAreaData.push(area)
      }
    }
  })
  const options = {
    title: {
      text: '员工效率',
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
    legend: {},
    xAxis: {
      type: 'category',
      name: '员工',
      boundaryGap: false,
      nameLocation: 'end',
      axisLabel: {
        rotate: 45,
        fontSize: 10
      },
      data: xData
    },
    yAxis: [
      {
        type: 'value',
        //纵坐标轴上的各个值对应的横线是否显示：默认显示
        name: '百分率%',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: {
      data: sData,
      type: 'line',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.2)' }
          ]
        }
      },
      lineStyle: { color: '#1890ff', width: 2 },
      itemStyle: { color: '#1890ff' },
      smooth: true, // 平滑曲线（也可以设为false用折线）
      markLine: {
        symbol: ['none', 'none'], // 隐藏箭头
        lineStyle: { type: 'solid', color: '#404040', width: 2 },
        data: markLineData
      },
      markArea: {
        itemStyle: {
          color: 'transparent'
        },
        data: markAreaData
      }
    }
  }
  Object.assign(optionsEchartData, options)
}
// 查询
const loadData = async () => {
  isLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['员工效率分析']
    const list = await searchList<[]>({
      sql: DBQUERY,
      params: {
        'W.FTYNO': query.value.FTYNO,
        'EK.SKILLTY': query.value.JOBNO,
        'W.WCSEQ': query.value.WCSEQ
      },
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
  // loadData()
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
