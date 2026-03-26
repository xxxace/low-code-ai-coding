<template>
  <div>
    <div class="flex-cloumn">
      <!-- 操作 -->
      <div class="" style="padding:10px">
        <div class="flex">
          <div class="flex">
            <h2 class="pt10" style="line-height: 18px;">类型：</h2>
            <div class="border" style="color: black;">
              {{ selectType }}
            </div>
          </div>
          <div class="flex ml10">
            <h2 class="pt10" style="line-height: 18px;">选择文本：</h2>
            <el-select v-model="state1" filterable placeholder="请选择" @change="changeText">
              <el-option
                v-for="(item,index2) in restaurants"
                :key="item.id"
                :label="item.value"
                :value="item.value"
              >
                <div>
                  <span style="color:#bbb;margin-right:5px">{{ index2+1 }}.</span>{{ item.value }}
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="mt10 ">
          <div><h2>修改:</h2></div>
          <div class="border mt10">
            <span class="c-blue text-sm" style="margin-bottom:5px;">可下方修改文本中的【数字】</span>
            <div v-if="textArr.length" class="contentFlex ">
              <span>{{ isStar?'★':'' }}</span>
              <template v-for="(item,index) in textArr">
                <span v-if="parseFloat(item)" class="">
                  <el-input v-model="newtextArr[index]" size="mini" placeholder="请输入类型" @input="changeNuber(newtextArr[index],index)"></el-input>
                </span>
                <span v-else class="">
                  {{ item }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WriteText',
  props: {
    value: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isStar: false,
      numArr: [],
      saveNumArr: [],
      textArr: [],
      newtextArr: [],
      sizeValue: [], // 选择的尺寸
      props: { multiple: true, emitPath: false, checkStrictly: true }, // 级选框配置
      templateList: [], // 模板列表
      TL: [], // 保存模板列表
      selectTemplate: '', // 筛选模板
      state1: '', // 选择的工序描述
      selectType: '', // 类型
      tableShow: false, // 是否显示表格
      selectSize: '', // 尺寸
      pp: [], // 保存工序列表
      PPList: [], // 工序列表
      selectPP: '', // 筛选工序的值
      // 表格数据
      tableItem: {
        // tableHeader: [],
        // table: []
        // tableHeader: ['XXS', 'XS', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        // table: [{ name: '出盘拉' }, { name: '袖尾锁眼线出盘拉' }, { name: '领顶锁眼线出盘双拉' }]
      },
      restaurants: [],
      // 类型
      optionsType: [
        { value: '1', label: '应用设备' },
        { value: '2', label: '烟纸落法' },
        { value: '3', label: '缝线用法' },
        { value: '4', label: '锁眼' },
        { value: '5', label: '納膊' },
        { value: '6', label: '齊碼衫腳、袖咀上' },
        { value: '7', label: '上袖、埋夾' },
        { value: '8', label: '埋夾' },
        { value: '9', label: '挑撞要求' },
      ],
      // 尺寸
      optionsSize: [
        { value: '1', label: 'XXS' },
        { value: '2', label: 'XS' },
        { value: '3', label: 'M' },
        { value: '4', label: 'L' },
        { value: '5', label: 'XL' },
        { value: '6', label: 'XXL' },
        { value: '7', label: 'XXXL' },
      ]
    };
  },
  mounted() {
    this.data();
  },
  methods: {
    data() {
      this.tableItem = {
        tableHeader: ['XXS', 'XS', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        table: [{ name: '出盘拉' }, { name: '袖尾锁眼线出盘拉' }, { name: '领顶锁眼线出盘双拉' }]
      };
      this.selectSize = this.tableItem.tableHeader;
      const list = [];
      this.optionsSize.filter((item) => list.push(item.value));
      this.sizeValue = list;// 默认尺寸
      this.PPList = [{ name: '出盘拉' }, { name: '袖尾锁眼线出盘拉' }, { name: '领顶锁眼线出盘双拉' }, { name: '后领锁眼线出盘拉' }];
      this.pp = this.PPList;
      this.templateList = [
        { name: '模板一', table: [{ name: '出盘拉' }, { name: '袖尾锁眼线出盘拉' }, { name: '出盘拉线' }, { name: '领顶锁眼线出盘双拉' }], tableHeader: ['XS', 'M', 'L'] },
        { name: '模板二', table: [], tableHeader: [] },
        { name: '模板三', table: [], tableHeader: [] },
        { name: '模板四', table: [], tableHeader: [] },
        { name: '模板五', table: [], tableHeader: [] }];
      this.TL = this.templateList;
    },
    // 退出弹窗
    changeVal(e) {
      console.log(e);
    },
    // 选择尺寸
    changeSize(e) {
      console.log(e, this.sizeValue);
      const list = [];
      this.optionsSize.forEach((item) => {
        e.forEach((ite) => {
          if (ite == item.value) {
            list.push(item.label);
          }
        });
      });
      this.tableItem.tableHeader = list;
    },
    // 筛选工序
    UpPPList() {
      this.PPList = this.pp.filter((item) => item.name.includes(this.selectPP));
    },
    // 选择工序
    command(val) {
      this.tableItem.table.push({ name: val });
      console.log(val);
    },
    // 筛选模板
    template() {
      this.templateList = this.TL.filter((item) => item.name.includes(this.selectTemplate));
    },
    // 选择模板
    commandTemplate(e) {
      this.selectTemplate = e.name;
      this.tableItem.table = e.table;
      this.tableItem.tableHeader = e.tableHeader;
      // this.sizeValue = e.tableHeader;
      const list = [];
      this.optionsSize.forEach((item) => {
        e.tableHeader.forEach((item1) => {
          if (item.label == item1) {
            list.push(item.value);
          }
        });
      });
      this.sizeValue = list;
    },
    // 选择文本
    changeText(e) {
      this.numArr = e.match(/\d+/g);
      this.saveNumArr = e.match(/\d+/g);
      let str = e;
      this.textArr = [e];
      const array = [];
      if (this.saveNumArr) {
        this.saveNumArr.forEach((item) => {
          const evtArr = str.substring(0, str.indexOf(item));
          array.push(evtArr);
          array.push(item);
          str = str.substring(str.indexOf(item) + item.length);
        });
        array.push(str);
        this.textArr = array;
        this.newtextArr = JSON.parse(JSON.stringify(array));
      }
    },
    // 选择类型
    changeType(e) {
      console.log(e, this.value);
      const data = this.value.left;
      this.state1 = '';
      this.textArr = [];
      data.forEach((item) => {
        if (e == item.name) {
          this.restaurants = item.list;
        } else {
          this.restaurants = [
          ];
        }
        this.state1 = this.restaurants[0].value;
        this.changeText(this.restaurants[0].value);
      });
    },
    // 修改【数字】
    changeNuber(e, val) {
      if (e) {
        this.textArr[val] = e;
      }
      console.log(this.textArr, e, val);
    },
    // 初始数据
    open(item) {
      console.log(item, 'open数据');
      this.restaurants = item.list;
      if (item.table) {
        this.tableItem = item;
      }
      this.selectType = item.name;
      this.state1 = item.content;
      this.textArr = [];
      this.selectTemplate = '';// 模板
      this.tableShow = item.tableShow; // 是否显示表格
      if (item.content) {
        this.changeText(item.content);
      }
    },
    // 删除行
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
    // 提交数据
    commit() {
      console.log(this.value, this.tableItem);
      this.$emit('input', {
        ...this.value,
        content: this.textArr.join(''),
        type: this.selectType,
        tableShow: this.tableShow,
      });
    },
    // 双击
    dbdrag() {
      // console.log(e, i);
      // this.dragstartEvent(e, i);
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
.contentFlex{
  font-size: 16px;
  flex-wrap: wrap;
  align-items: center;
  color: #000;
  .el-input{
    width:40px;
    height: 20px;
    padding:0;
    margin-top:5px;
    ::v-deep .el-input__inner{
    height: 20px;

      padding:0 5px;
    }
  }
}
.myTable{
  span{
    padding-top: 5px;
    font-size: 24px;
  }
}
.border{
    border: 1px solid #DCDFE6 ;
    border-radius: 4px;
    padding: 10px;
    color: #b0b3b9;
  }
.tableT{
  border: 1px solid #DCDFE6;
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
    left:75%;
    // top:0;
    bottom: 70%;
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
          width: 70px;
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
