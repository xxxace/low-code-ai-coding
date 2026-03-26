<!--
 * @Author: 匹诺曹
 * @Date: 2025-07-02 15:38:49
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-08 09:11:50
 * @FilePath: \77_MES-APS\src\views\MES\systemReport\index.vue
 * @Description: 系统报表 - 每日生产
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
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '结束日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '班组')" :width="42">
          <el-select class="w-[120px]!" v-model="query.shift" placeholder="选择班组" size="small">
            <el-option label="早班" value="早班" />
            <el-option label="中班" value="中班" />
            <el-option label="晚班" value="晚班" />
          </el-select>
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
      <div class="my-1">
        <FieldItem :label="t('lbBOOKER', '部门')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.DEPTNO"
            :sql="remoteSqlMap['部门的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['部门的查询语句'].SORTBYCONTENT"
          />
          <!-- <OptionInput
            :label-width="60"
            :value-width="120"
            value-key="DEPTNO"
            v-model="query.deptNo"
            v-model:labelValue="query.deptName"
          /> -->
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '产线')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.WCSEQ"
            :sql="remoteSqlMap['产线的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['产线的查询语句'].SORTBYCONTENT"
          />
        </FieldItem>
        <!-- <FieldItem :label="t('lbBOOKER', '工作中心')" :width="70">
          <OptionInput
            :label-width="80"
            :value-width="120"
            value-key="WCCODE"
            v-model="query.workCenter"
            v-model:labelValue="query.workCenterName"
          />
        </FieldItem> -->
        <FieldItem :label="t('lbBOOKER', '工序')" :width="42">
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
    </AceFieldset>

    <!-- ECharts 图表区域 -->
    <AceFieldset legend="生产统计图表" class="overflow-hidden" style="height: 350px">
      <div class="w-full h-full flex items-center justify-center text-gray-500">
        <div class="textCenter">
          <div class="">
            <Echart :options="pieOptionsData" :height="300" />
          </div>
          <div class="">
            <Echart :options="barOptionsData" :height="300" />
          </div>
        </div>
      </div>
    </AceFieldset>

    <!-- 表格区域 -->
    <AceFieldset legend="每日生产报表" absolute class="flex-1 overflow-hidden">
      <SystemReportTable :data="reportList" :loading="loading" />
    </AceFieldset>
  </div>
</template>

<script lang="tsx" setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import OptionInput from '@/components/OptionInput.vue'
import SystemReportTable from '@/views/MES/systemReport/components/SystemReportTable/index.vue'
import Echart from '@/components/Echart/src/Echart.vue'
import type { EChartsOption } from 'echarts'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import dayjs from 'dayjs'
import { formatString, parseImgSrc } from '@/utils'
import type { systemItemVo } from '$types/views/MES/systemReport.ts'
import { objectEntries } from '@vueuse/core'

const { t, c } = useI18nProxy('VUE_MES_SYSTEMREPORT')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_PRDINFO' })

const loading = ref(false)

// 达成状态分布
// const customPieOptions: EChartsOption = {}
const pieOptionsData = reactive<EChartsOption>({}) as EChartsOption

// 每日生产汇总
// const customBarOptions: EChartsOption = {}
const barOptionsData = reactive<EChartsOption>({}) as EChartsOption

const [query, queryManager] = useParamsRefManager(() => {
  return {
    startDate: '',
    endDate: '',
    DEPTNO: '',
    WCSEQ: '',
    JOBNO: ''
  }
})

const [reportList, reportListManager] = useArrayRefManager<any[]>([])
// 查询达成率
const queryAchiRate = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['达成状态分布']
    const list = await searchList<systemItemVo[]>({
      sql: DBQUERY,
      params: {
        'B.DEPTNO': query.value.DEPTNO,
        'B.WCSEQ': query.value.WCSEQ,
        'B.JONO': query.value.JONO,
        'B.WKDATE__gte@date': query.value.startDate,
        'B.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    // const data=list.map((item:any)=>({value:item.QTY,name:item.PCTYPE}))
    const data = [
      { value: '50', name: '>90%' },
      { value: '20', name: '60%~90%' },
      { value: '10', name: '<60%' }
    ]
    const customPieOptions = {
      title: {
        text: '达成状态分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      series: [
        {
          name: '达成状态分布',
          type: 'pie',
          radius: '50%',
          data: data,
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
    Object.assign(pieOptionsData, customPieOptions)
  } catch (e: any) {
    ElMessageBox.alert(`达成状态分布:${e.message || JSON.stringify(e)}`)
  }
}
// 班别产出汇总分析
const queryClassItem = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['班别产出汇总分析']
    const list = await searchList<systemItemVo[]>({
      sql: DBQUERY,
      params: {
        'W.DEPTNO': query.value.DEPTNO,
        'B.WCSEQ': query.value.WCSEQ,
        'B.JONO': query.value.JONO,
        'B.WKDATE__gte@date': query.value.startDate,
        'B.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    const customBarOptions = {
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
      toolbox: {
        feature: {
          dataView: { show: true, readOnly: false },
          magicType: { show: true, type: ['line', 'bar'] },
          restore: { show: true },
          saveAsImage: { show: true }
        }
      },
      legend: {
        data: [
          '白班产出数',
          '白班不良数',
          '夜班产出数',
          '夜班不良数',
          '白班不良率',
          '夜班不良率',
          '白班达成率',
          '夜班达成率'
        ]
      },
      xAxis: [
        {
          type: 'category',
          data: [
            '2025/07/01',
            '2025/07/02',
            '2025/07/03',
            '2025/07/04',
            '2025/07/05',
            '2025/07/06',
            '2025/07/07',
          ],
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
            formatter: '{value}'
          }
        }
      ],
      series: [
        // {
        //   name: '白班产出数',
        //   type: 'bar',
        //   tooltip: {
        //     valueFormatter: function (value) {
        //       return value + ' 件'
        //     }
        //   },
        //   data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
        // },
        {
          name: '白班不良数',
          type: 'bar',
          tooltip: {
            valueFormatter: function (value) {
              return value + ' 件'
            }
          },
          data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
        },
        // {
        //   name: '夜班产出数',
        //   type: 'bar',
        //   tooltip: {
        //     valueFormatter: function (value) {
        //       return value + ' 件'
        //     }
        //   },
        //   data: [20, 49, 70, 23, 25, 76, 135, 162, 32, 20, 6, 33]
        // },
        {
          name: '夜班不良数',
          type: 'bar',
          tooltip: {
            valueFormatter: function (value) {
              return value + ' 件'
            }
          },
          data: [26, 59, 90, 264, 287, 70, 175, 182, 487, 188, 60, 23]
        },
        {
          name: '白班不良率',
          type: 'line',
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value + ' %'
            }
          },
          data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2]
        },
        {
          name: '夜班不良率',
          type: 'line',
          yAxisIndex: 1,
          tooltip: {
            valueFormatter: function (value) {
              return value + ' %'
            }
          },
          data: [5, 4.2, 2, 5, 6, 10, 11.3, 3.4, 3.0, 6.5, 12, 6.2]
        },
        // {
        //   name: '白班达成率',
        //   type: 'line',
        //   yAxisIndex: 1,
        //   tooltip: {
        //     valueFormatter: function (value) {
        //       return value + ' %'
        //     }
        //   },
        //   data: [4, 4.2, 7.3, 8.5, 10.3, 14.2, 24.3, 27.4, 27.0, 20.5, 16.0, 10.2]
        // },
        // {
        //   name: '夜班达成率',
        //   type: 'line',
        //   yAxisIndex: 1,
        //   tooltip: {
        //     valueFormatter: function (value) {
        //       return value + ' %'
        //     }
        //   },
        //   data: [5.0, 7.2, 6.3, 7.5, 9.3, 13.2, 23.3, 26.4, 26.0, 19.5, 17.0, 9.2]
        // }
      ]
    }
    Object.assign(barOptionsData, customBarOptions)
  } catch (e: any) {
    ElMessageBox.alert(`班别产出汇总分析:${e.message || JSON.stringify(e)}`)
  }
}
// 查询每日生产报表
const queryDetailData = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['每日生产明细记录的查询语句']
    const list = await searchList<systemItemVo[]>({
      sql: DBQUERY,
      params: {
        'W.DEPTNO': query.value.DEPTNO,
        'B.WCSEQ': query.value.WCSEQ,
        'B.JOBNO': query.value.JOBNO,
        'B.WKDATE__gte@date': query.value.startDate,
        'B.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    reportListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`生产明细记录:${e.message || JSON.stringify(e)}`)
  }
}
const loadData = async () => {
  loading.value = true
  try {
    // 模拟数据加载
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await queryAchiRate()
    await queryClassItem()
    await queryDetailData()
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
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
    display: grid;
    grid-template-columns: 450px auto;
    gap: 20px;
  }
}
</style>
