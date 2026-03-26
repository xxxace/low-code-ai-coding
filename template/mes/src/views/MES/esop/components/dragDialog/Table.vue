<template>
  <div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      tableItem: {}
    };
  },
  methods: {
    open(itm) {
      this.tableItem = JSON.parse(JSON.stringify(itm));
      console.log(this.value);
      console.log(123, itm);
    },
    delHeader(idx) {
      if (this.tableItem.tableHeader.length == 1) {
        this.$message({
          message: '至少保留一条数据',
          type: 'warning'
        });
        return;
      }
      this.tableItem.tableHeader.splice(idx, 1);
    },
    delTable(idx) {
      if (this.tableItem.table.length == 1) {
        this.$message({
          message: '至少保留一条数据',
          type: 'warning'
        });
        return;
      }
      this.tableItem.table.splice(idx, 1);
    },
    addHeader() {
      this.tableItem.tableHeader.push('');
    },
    addBtom() {
      this.tableItem.table.push({
        name: ''
      });
    },
    commit() {
      console.log(this.tableItem);
      this.$emit('input', this.tableItem);
    }
  },
};
</script>

  <style lang="scss" scoped>
  .eidtTable{
    position: relative;
    .right-btn,
    .bottom-btn{
      background: #409eff;
      color:#fff;
      cursor: pointer;
    }
    .del-btn{
      background: #ff5656;
      color: #fff;
      padding:3px;
      border-radius: 50%;
      margin-left: 5px;
      font-size: 10px !important;
      position: absolute;
      right:0;
      top:0;
      z-index: 8;
      width:15px;
      height:15px;
      line-height: 15px;
      text-align: center;
    }
    .right-btn{
      position: absolute;
      padding:10px 0px;
      right:-14px;
      top:50%;
      transform: translateY(-50%);
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
    .bottom-btn{
      position: absolute;
      padding:0px 10px;
      transform: translateX(-50%);
      left:50%;
      bottom:-16px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }
    .table{
        text-align: center;
        border: 1px solid #9b9b9b;
        border-radius: 5px;
        margin:8px 0;
        cursor: pointer;
        ::v-deep .el-input__inner,
        ::v-deep .el-textarea__inner{
          padding:0 5px !important;
        }

        .tableHead{
          border-bottom: 1px solid #9b9b9b;
          padding:0 5px;
        }
        .tableContent{
          position: relative;
          border-bottom: 1px solid #9b9b9b;
          padding:0 5px;
          &:last-child{
          border-bottom: 0px;
          }
        }
        .leftText{
            width: 80px;
            text-align: left;
            line-height: 18px;
            padding-right:15px !important;
          }
        .sBox{
          border-right: 1px solid #9b9b9b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding:5px;
          position: relative;
          &:last-child{
            border-right: 0;
          }
        }
      }
  </style>
