<template>
  <div class="textPie black-box box-r box-s mr10 flex1" style="padding-right: 10px">
    <div class="mr10 p-10 flex1 mb10">
      <div class="text-llg text-bold c-white">{{ props.textArr[0] || '--' }}</div>
      <div class="flex-align-center mt10">
        <span class="c-gray">{{ props.textArr[1] || '--' }}</span>
        <h2 class="c-blue">{{ props.resDate[0] }}</h2>
      </div>
      <div class="flex-align-center" style="margin-top: 5px">
        <span class="c-gray">{{ props.textArr[2] || '--' }}</span>
        <span style="font-size: 16px" class="c-white">{{ props.resDate[1] }}</span>
      </div>
    </div>
    <div>
      <div ref="pressure" class="pressure"></div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  textArr: {
    type: Array,
    default: ()=>[]
  },
  resDate: {
    type: Array,
    default: ()=>[]
  }
})
const myChart = ref()
const pressure = ref()

watch(
  () => props.resDate,
  () => {
    refresh()
  }
)
onMounted(() => {
  myChart.value = echarts.init(pressure.value)
  window.addEventListener('resize', () => {
    myChart.value.resize()
  })
  refresh()
})
const refresh = () => {
  myChart.value.clear()
  let lightColor = '#409eff'
  let blackColor = '#2276f3'

  if (props.resDate[2] > 100) {
    lightColor = '#ff8c55'
    blackColor = '#c10100'
  }
  const option = {
    series: [
      {
        type: 'gauge',
        center: ['50%', '100%'],
        startAngle: 180,
        endAngle: 0,
        bottom: 1,
        min: 0,
        max: 100,
        radius: '100px',
        itemStyle: {
          color: '#409eff'
        },
        progress: {
          show: true,
          width: 10,
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
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 10
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        anchor: {
          show: false
        },
        title: {
          show: true,
          color: '#fff',
          fontSize: 16,
          offsetCenter: [0, '-10%']
        },
        detail: {
          valueAnimation: true,
          width: '100%',
          lineHeight: 30,
          borderRadius: 8,
          offsetCenter: [0, '-40%'],
          fontSize: 26,
          fontWeight: 'bolder',
          formatter: '{value} %',
          color: 'inherit'
        },
        data: [
          {
            value: props.resDate[2] || 0,
            name: props.textArr[3]
          }
        ]
      }
    ]
  }
  myChart.value.setOption(option)
  myChart.value.resize()
}
</script>

<style lang="scss" scoped>
.textPie {
  display: flex;
  align-items: flex-end;
  .c-gray {
    font-size: 15px;
  }
  .pressure {
    width: 200px;
    height: 100px;
  }
}
</style>
