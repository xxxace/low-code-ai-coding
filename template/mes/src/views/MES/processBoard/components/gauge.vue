<template>
  <div class="gauge flex-column box-r box-s black-box p-10" style="padding-bottom: 0">
    <div class="c-white title">{{ props.title }}</div>
    <div class="flex-column flex-align-center">
      <div class="mt10 c-white text-lg mt20 flex-align-center" style="width: 100%">
        <span style="width: 50%" class="text-right">完成数：</span>
        <span class="c-blue text-bold flex1" style="font-size: 26px">{{ QTY }}</span>
      </div>
      <!-- <el-progress :text-inside="true" :stroke-width="20" :percentage="QTYPERCENTAG" text-color="#fff"></el-progress> -->
      <div class="c-white text-lg mt10 mb10 flex-align-center" style="width: 100%">
        <span style="width: 50%" class="text-right">未完成：</span>
        <span class="c-blue text-bold flex1" style="font-size: 26px">{{ PSQTY }}</span>
      </div>
    </div>

    <!-- <el-progress :text-inside="true" :stroke-width="20" :percentage="100-QTYPERCENTAG" text-color="#fff" color="#1665b7"></el-progress> -->
    <div ref="gauge" class="flex1" style="width: 100%; height: 100%"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  resData: {
    type: [Array, Object],
    default: () => []
  },
  xyText: {
    type: [Array, Object],
    default: () => []
  }
})
const gauge = ref()
const myChart = ref('')
const PSQTY = ref(0)
const QTY = ref(0)
const QTYPERCENTAG = ref(0)
watch(
  () => props.resData,
  () => {
    refresh()
  }
)
onMounted(() => {
  myChart.value = echarts.init(gauge.value)
  window.addEventListener('resize', () => {
    myChart.value.resize()
  })
  refresh()
})
const refresh = () => {
  myChart.value.clear()
  let value = 0
  let lightColor = '#409eff'
  let blackColor = '#2276f3'
  PSQTY.value = 0
  QTY.value = 0
  props.resData.forEach((item) => {
    PSQTY.value += item.PSQTY || 0
    QTY.value += item.QTY || 0
  })
  value = PSQTY.value ? parseFloat((QTY.value / PSQTY.value) * 100).toFixed(2) : 0
  QTYPERCENTAG.value = value
  if (value >= 100) {
    lightColor = '#ff8c55'
    blackColor = '#c10100'
  }
  const option = {
    title: {
      show: false,
      text: props.title,
      left: 'center',
      textStyle: {
        color: '#fff'
      }
    },
    series: [
      {
        type: 'gauge',
        center: ['50%', '100%'],
        startAngle: 180,
        endAngle: 360,
        bottom: 1,
        min: 0,
        max: 100,
        radius: '150px',
        itemStyle: {
          color: '#409eff'
        },
        progress: {
          show: true,
          width: 22,
          roundCap: true,
          itemStyle: {
            color: {
              type: 'linear',
              x: 1,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: lightColor // 0% 处的颜色
                },
                {
                  offset: 1,
                  color: blackColor // 100% 处的颜色
                }
              ]
            }
          }
        },
        pointer: {
          show: true
        },
        axisLine: {
          lineStyle: {
            width: 20
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          distance: 26,
          color: '#999',
          fontSize: 14,
          rotate: 0
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 20,
          color: lightColor,
          itemStyle: {
            borderWidth: 10,
            color: '#fff',
            borderColor: lightColor
          }
        },
        splitLine: {
          length: 5,
          lineStyle: {
            width: 1,
            color: '#fff'
          }
        },
        title: {
          show: true,
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          offsetCenter: [0, '100%']
        },
        detail: {
          valueAnimation: true,
          width: '100%',
          lineHeight: 30,
          borderRadius: 8,
          offsetCenter: [0, '-120%'],
          fontSize: 38,
          fontWeight: 'bolder',
          formatter: '{value} %',
          color: 'inherit'
        },
        data: [
          {
            value
          }
        ]
      }
    ]
  }
  myChart.value.setOption(option)
}
</script>

<style lang="scss" scoped>
.gauge {
  min-height: 300px;
  max-height: 100%;

  .title {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
  }
}
</style>
