<template>
  <div>
    <div class="flex1 ml10">
      <div>
        <div>
          <h2>选择工序</h2>
          <div class="myProudct mt10">
            <div class="flex border">
              <div class="flex1 flex-column">
                <h3 class="proudct text-center leftB">前幅</h3>
                <div class="scrollbar">
                  <div v-for="(item,index) in front" :key="index" class=" proudct p leftB" @click="addTable(item.name)">{{ item.name }}</div>
                </div>
              </div>
              <div class="scrobal"></div>
              <div class="flex1 flex-column">
                <h3 class="proudct text-center leftB">后幅</h3>
                <div class="scrollbar">
                  <div v-for="(item,index) in after" :key="index" class=" proudct p leftB" @click="addTable(item.name)">{{ item.name }}</div>
                </div>
              </div>
              <div class="flex1 flex-column">
                <h3 class="proudct text-center leftB">袖</h3>
                <div class="scrollbar">
                  <div v-for="(item,index) in sleeve" :key="index" class=" proudct p leftB" @click="addTable(item.name)">{{ item.name }}</div>
                </div>
              </div>
              <div class="flex1 flex-column">
                <h3 class="proudct text-center leftB">领</h3>
                <div class="scrollbar">
                  <div v-for="(item,index) in neck" :key="index" class=" proudct p leftB" @click="addTable(item.name)">{{ item.name }}</div>
                </div>
              </div>
              <div class="flex1 flex-column">
                <h3 class="proudct text-center leftB">其他</h3>
                <div class="scrollbar">
                  <div v-for="(item,index) in other" :key="index" class=" proudct p leftB" @click="addTable(item.name)">{{ item.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex mt10">
          <div class="flex1 ">
            <h2>选择模板:</h2>
            <div class="mt10">
              <el-dropdown trigger="click" @command="commandTemplate">
                <span class="el-dropdown-link">
                  <el-input v-model="selectTemplate" placeholder="可筛选" @input="template"></el-input>
                </span>
                <el-dropdown-menu slot="dropdown" class="mt10">
                  <el-dropdown-item v-for="(item,index) in templateList" :key="index" :command="item">{{ item.name }}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
          <div class="flex1 ">
            <div class="flex">
              <h2 class="flex1">选择尺寸:</h2><div class="flex1" style="line-height:24px"> <el-checkbox v-model="checked" @change="AllSelect">全选</el-checkbox></div>
            </div>
            <div class="pt10">
              <el-cascader
                v-model="sizeValue"
                :options="optionsSize"
                :props="props"
                collapse-tags
                clearable
                @change="changeSize"
              ></el-cascader>
            </div>
          </div>
        </div>
      </div>
      <div class="mt10">
        <div class=" eidtTable">
          <div class="table ">
            <!-- 表格头 -->
            <div v-if="tableItem.tableHeader.length>0" class="tableHead flex ">
              <div class="leftText sBox"></div>
              <div v-for="(item,index) in tableItem.tableHeader" :key="index" class=" sBox flex1">
                <div class="flex1 p-10">
                  <span class="text-conter ">{{ tableItem.tableHeader[index] }}</span>
                </div>
              </div>
            </div>
            <!-- 表格内容 -->
            <div v-for="(item,index) in tableItem.table" :key="index" class="tableContent flex"
                 draggable="true"
                 @dragstart="dragstartEvent($event, index)"
                 @dragover="dragoverEvent($event, index)"
                 @drop="dragdropEvent($event, index)"
                 @dblclick="dbdrag($event, index)"
            >
              <div class="leftText sBox" :style="{'font-size':item.name.length>4?'12px':'14px'}">
                <div class="del-btn" @click="delTable(index)">
                  <i class="el-icon-delete"></i>
                </div>
                <span>{{ item.name }}</span>
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
      tableItem: {
        tableHeader: ['xs'],
        table: [{ name: '出盘拉' }]
      },
      options: [{
        value: 2,
        label: '领顶锁眼线出盘双拉'
      }, {
        value: 7,
        label: '袖尾锁眼线出盘拉',
      }, {
        value: 12,
        label: '后领锁眼线出盘拉',
      }, {
        value: 12,
        label: '前夹至袖底骨上',
      }, {
        value: 12,
        label: '后夹至袖底骨上',
      }, {
        value: 12,
        label: '不连脚出盘拉',
      }, {
        value: 12,
        label: '袖夹底不连脚上',
      }, {
        value: 12,
        label: '前脚上',
      },
      ],
      optionsSize: [
        // { value: '全选', label: '全选' },
        { value: 2, label: 'XS' },
        { value: 3, label: 'S' },
        { value: 4, label: 'M' },
        { value: 5, label: 'L' },
        { value: 6, label: 'XL' },
        { value: 7, label: 'XXL' },
        { value: 8, label: '3XL' },
        { value: 9, label: '4XL' },
      ],
      checked: false,
      sizeValue: [2, 3, 4, 5, 6, 7, 8, 9], // 选择的尺寸
      props: { multiple: true, emitPath: false, checkStrictly: true }, // 级选框配置
      templateList: [], // 模板列表
      TL: [], // 保存模板列表
      selectTemplate: '', // 筛选模板
      front: [{ name: '前夹至袖底骨上' }, { name: '前脚上' }, { name: '前脚侧幅上' }, { name: '前夹至袖底骨上' }, { name: '前脚侧幅上' }, { name: '前夹不连脚上' }],
      after: [{ name: '后领锁眼线出盘拉' }, { name: '后夹至袖底骨上' }, { name: '后侧骨不连脚上盘' }, { name: '后脚上X4' }, { name: '后脚上X2' }, { name: '后脚上' }],
      sleeve: [{ name: '袖尾锁眼线出盘拉' }, { name: '袖夹底不连脚上' }, { name: '袖口上X2' }, { name: '袖口上X4' }, { name: '袖脚上X2' }, { name: '袖脚上' }],
      neck: [{ name: '袖尾锁眼线出盘拉' }, { name: '袖夹底不连脚上' }, { name: '袖口上X2' }, { name: '后脚上X4' }, { name: '后脚上X2' }],
      other: [{ name: '出盘拉' }, { name: '出盘双拉' }, { name: '不连脚出盘拉' }, { name: '后脚上X4' }]
    };
  },
  mounted() {
    console.log(this.value, '创建前');
    if (this.value.table) {
      this.optionsSize = [];
      this.value.tableHeader.forEach((item, index) => {
        this.optionsSize.push({ value: index, label: item });
      });
    }
    const list = [];
    this.optionsSize.filter((item) => list.push(item.label));
    this.tableItem.tableHeader = list;// 默认全选
    this.templateList = [{ name: '模板一', table: [{ name: '出盘拉' }, { name: '袖尾锁眼线出盘拉' }] }, { name: '南旋', table: [{ name: '前脚上' }] }];
  },
  methods: {
    // 增加工序
    addTable(e) {
      this.tableItem.table.push({ name: e });
    },
    // 增加尺寸
    addTableHeader(e) {
      this.tableItem.tableHeader.push(e);
    },
    // 删除工序
    delTable(val) {
      if (this.tableItem.table.length == 1) {
        this.$message({
          message: '至少保留一条数据',
          type: 'warning'
        });
        return;
      }
      this.tableItem.table.splice(val, 1);
    },
    // 筛选模板
    template() {
      this.templateList = this.TL.filter((item) => item.name.includes(this.selectTemplate));
    },
    // 全选
    AllSelect(e) {
      console.log(e);
      const list = [];
      const defaultlist = [];
      if (!e) {
        this.sizeValue = [];
        this.tableItem.tableHeader = [];
        return;
      }
      this.optionsSize.forEach((item) => {
        list.push(item.value);
        defaultlist.push(item.label);
      });
      this.sizeValue = list;
      this.tableItem.tableHeader = defaultlist;
    },
    commandTemplate(e) {
      // this.AllSelect = false;// 模板没有全部
      console.log(e);
      this.selectTemplate = e.name;
      this.tableItem.table = e.table;
      // this.tableItem.tableHeader = e.tableHeader;
      // const list = [];
      // this.optionsSize.forEach((item) => {
      //   e.table.forEach((item1) => {
      //     if (item.label == item1) {
      //       list.push(item.value);
      //     }
      //   });
      // });
      // this.sizeValue = list;
    },
    // 选择尺寸
    changeSize(e) {
      console.log(e[0]);
      const list = [];
      // if (e[0] == '全选') {
      //   this.optionsSize.filter((i) => list.push(i.label));
      //   console.log(list.splice(0, 1));
      //   this.tableItem.tableHeader = list;
      //   return;
      // }
      this.optionsSize.forEach((item) => {
        e.forEach((ite) => {
          if (ite == item.value) {
            list.push(item.label);
          }
        });
      });
      this.tableItem.tableHeader = list;
    },
    // 初始化
    open(itm) {
      console.log(itm, '初始化表格');
      if (itm.table) {
        this.tableItem.table = itm.table;
        this.tableItem.tableHeader = itm.tableHeader;
        const openD = [];
        itm.tableHeader.forEach((item) => {
          this.optionsSize.forEach((item1) => {
            if (item == item1.label) {
              openD.push(item1.value);
            }
          });
        });
        this.sizeValue = openD;
      }
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
    // 确定
    commit() {
      console.log(this.tableItem, '执行了提交');
      this.$emit('input', {
        ...this.value,
        ...this.tableItem,
        tableShow: true
      });
    },
    // 双击
    dbdrag() {

    },
    // 拖拽元素
    dragstartEvent(e, i) {
      e.dataTransfer.setData('start', i);
    },
    // 元素经过某元素位置时，执行事件
    dragoverEvent(e,) {
      e.preventDefault();
    },
    // 放开元素时执行
    dragdropEvent(e, i) {
      const startIndex = e.dataTransfer.getData('start');
      if (startIndex || startIndex == 0) {
        // 记录被拖动元素内容
        const startVal = this.tableItem.table[startIndex];
        // 删除被拖动位置元素
        this.tableItem.table.splice(startIndex, 1);
        // 将被拖动元素插入数组指定位置
        this.tableItem.table.splice(i, 0, startVal);
        // 清除记录数据
        e.dataTransfer.clearData();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.myProudct{
  :deep(){
    .el-button{
      padding: 10px;
      margin: 5px;
      width: 165px;
      text-align: left;
    }
  }
  .scrollbar{
      overflow: auto;
    &::-webkit-scrollbar{
      width: 0px;
      height: 0px;
    }
    &:hover::-webkit-scrollbar{
      position: relative;
      width: 3px;
      height: 7px;
    }
  }
  .leftB{
    border: 1px solid #bbb;
    margin-top: -1px;
    margin-left: -1px;
  }
  .border{
    border: 1px solid #bbb;
    border-radius: 4px;
    height: 224px;
  }
  .proudct{
    border-bottom:1px solid #bbb;
    padding: 10px;
    // width: 100%;
  }
  .p:hover {
    background-color: #bbb;
  }
}
.eidtTable{
  position: relative;
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
      .del-btn{
    background: #ff5656;
    color: #fff;
    padding:3px;
    border-radius: 50%;
    margin-left: 5px;
    font-size: 10px !important;
    position: absolute;
    left:75%;
    // top:0;
    bottom: 70%;
    z-index: 8;
    width:15px;
    height:15px;
    line-height: 15px;
    text-align: center;
  }
    }
</style>
