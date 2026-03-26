<template>
  <div>
    <div v-if="evtItem.tableShow" class="table">
      <div class="tableHead flex">
        <div class="leftText sBox"></div>
        <div v-for="item in evtItem.tableHeader" class="flex1 sBox">{{ item }}</div>
      </div>
      <div v-for="item in evtItem.table" class="tableContent flex">
        <div class="leftText sBox" :style="{'font-size':item.name.length>4?'10px':'12px'}">{{ item.name }}</div>
        <div v-for="(item2,index2) in evtItem.tableHeader" class="flex1 sBox" :style="{'font-size':evtItem.tableHeader.length>4?'10px':'12px'}">{{ item[index2] }}</div>
      </div>
    </div>
    <div v-else class="c-red">请选择表格</div>
  </div>
</template>

<script>
export default {
  name: 'TableVue',
  props: {
    evtItem: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
    };
  },
  mounted() {
  },
  updated() {
    console.log(this.evtItem, '右侧表格');
  }
};
</script>

<style lang="scss" scoped>
    .table{
      text-align: center;
      border: 1px solid #9b9b9b;
      border-radius: 5px;
      margin:8px 0;

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
