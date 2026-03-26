<template>
  <div class="line box-r box-s bg-white p-10">
    <div ref="line" style="width:100%;height:100%;"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  mounted() {
    const option = {
      title: {
        text: this.title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['第1周', '第2周', '第3周', '第4周'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {},
          dataZoom: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['150% A++', '120% A+', '100% A', '80% B', '50% C', '<50% D']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '第1周',
          type: 'line',
          data: [120, 132, 101, 134, 90, 230, 210]
        },
        {
          name: '第2周',
          type: 'line',
          data: [220, 182, 191, 234, 290, 330, 310]
        },
        {
          name: '第3周',
          type: 'line',
          data: [150, 232, 201, 154, 190, 330, 410]
        },
        {
          name: '第4周',
          type: 'line',
          data: [320, 332, 301, 334, 390, 330, 320]
        }
      ]
    };
    const myChart = echarts.init(this.$refs.line);
    window.addEventListener('resize', () => {
      myChart.resize();
    });
    myChart.setOption(option);
  },
};
</script>

<style lang="scss" scoped>
    .line{
        height:300px;
    }
</style>
