<template>
  <div class="pie box-r box-s black-box p-10">
    <div ref="pie" style="width: 100%; height: 100%"></div>
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
  }
})
const myChart = ref('')
const pie = ref()
watch(
  () => props.resData,
  () => {
    refresh()
  }
)
onMounted(() => {
  myChart.value = echarts.init(pie.value)
  window.addEventListener('resize', () => {
    myChart.value.resize()
  })
  refresh()
})
const bgColorFor = () => {
  const R = Math.floor(Math.random() * 180)
  const G = Math.floor(Math.random() * 180)
  const B = Math.floor(Math.random() * 180)
  return `rgba(${R},${G},${B},1)-rgba(${R},${G},${B},0.8)`
}
const refresh = () => {
  const array = []
  props.resData.forEach((item) => {
    const color = bgColorFor().split('-')
    console.log(color)
    array.push({
      value: item.value,
      name: `${item.name} ${item.value}%`,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color[0] },
          { offset: 1, color: color[1] }
        ])
      }
    })
  })
  myChart.value.clear()
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
    legend: {
      bottom: 0,
      textStyle: {
        color: '#fff'
      }
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
    label: {
      fontSize: 15,
      color: '#fff'
    },
    labelLine: {
      show: false
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: array,
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
  myChart.value.setOption(option)
}
</script>

<style lang="scss" scoped>
.pie {
  min-height: 300px;
  max-height: 100%;
}
</style>
