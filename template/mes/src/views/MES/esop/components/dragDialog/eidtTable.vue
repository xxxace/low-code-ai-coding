<template>
  <div class="flex">
    <div class="flex-column select">
      <div><h2>操作</h2></div>
      <div class="pr10 mt10 flex-column">
        <!-- <span>行(X轴)</span>
        <el-cascader
          ref="myCas"
          v-model="tableValue"
          placeholder="请选择行"
          :options="options"
          :props="mypro"
          collapse-tags
          clearable
          @change="getTable"
        ></el-cascader> -->
        <div style="font-size:16px ;">选择工序:</div>
        <el-dropdown :hide-on-click="false" trigger="click" @command="command">
          <div class="el-dropdown-link itser flex">
            <div class="flex1" style="color: #b6b8bd; font-size: 14px;">请选择工序</div>
            <i class="el-icon-arrow-down text-right" style="color: #b6b8bd;"></i>
          </div>
          <!-- <span class="el-dropdown-link">
            选择工序<i class="el-icon-arrow-down el-icon--right"></i>
          </span> -->
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="(item,index) in options" :key="index" :command="item.label">{{ item.label }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
      <div class="flex-column mt10">
        <span style="font-size: 16px; ">选择尺寸：</span>
        <el-cascader
          ref="myCasHead"
          v-model="tableHeaderValue"
          placeholder="请选择尺寸"
          :options="optionsSize"
          :props="mypro1"
          collapse-tags
          clearable
          @change="getHead"
        ></el-cascader>
      </div>
      <!-- 行列互换 -->
      <!-- <div class="pt10 ">
        <span style="font-size: 16px;">行列互换:</span>
        <el-tooltip :content="value1" placement="top">
          <el-switch
            v-model="value1"
            :active-value="'尺寸为行，工序为列'"
            :inactive-value="'尺寸为列，工序为行'"
            @change="swithChange"
          >
          </el-switch>
        </el-tooltip>
      </div> -->
    </div>
    <div class="eidtTable flex1">
      <h2>表格</h2>
      <!-- <div v-if="tableItem.tableHeader.length<7" class="right-btn" @click="addHeader">
        <i class="el-icon-plus"></i>
      </div>
      <div class="bottom-btn" @click="addBtom">
        <i class="el-icon-plus"></i>
      </div> -->
      <div v-if="tableShow" class="table ">
        <div v-if="tableItem.tableHeader.length>0" class="tableHead flex ">
          <div class="leftText sBox"></div>
          <div v-for="(item,index) in tableItem.tableHeader" :key="index" class=" sBox flex1">
            <div class="flex1">
              <el-input
                v-model="tableItem.tableHeader[index]"
                size="small"
              >
              </el-input>
            </div>
            <!-- <div class="del-btn" @click="delHeader(index)">
              <i class="el-icon-delete"></i>
            </div> -->
          </div>
        </div>
        <div v-for="(item,index) in tableItem.table" :key="index" class="tableContent flex">
          <div class="leftText sBox" :style="{'font-size':item.name.length>4?'8px':'2px'}">
            <div class="del-btn" @click="delTable(index)">
              <i class="el-icon-delete"></i>
            </div>
            <el-input
              v-model=" item.name"
              size="small"
              type="textarea"
            >
            </el-input>
          </div>
          <div v-for="(item2,index2) in tableItem.tableHeader" :key="index2" class="flex1 sBox" :style="{'font-size':tableItem.tableHeader.length>4?'12px':'14px'}">
            <el-input
              v-model="item[`${index2}`]"
              size="small"
            >
            </el-input>
          </div>
        </div>
      </div>
    </div>
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
      tableItem: {},
      tableShow: true,
      mypro: { multiple: true, emitPath: false, checkStrictly: true },
      mypro1: { multiple: true, emitPath: false, checkStrictly: true },
      defaultV: [],
      options: [{
        value: 2,
        label: '袖尾锁眼线出盘拉'
      }, {
        value: 7,
        label: '领顶锁眼线出盘双拉',
      }, {
        value: 12,
        label: '后领锁眼线出盘拉',
        // }]
      },
      // {
      //   value: 17,
      //   label: '西北',
      //   children: [{
      //     value: 18,
      //     label: '陕西',
      //   }, {
      //     value: 21,
      //     label: '新疆维吾尔族自治区',
      //   }]
      // }
      ],
      optionsSize: [
        { value: 1, label: 'XXS' },
        { value: 2, label: 'XS' },
        { value: 3, label: 'S' },
        { value: 4, label: 'M' },
        { value: 5, label: 'L' },
        { value: 6, label: 'XL' },
        { value: 7, label: 'XXL' },
        { value: 8, label: '3XL' },
        { value: 9, label: '4XL' },

      ],
      value1: '尺寸为列，工序为行',
      tableValue: [], // 选择框的默认值
      // tableHeaderValue: [2, 3, 4, 5, 6, 7, 8, 9], // 选择框的默认值
      tableHeaderValue: [2, 4, 5, 7, 8, 9], // 选择框的默认值
    };
  },
  methods: {
    command(val) {
      this.tableItem.table.push({ name: val });
      console.log(val);
    },
    // 选择尺寸
    getHead(val) {
      console.log('测试', val);
      if (val.length > 0) {
        const list = this.$refs.myCasHead.getCheckedNodes();
        const tableHeader = [];
        list.forEach((item) => {
          tableHeader.push(item.label);
          this.tableItem.tableHeader = tableHeader;
          console.log(item.label);
        });
      } else {
        this.tableItem.tableHeader = [];
      }
    },
    getTable(val) {
      // 选择工序
      console.log('测试', val);
      console.log(this.tableItem);
      if (val.length > 0) {
        const list = this.$refs.myCas.getCheckedNodes();
        const table = [];
        list.forEach((item) => {
          table.push({ name: item.label });
          this.tableItem.table = table;
          console.log(item.label);
        });
      } else {
        this.tableItem.table = [];
      }
    },
    open(itm) {
      console.log(itm, 'open');
      this.tableItem = itm;
      const list = [];
      this.optionsSize.forEach((item) => {
        itm.tableHeader.forEach((item1) => {
          if (item.label == item1) {
            list.push(item.value);
          }
        });
      });
      this.tableHeaderValue = list;
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
      console.log('执行了提交');
      if (this.tableItem.table.length < 1) {
        this.$message.warning('没有数据，请选择表格数据');
      }
    },
    // 行列互换
    swithChange() {
      // 互换选择框选项
      // const textOptions = this.optionsSize;
      // this.optionsSize = this.options;
      // this.options = textOptions;
      // // 互换已选择值
      // const textValue = JSON.parse(JSON.stringify(this.tableValue));
      // this.tableValue = JSON.parse(JSON.stringify(this.tableHeaderValue));
      // this.tableHeaderValue = textValue;
      // // 互换表格值
      console.log(this.tableItem.table, this.tableItem.tableHeader);
      const textTable = [];
      this.tableItem.table.forEach((item) => {
        textTable.push(item.name);
      });
      const textTableHeader = [];
      this.tableItem.tableHeader.forEach((item) => {
        textTableHeader.push({ name: item });
      });
      this.tableItem.table = textTableHeader;
      this.tableItem.tableHeader = textTable;
    }
  },
};
</script>

<style lang="scss" scoped>
.select{
  margin-right: 10px;
  border-right: 1px solid;
  :deep(){
    .el-input {
      width: 140px;

    }
  }
}
.itser{
  width: 120px;
  border: 1px solid #DCDFE6 ;
  border-radius: 4px;
  padding: 10px;
  font-size: 16px;
  color: #606266;
}
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
      .wid{
        width: 44px;
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
          // padding-right:15px !important;
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
