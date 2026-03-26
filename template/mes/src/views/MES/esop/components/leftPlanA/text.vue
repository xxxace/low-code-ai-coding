<template>
  <div v-if="evtItem.show" class="text-box flex-column" :class="evtItem.content?'':'c-red'">
    <div><b>{{ index?`${index}.`:'' }}{{ evtItem.isStar?'★':'' }}{{ evtItem.name }}：</b>{{ evtItem.content ? evtItem.content:'--' }}</div>
    <div v-if="evtItem.tableShow" class="table">
      <div class="tableHead flex">
        <div class="leftText sBox"></div>
        <div v-for="(item,index1) in evtItem.tableHeader" :key="index1" class="flex1 sBox">{{ item }}</div>
      </div>
      <div v-for="(item,index3) in evtItem.table" :key="index3" class="tableContent flex">
        <div class="leftText sBox" :style="{'font-size':item.name.length>4?'10px':'14px'}">{{ item.name }}</div>
        <div v-for="(item2,index2) in evtItem.tableHeader" :key="index2" class="flex1 sBox" :style="{'font-size':evtItem.tableHeader.length>6?'10px':'14px'}">{{ item[index2] }}</div>
      </div>
    </div>
    <div v-for="(item,index4) in evtItem.marksList" :key="`marks${index4}`" :class="item.text?'':'c-red'">
      {{ `★${item.text}` }}
    </div>
  </div>
  <div v-else class="c-red">
    请选择数据
  </div>
</template>

<script>
export default {
  name: 'TextBox',
  props: {
    evtItem: {
      type: Object,
      default: () => {}
    },
    index: {
      type: Number,
      default: 0
    },
  },
  data() {
    return {
    };
  },
  mounted() {
  },
  updated() {
    console.log('左侧', this.evtItem);
  },
  methods: {

  },
};
</script>

<style lang="scss" scoped>
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
          line-height: 14px;
          height: 30px;
        }
      .sBox{
        overflow: hidden;
        border-right: 1px solid #9b9b9b;
        display: flex;
        align-items: center;
        justify-content: center;
        &:last-child{
          border-right: 0;
        }
      }
    }
</style>
