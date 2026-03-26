<template>
  <div v-if="evtItem.content" class="text-box flex-column" :class="evtItem.content?'':'c-red'">
    <div>
      {{ evtItem.isStar?'★':'' }}{{ evtItem.content }}
    </div>
  </div>
  <div v-else class="c-red">
    请编辑数据
  </div>
</template>

<script>
export default {
  name: 'TextBox',
  props: {
    evtItem: {
      type: Object,
      default: () => {},
    }
  },
  data() {
    return {
      index: 0
    };
  },
  mounted() {
    console.log(this.evtItem, '右侧文本');
  },
  updated() {
    console.log(this.evtItem, '最新文本');
  }
};
</script>

<style lang="scss" scoped>
    .text-box{
        border-bottom: 1px solid #9b9b9b;
        padding:0 5px;
        line-height: 22px;
        white-space: pre-wrap;
    }

    .text-box{
        border-bottom: 1px solid #9b9b9b;
        line-height: 22px;
        padding:0 5px;
        word-wrap:break-word;
        word-break: break-all;
        cursor: pointer;

    }
    .table{
      text-align: center;
      border: 1px solid #9b9b9b;
      border-radius: 5px;
      margin:8px 0;
      position:relative;

      .tableHead{
        border-bottom: 1px solid #9b9b9b;
        padding:0 5px;
      }
      .tableContent{
        border-bottom: 1px solid #9b9b9b;
        padding:0 5px;
        &:last-child{
        border-bottom: 0px;
        }
      }
      .leftText{
          width: 55px;
          text-align: left;
          line-height: 18px;
        }
      .sBox{
        border-right: 1px solid #9b9b9b;
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: center;
        &:last-child{
          border-right: 0;
        }
      }
    }
</style>
