<template>
  <div class="bar box-r box-s black-box p-10">
    <div ref="bar" style="width: 100%; height: 100%"></div>
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
const myChart = ref('')
const bar = ref()
watch(
  () => props.resData,
  () => {
    refresh()
  }
)
onMounted(() => {
  myChart.value = echarts.init(bar.value)
  window.addEventListener('resize', () => {
    myChart.value.resize()
  })
  refresh()
})
const refresh = () => {
  myChart.value.clear()
  const xData = []
  const sData = []
  const lightColor = '#409eff'
  const blackColor = '#2276f3'
  const itemStyle = {
    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: lightColor },
      { offset: 1, color: blackColor }
    ])
  }
  props.resData.forEach((item) => {
    xData.push(item.name)
    sData.push(item.value)
  })

  const option = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        color: '#fff'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    xAxis: {
      type: 'category',
      data: xData,
      name: props.xyText[0],
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        align: 'right',
        verticalAlign: 'bottom',
        padding: [0, 10, 0, 0]
      },
      axisLabel: {
        interval: 0,
        rotate: 0,
        color: '#fff'
      },
      axisLine: {
        // 刻度线相关设置
        lineStyle: {
          color: '#6e7079'
        }
      },
      splitLine: {
        // 分隔线相关设置
        lineStyle: {
          color: '#6e7079'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: `单位：${props.xyText[1]}`,
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        align: 'center',
        verticalAlign: 'bottom'
      },
      axisLabel: {
        color: '#fff'
      },
      splitLine: {
        // 分隔线相关设置
        lineStyle: {
          color: '#6e7079'
        }
      }
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        dataZoom: {}
      },
      iconStyle: {
        borderColor: '#fff'
      }
    },
    series: [
      {
        data: sData,
        type: 'bar',
        showBackground: true,
        itemStyle,
        barWidth: '40',
        backgroundStyle: {
          color: 'rgba(180, 180, 180, 0.2)'
        },
        markLine: {
          lineStyle: {
            color: '#6e7079'
          }
        },
        label: {
          show: true,
          position: 'outside',
          formatter: `{@score}${props.xyText[1]}`,
          color: '#fff'
        }
      }
    ]
  }
  myChart.value.setOption(option)
}
</script>

<style lang="scss" scoped>
.bar {
  min-height: 300px;
  max-height: 100%;
}
</style>
