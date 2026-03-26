<template>
  <div class="bar flex flex-col">
    <div class="flex-1" ref="bar"/>
    <div class="mb10 ml10 flex-align-center mt10">
      <div>Y轴：</div>
      <el-input-number size="small" v-model="yNum" :step="10" :min="10" step-strictly @change="changeYnum"/>
      <div class="ml10">X轴：</div>
      <div>
        <el-select v-model="minDate" style="width:100px" placeholder="Select" @change="changeX" size="small">
          <el-option v-for="(item, index) in xList" :disabled="xStartDisBlo(index)" :key="item" :label="item"
                     :value="item"/>
        </el-select>
        至
        <el-select v-model="maxDate" style="width:100px" placeholder="Select" @change="changeX" size="small">
          <el-option v-for="(item, index) in xList" :disabled="xEndDisBlo(index)" :key="item" :label="item"
                     :value="item"/>
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import {useDebounceFn, useDateFormat} from '@vueuse/core'
import {useBarTable} from '@/views/barTable/store/index'
import {useUser} from '@/store/useUser'
import {storeToRefs} from 'pinia'
import {safeDestructure, safeArrayAccess, safeNumber, safeString} from '@/utils/safeUtils'
import {ElMessage} from 'element-plus'
import {getAnalogousColors} from '@/views/barTable/components/utils/color'

let myChart = null
const bar = ref(null)
const isComponentMounted = ref(true)
const {productLineName, productionCapacityBoolean, productionCapacity} = storeToRefs(useUser())
const barTableStore = useBarTable()
const {barColorList, exstfg, barStfg} = storeToRefs(barTableStore)


const yNum = ref(200)

const changeYnum = useDebounceFn(() => {
  createChart()
}, 300)

const props = defineProps({
  evt: {
    type: Object,
    default: () => {
    },
  },
  type: {
    type: String,
    default: 'WCNO',
  },
  pPsty: {
    type: String,
    default: '',
  },
  minDate: String,
  maxDate: String
})

const {WCNAME = '', week = [], bar: barList = []} = safeDestructure(props.evt, {
  WCNAME: '',
  week: [],
  bar: []
})

console.log(WCNAME, week, barList)

const title = productLineName.value || WCNAME
const xList = week.map((item) => `${item}周`)
const xMap = (() => {
  const map = {}
  xList.forEach((key, i) => {
    map[key] = {
      index: i,
      value: key
    }
  })

  return map
})()
const minDate = ref(props.minDate)
const maxDate = ref(props.maxDate)
const showXList = shallowRef([])

// 色系 https://www.cnblogs.com/moranjl/articles/16567046.html
const redSeriesDist = [
  {
    SORTBY: '1',
    color: '#4d000a'
  },
  {
    SORTBY: '1',
    color: '#770818'
  },
  {
    SORTBY: '1',
    color: '#a1151e'
  },
  {
    SORTBY: '1',
    color: '#cb272d'
  },
  {
    SORTBY: '1',
    color: '#f53f3f'
  },
  {
    SORTBY: '1',
    color: '#f76560'
  },
  {
    SORTBY: '1',
    color: '#f98981'
  },
  {
    SORTBY: '1',
    color: '#fbaca3'
  },
  {
    SORTBY: '1',
    color: '#fdcdc5'
  },
  {
    SORTBY: '1',
    color: '#ffece8'
  },
]
const greenSeriesDist = [
  {
    SORTBY: '2',
    color: '#e8ffea'
  },
  {
    SORTBY: '2',
    color: '#aff0b5'
  },
  {
    SORTBY: '2',
    color: '#7be188'
  },
  {
    SORTBY: '2',
    color: '#4cd263'
  },
  {
    SORTBY: '2',
    color: '#23c343'
  },
  {
    SORTBY: '2',
    color: '#00b42a'
  },
  {
    SORTBY: '2',
    color: '#009a29'
  },
  {
    SORTBY: '2',
    color: '#008026'
  },
  {
    SORTBY: '2',
    color: '#006622'
  },
  {
    SORTBY: '2',
    color: '#004d1c'
  },
]
const blueSeriesDist = [
  {
    "SORTBY": '3',
    "color": "#002F73"
  },
  {
    "SORTBY": '3',
    "color": "#3C5AFF"
  },
  {
    "SORTBY": '3',
    "color": "#0066FF"
  },
  {
    "SORTBY": '3',
    "color": "#28569C"
  },
  {
    "SORTBY": '3',
    "color": "#3E71B7"
  },
  {
    "SORTBY": '3',
    "color": "#004FFF"
  },
  {
    "SORTBY": '3',
    "color": "#4B96FF"
  },
  {
    "SORTBY": '3',
    "color": "#0C00E9"
  },
  {
    "SORTBY": '3',
    "color": "#1850AE"
  },
  {
    "SORTBY": '3',
    "color": "#3372F1"
  },
  {
    "SORTBY": '3',
    "color": "#4D7BF5"
  },
  {
    "SORTBY": '3',
    "color": "#6684F9"
  }
]

const getXIndex = (key) => {
  const item = xMap[key]
  if (!item) return -1
  return item.index
}

const xStartDisBlo = (idx) => {
  const findIdx = getXIndex(maxDate.value)
  return findIdx < idx
}

const xEndDisBlo = (idx) => {
  const findIdx = getXIndex(minDate.value)
  return findIdx > idx
}

const dataList = shallowRef([])

// 生成数据
const setChatDate = () => {
  const chatList = []
  // 用于计算每个X轴位置的总和
  const weeklyTotals = new Map()
  const minIndex = getXIndex(minDate.value)
  const maxIndex = getXIndex(maxDate.value)

  const colorMap = new Map()
  barColorList.value.forEach(item => {
    colorMap.set(`${item.ORDNO}-${item.WCSEQ}-${item.SORTBY}`, item.color)
  })

  function checkColor(color) {
    return barColorList.value.some(item => item.color === color)
  }

  barList.forEach((item) => {
    // debugger
    const array = []

    for (let i = 0; i < item.length; i++) {
      const index = i

      if (index < minIndex) continue
      if (index > maxIndex) break

      const sItem = item[i]
      // EX_D停工 EX_F完工 EX_C取消 EX_O委外 不纳入统计
      const {ORDNO = '', WCSEQ = '', SORTBY = ''} = safeDestructure(sItem, {ORDNO: '', WCSEQ: '', SORTBY: ''})
      if (!ORDNO) {
        array.push(null)
        continue
      }
      let color = colorMap.get(`${ORDNO}-${WCSEQ}-${SORTBY}`)

      if (!color) {
        // 根据 SORTBY 选择对应的色系
        let colorSeries = []
        if (SORTBY === '1') {
          colorSeries = redSeriesDist
        } else if (SORTBY === '2') {
          colorSeries = greenSeriesDist
        } else if (SORTBY === '3') {
          colorSeries = blueSeriesDist
        } else {
          // 默认使用蓝色色系
          colorSeries = blueSeriesDist
        }

        let count = 0
        while (!color || checkColor(color)) {
          if (color && count > 20) {
            color = getAnalogousColors(color, 1)[1]
            break
          }
          // 从对应色系中随机选择一个颜色
          const randomIndex = getRandomInt(colorSeries.length)
          color = colorSeries[randomIndex]?.color
          count++
        }

        const evtBar = {
          ORDNO,
          WCSEQ,
          SORTBY,
          color
        }
        barColorList.value.push(evtBar)
        colorMap.set(`${evtBar.ORDNO}-${evtBar.WCSEQ}-${evtBar.SORTBY}`, evtBar.color)
      }

      const pctValue = (!barStfg.value.length || (barStfg.value.includes(sItem.STFG))) ? safeNumber(sItem.PCT, 0) : 0

      // 累加每个X轴位置的百分比值
      if (!weeklyTotals.has(index)) {
        weeklyTotals.set(index, 0)
      }
      weeklyTotals.set(index, weeklyTotals.get(index) + pctValue)

      array.push({
        name: safeString(sItem.ORDNO),
        value: pctValue,
        detail: sItem,
        itemStyle: {color}
      })
    }

    chatList.push({
      type: 'bar',
      stack: 'total',
      data: array,
      barGap: 10,
      barCategoryGap: 10,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}',
      },
      emphasis: {
        disabled: true
      },
      labelLayout(params) {
        return {
          fontSize: params.rect.height < 15 ? 0 : 12,
        }
      },
    })
  })

  dataList.value = chatList

  // 计算所有周的总和最高值，并动态设置yNum
  if (weeklyTotals.size > 0) {
    const maxTotal = Math.max(...weeklyTotals.values())
    // 向上取整到最近的10的倍数，并增加10%的缓冲空间
    const calculatedYNum = Math.ceil(maxTotal * 1.1 / 10) * 10
    // 确保最小值不小于100，最大值不超过500
    yNum.value = Math.max(100, Math.min(1500, calculatedYNum))
  }
}

// 生成图表
const createChart = () => {
  // debugger
  if (!myChart) return
  // 使用 nextTick 确保 DOM 更新完成后再渲染
  nextTick(() => {
    myChart.clear()
    const options = {
      title: {
        text: title,
        left: 'center',
        triggerEvent: true,
        top: '15px',
      },
      tooltip: {
        // trigger: 'item',
        appendToBody: false,
        appendTo: '.view-container',
        axisPointer: {
          type: 'cross',
          label: {
            margin: 7,
          },
        },
        formatter(params) {
          const {seriesIndex = 0, dataIndex = 0} = safeDestructure(params, {seriesIndex: 0, dataIndex: 0})

          // 使用安全数组访问
          const seriesData = safeArrayAccess(dataList.value, seriesIndex)
          if (!seriesData) {
            return '数据不存在'
          }

          const dataItem = safeArrayAccess(seriesData.data, dataIndex)
          if (!dataItem) {
            return '数据不存在'
          }

          const {
            PLANQTY = 0,
            ORDNO = '',
            PLANHRS = 0,
            PCT = 0,
            STFG = '',
            WKHRS = 0,
            V_CLNTDTTO = '',
            PS_WKNUM = 0,
            MAX_DT = '',
            MIN_DT = '',
            ORDTYPE = ''
          } = safeDestructure(dataItem.detail, {
            PLANQTY: 0,
            ORDNO: '',
            PLANHRS: 0,
            PCT: 0,
            STFG: '',
            WKHRS: 0,
            V_CLNTDTTO: '',
            PS_WKNUM: 0,
            MAX_DT: '',
            MIN_DT: '',
            ORDTYPE: ''
          })

          const startDate = MIN_DT ? useDateFormat(MIN_DT, 'YYYY-MM-DD').value : '--'
          const endDate = MAX_DT ? useDateFormat(MAX_DT, 'YYYY-MM-DD').value : '--'
          const clntdtto = V_CLNTDTTO ? useDateFormat(V_CLNTDTTO, 'YYYY-MM-DD').value : '--'
          const status = exstfg.value.find((item) => item.CODE === STFG)
          return `<b>单类：${safeString(ORDTYPE)}</b><br/>
          <b>单号：${safeString(ORDNO)}</b> <span style="color: #5f6a87;">厂期: ${clntdtto}</span>
          <br/>计划排产数量：${safeNumber(PLANQTY)}<br/>
        计划排产时数：${PLANHRS}<br/>
        总产能时数：${WKHRS}<br/>
        日均机位数：${safeNumber(PS_WKNUM)}<br/>
        占比：${safeNumber(PCT)}%<br/>
        状态：${status?.CNAME || '--'}<br/>
        排产日期范围：${startDate} 至 ${endDate}`
        },
      },
      grid: {
        left: '60px',
        bottom: '30px',
        top: '60px',
        right: '30px',
      },
      xAxis: {
        data: showXList.value,
        triggerEvent: true, // ✅ 启用事件
        axisLabel: {
          show: true,
          hoverable: true, // 针对标签的悬停反馈
          color: '#666'
        },
        tooltip: {
          show: true,
          formatter(params) {
            // 获取该周的开始和结束日期
            const xAxisItem = showXList.value.find(item => item.value === params.name)
            if (!xAxisItem) return

            return `
            <div class="custom-tooltip" >
              <div class="tooltip-header">
                <strong>${xAxisItem.value}</strong>
              </div>
              <div class="tooltip-content">
                <div class="tooltip-item">
                  <span class="item-label">开始日期：</span>
                  <span class="item-value">${xAxisItem.start}</span>
                </div>
                <div class="tooltip-item">
                  <span class="item-label">结束日期：</span>
                  <span class="item-value">${xAxisItem.end}</span>
                </div>
              </div>
            </div>`
          },
        }
      },
      yAxis: {
        type: 'value',
        position: 'left',
        alignTicks: true,
        axisLabel: {
          formatter: '{value} %',
        },
        min: 0,
        max: yNum.value,
      },
      series: dataList.value,
    }
    myChart.setOption(options)
    mouseEvents(myChart)
  })
}

// X轴改变
const changeX = useDebounceFn(async () => {
  await nextTick()

  setChatDate()

  const filterList = []
  const minIndex = getXIndex(minDate.value)
  const maxIndex = getXIndex(maxDate.value)
  const tarDate = useDateFormat(new Date(), 'YYYY-MM-DD').value

  xList.forEach((item, index) => {
    if (minIndex <= index && maxIndex >= index) {
      // 使用安全数组访问
      const firstBarItem = safeArrayAccess(barList, 0)
      if (!firstBarItem) {
        return
      }

      const barDataItem = safeArrayAccess(firstBarItem, index)
      if (!barDataItem) {
        return
      }

      const startDate = useDateFormat(barDataItem.DATE_FR, 'YYYY-MM-DD').value
      filterList.push({
        value: item.substring(4, 7),
        start: barDataItem.DATE_FR,
        end: barDataItem.DATE_TO,
        textStyle: {
          color: startDate >= tarDate ? '#fff' : '#999',
          backgroundColor: startDate >= tarDate ? '#b28c4e' : '#f0f2f5',
          width: 40,
          height: 20,
          lineHeight: 20,
          borderRadius: 3,
          verticalAlign: 'top',
        },
      })
    }
  })

  showXList.value = filterList
  createChart()
}, 300);

function getRandomInt(length) {
  const min = 1
  const max = length
  return Math.floor(Math.random() * max) - 1
}

// 当状态值改变时
watch(() => barStfg, useDebounceFn(() => {
  setChatDate()
  createChart()
}, 300), {deep: true})

const mouseEvents = (chart) => {
  chart.on('click', (params) => {
    if ((params.componentType !== 'title' && params.componentType !== 'series') || props.type === 'JOBNO') return

    // 使用安全解构工具函数
    const {componentType = '', name = '', data = {}} = safeDestructure(params, {
      componentType: '',
      name: '',
      data: {}
    })

    if (componentType !== 'title') {
      // 方块 - 安全解构
      const {PSSEQ = '', WCSEQ = '', ORDNO = ''} = safeDestructure(data.detail || {}, {PSSEQ: '', WCSEQ: '', ORDNO: ''})

      // 彈窗模式 &WCSEQ=${WCSEQ} 去除产线
      window.open(`${window.location.origin}/#/ganntTable?PSSEQ=${PSSEQ}&ORDNO=${name}&type=bar&pPsty=${props.pPsty}`)
    } else {
      // 标题 - 安全解构
      const {text = ''} = safeDestructure(params.event?.target?.style || {}, {text: ''})

      if (!text) {
        return
      }

      const evt = props.evt
      if (!evt) {
        ElMessage.warning({
          message: `未找到匹配的产品信息，产品名称: ${text}`,
          offset: 150
        })
        return
      }

      if (!evt.WCSEQ) {
        ElMessage.warning({
          message: `产品信息缺少WCSEQ字段，产品名称: ${text}`,
          offset: 150
        })
        return
      }

      window.open(`${window.location.origin}/#/ganntTable?WCNAME=${title}&WCSEQ=${evt.WCSEQ}&type=title&pPsty=${props.pPsty}`)
    }
  })
}

const resizeHandler = useDebounceFn(() => {
  myChart.resize()
}, 300)

onMounted(() => {
  myChart = echarts.init(bar.value)
  changeX()
  window.addEventListener('resize', resizeHandler)
  setTimeout(() => {
    myChart.resize()
  }, 350)
})

onUnmounted(() => {
  isComponentMounted.value = false
  if (myChart) {
    myChart.dispose()
    myChart = null
    window.removeEventListener('resize', resizeHandler)
  }
})


defineExpose({
  updateMinMax(min, max) {
    minDate.value = min
    maxDate.value = max
    changeX()
  }
})
</script>

<style lang="scss" scoped>
.bar {
  width: 100%;
  height: 100%;
  min-height: 200px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.custom-tooltip {
  position: absolute;
  background-color: white;
  color: #686868;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  margin-top: -10px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #3f6db3;

  .tooltip-header {
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
    margin-bottom: 6px;
    text-align: center;
    font-size: 17px;
  }

  .tooltip-content {
    .tooltip-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      .item-label {
        color: #6a6a6a;
        margin-right: 8px;
        font-size: 14px;
      }

      .item-value {
        color: #6a6a6a;
        font-size: 14px;
      }
    }
  }

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: white;
  }
}
</style>
