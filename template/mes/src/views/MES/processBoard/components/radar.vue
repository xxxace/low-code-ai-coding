<template>
  <div class="radar box-r box-s black-box p-10 flex-column">
    <div ref="radar" style="width: 100%; height: 100%"></div>
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
watch(
  () => props.resData,
  () => {
    refresh()
  }
)
const myChart = ref('')
const radar = ref()
onMounted(() => {
  myChart.value = echarts.init(radar.value)
  window.addEventListener('resize', () => {
    myChart.value.resize()
  })
  refresh()
})
const bgColorFor = (item) => {
  const R = Math.floor(Math.random() * 180)
  const G = Math.floor(Math.random() * 180)
  const B = Math.floor(Math.random() * 180)
  return `rgba(${R},${G},${B},1)-rgba(${R},${G},${B},0.8)`
}
const refresh = () => {
  myChart.value.clear()
  const indicator = []
  const data = []
  props.resData.forEach((item) => {
    const color = bgColorFor().split('-')
    indicator.push({
      value: item.value,
      name: `${item.name} ${item.value}个`,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color[0] },
          { offset: 1, color: color[1] }
        ])
      }
    })
  })
  const option = {
    title: {
      left: 'center',
      text: props.title,
      textStyle: {
        color: '#fff'
      }
    },
    tooltip: {
      trigger: 'item'
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
    legend: {
      bottom: 0,
      textStyle: {
        color: '#fff',
        fontWeight: 'bold'
      }
    },
    series: [
      {
        name: '',
        type: 'pie',
        radius: ['40%', '60%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5
        },
        label: {
          fontSize: 15,
          color: '#fff',
          fontWeight: 'bold'
        },
        labelLine: {
          show: true
        },
        data: indicator
      }
    ]
  }
  myChart.value.setOption(option)
}
</script>

<style lang="scss" scoped>
.radar {
  width: 500px;
  min-height: 300px;
  max-height: 100%;
}
</style>
