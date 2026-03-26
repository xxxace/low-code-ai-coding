<!--
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-04 12:10:10
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-08 14:44:32
 * @FilePath: \77_MES-APS\src\views\MES\quality\index.vue
 * @Description: 系統報表—每日品質報表
-->
<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '开始日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.startDate"
            type="date"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '结束日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.endDate"
            type="date"
            placeholder="选择结束日期"
          />
        </FieldItem>

        <FieldItem :label="t('lbBOOKER', '班别')" :width="70">
          <el-input class="w-[140px]!" v-model="query.materialCode" placeholder="请输入料件编号" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '生产工单')" :width="70">
          <el-input class="w-[140px]!" v-model="query.ORDNO" placeholder="请输入生产工单" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
        <div class="my-1">
          <FieldItem :label="t('lbBOOKER', '部门')" :width="70">
            <RemoteSelect
              class="w-[120px]!"
              autoLoad
              transfer
              v-model="query.DEPTNO"
              :sql="remoteSqlMap['部门的查询语句'].DBQUERY"
              :orderby="remoteSqlMap['部门的查询语句'].SORTBYCONTENT"
            />
          </FieldItem>
          <FieldItem :label="t('lbBOOKER', '产线')" :width="70">
            <RemoteSelect
              class="w-[120px]!"
              autoLoad
              transfer
              v-model="query.WCSEQ"
              :sql="remoteSqlMap['产线的查询语句'].DBQUERY"
              :orderby="remoteSqlMap['产线的查询语句'].SORTBYCONTENT"
            />
          </FieldItem>
          <FieldItem :label="t('lbBOOKER', '工序')" :width="70">
            <RemoteSelect
              class="w-[120px]!"
              autoLoad
              transfer
              v-model="query.JOBNO"
              :sql="remoteSqlMap['工序的查询语句'].DBQUERY"
              :orderby="remoteSqlMap['工序的查询语句'].SORTBYCONTENT"
            />
          </FieldItem>
        </div>
      </div>
    </AceFieldset>

    <AceFieldset legend="品质图表" class="overflow-hidden" style="">
      <div class="w-full h-full flex items-center justify-center text-gray-500">
        <div class="textCenter">
          <el-row :gutter="10" style="height: 100%">
            <el-col :xs="24" :sm="24" :md="24" :lg="7" :xl="7" style="height: 100%">
              <div class="grid-content ep-bg-purple" style="height: 100%">
                <Echart :options="badProportionData" style="height: 400px" />
              </div>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="17" :xl="17" style="height: 100%">
              <div class="grid-content ep-bg-purple-light" style="">
                <div class="rejectsRow">
                  <div style="height: 190px">
                    <Echart :options="platoBarOptionsChartData" style="height: 100%" />
                  </div>
                  <div style="height: 190px">
                    <Echart :options="qualityTrendChartData" style="height: 100%" />
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </AceFieldset>

    <!-- 表格区域 -->
    <AceFieldset legend="统计" absolute class="flex-1 overflow-hidden">
      <SystemReportTable :data="reportList" :loading="loading"/>
    </AceFieldset>
  </div>
</template>
<script lang="ts" setup>
import { reactive, onMounted, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import type { EChartsOption } from 'echarts'
import SystemReportTable from '@/views/MES/quality/components/SystemReportTable.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import dayjs from 'dayjs'

const { t, c } = useI18nProxy('VUE_MES_QCRPT')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_QCRPT' })
const loading = ref(false)

// 达成状态分布
const badProportionPieOptions: EChartsOption = {
  title: {
    text: '不良比例分布',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },
  series: [
    {
      name: '不良比例',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 32.7, name: '黑点' },
        { value: 0.2, name: '气纹/排气' },
        { value: 2.3, name: '碰伤刮伤' },
        { value: 2.3, name: '来料不良' },
        { value: 3.2, name: '料花' },
        { value: 3.8, name: '品保测试' },
        { value: 4, name: '脏污/油污/杂质' },
        { value: 5.5, name: 'PIN 拉伤' },
        { value: 8.3, name: '其他不良' },
        { value: 14.9, name: '空模' },
        { value: 17.9, name: '杂色料' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}
const badProportionData = reactive<EChartsOption>(badProportionPieOptions) as EChartsOption

// 品质趋势图
const qualityTrendChartBarOptions: EChartsOption = {
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
    data: ['白班', '夜班', '当天不良率']
  },
  xAxis: [
    {
      type: 'category',
      data: ['01/22', '01/23', '01/24', '01/25', '01/26', '01/27', '01/28'],
      axisPointer: {
        type: 'shadow'
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: 'Precipitation',
      min: 0,
      max: 250,
      interval: 50,
      axisLabel: {
        formatter: '{value}'
      }
    },
    {
      type: 'value',
      name: 'Temperature',
      min: 0,
      max: 25,
      interval: 5,
      axisLabel: {
        formatter: '{value} %'
      }
    }
  ],
  series: [
    {
      name: '白班',
      type: 'bar',
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
    },
    {
      name: '夜班',
      type: 'bar',
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
    },
    {
      name: '当天不良率',
      type: 'line',
      yAxisIndex: 1,
      tooltip: {
        valueFormatter: function (value) {
          return value + ' %'
        }
      },
      data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2]
    }
  ]
}

const qualityTrendChartData = reactive<EChartsOption>(qualityTrendChartBarOptions) as EChartsOption

// 不良趋势图
const platoBarOptions: EChartsOption = {
  title: {
    text: '柏拉图',
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
    data: ['', '']
  },
  xAxis: [
    {
      type: 'category',
      //显示横坐标中对应值的坐标线（竖线）：默认不显示
      //splitLine:{show:true},
      data: [
        '黑点',
        '杂色料',
        '空模',
        '其他不良',
        'PIN拉伤',
        '脏污/油污/杂质',
        '品质测试',
        '料花',
        '铜屑',
        '来料不良',
        '碰伤刮伤',
        '顶凸拉凹',
        '气纹'
      ]
    },
    {
      type: 'category',
      show: false,
      boundaryGap: false,
      data: [
        '黑点',
        '杂色料',
        '空模',
        '其他不良',
        'PIN拉伤',
        '脏污/油污/杂质',
        '品质测试',
        '料花',
        '铜屑',
        '来料不良',
        '碰伤刮伤',
        '顶凸拉凹',
        '气纹'
      ]
    }
  ],
  yAxis: [
    {
      type: 'value',
      //纵坐标轴上的各个值对应的横线是否显示：默认显示
      name: '数量',
      min: 0,
      max: 250,
      interval: 50,
      axisLabel: {
        formatter: '{value}'
      }
    },
    {
      type: 'value',
      name: '占比',
      min: 0,
      max: 100,
      interval: 15,
      //纵坐标轴上的各个值对应的横线是否显示：默认显示
      //splitArea : {show : true}, //保留网格区域
      axisLabel: {
        formatter: '{value} %'
      }
    }
  ],
  series: [
    {
      name: '数量',
      type: 'bar',
      barCategoryGap: '0',
      data: [154, 84, 70, 38, 36, 19, 18, 15, 14, 11, 11, 5, 4, 1]
    },
    {
      name: '占比',
      type: 'line',
      symbolSize: 10,
      //拐点显示设置（新版本EChart需要设置）
      symbol: function (value) {
        if (value > 0) {
          //值大于0才显示
          return 'circle' //拐点类型
        } else {
          return 'none' //拐点不显示
        }
      },
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: [32.7, 50.0, 65.4, 73.7, 79.2, 83.2, 87, 90.2, 93.2, 95.5, 97.9, 98.9, 99.8, 100]
    }
  ]
}
const platoBarOptionsChartData = reactive<EChartsOption>(platoBarOptions) as EChartsOption

const [query, queryManager] = useParamsRefManager(() => {
  return {
    startDate: '',
    endDate: '',
    ORDNO: '',
    DEPTNO: '',
    WCSEQ: '',
    JOBNO: ''
  }
})

const [reportList, reportListManager] = useArrayRefManager<any[]>([])

const loadData = async () => {
  loading.value = true
  try {
    // 模拟报表数据
    await queryQcDtlData()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
  loading.value = false
}
const queryQcDtlData = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['明细数据的查询语句']
    const list = await searchList<[]>({
      sql: DBQUERY,
      params: {
        'J.ORDNO': query.value.ORDNO,
        'E.WKDATE__gte@date': query.value.startDate,
        'E.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    reportListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`生产明细记录:${e.message || JSON.stringify(e)}`)
  }
}
onMounted(() => {
  // 设置默认日期范围（最近7天）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  queryManager.update({
    ...query.value,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  })

  loadData()
})
</script>
<style lang="scss" scoped>
.systemReportPage {
  .textCenter {
    width: 100%;
    height: 100%;

    .rejectsRow {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-rows: repeat(2, 1fr);
      gap: 10px;
    }
  }
}
</style>
