<template>
  <div>
    <div class="select-box">
      <div class=" flex-between">
        <b class="c-blue">{{ evtItem.name }}：</b>
        <div class="flex1">
          <el-switch v-model="evtItem.show" @change="change" />
        </div>
        <div>
          <el-button v-if="evtItem.table" type="primary" size="mini" plain @click="editTable(evtItem)">{{ $t('table') }}</el-button>
          <!-- <el-button size="mini" type="primary" @click="edit(evtItem)">编辑</el-button> -->
          <el-button size="mini" @click="addMark">{{ $t('addNotes') }}</el-button>
        </div>
      </div>
      <div class="mt10">
        <div class="border" @dblclick="dblclick">
          {{ searchVal }}
          <span v-if="!searchVal" style="color: #bbb;">双击编辑数据</span>
        </div>
      </div>
      <div v-for="(item,index) in evtItem.marksList" :key="index" class="flex-align-center mt10">
        <span class="mr10">{{ $t('notes') }}{{ index+1 }}:</span>
        <el-input
          v-model="item.text"
          type="textarea"
          autosize
          class="flex1"
        >
        </el-input>
        <el-button type="danger" icon="el-icon-delete" circle size="small" class="ml10" @click="delMark(index)">删除</el-button>
      </div>
    </div>
    <!-- 弹窗 -->
    <el-dialog
      :title="evtItem.name"
      :visible.sync="diaShow"
      append-to-body
    >
      <component :is="dia.diaLogId" ref="dialogCom" v-model="dia"></component>
      <span slot="footer" class="dialog-footer">
        <el-button @click="diaShow = false">取消</el-button>
        <el-button type="primary" @click="commitDialog">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import EidtTableVue from '../dragDialog/eidtTable.vue';
import WriteTextDialogvue from '../dragDialog/writetextDialog.vue';
import TableDialogVue from '../dragDialog/tableDialog.vue';

export default {
  components: {
    EidtTableVue,
    WriteTextDialogvue,
    TableDialogVue
  },
  props: {
    evt: {
      type: Object,
      default: () => {}
    },
    value: {
      type: Object,
      default: () => {}
    },
    id: {
      type: Number,
      default: 0
    },
  },
  data() {
    return {
      evtItem: [],
      searchVal: '',
      list: [],
      msg: 1,
      diaShow: false,
      title: '名称',
      dia: {}
    };
  },
  watch: {
    value: {
      handler() {
        console.log('监听编辑');
        this.searchVal = this.value.content;
      },
      deep: true,
    }
  },
  mounted() {
    console.log('');
    this.evtItem = this.value;
    this.searchVal = this.value.content;
  },
  methods: {
    change() {
      console.log(this.evtItem);
      this.$emit('input', {
        ...this.evtItem,
        content: this.searchVal
      });
    },
    updataValue() {
      console.log(this.evtItem, 'updataValue');
      this.$emit('input', {
        ...this.evtItem,
      });
    },
    // 增加备注
    addMark() {
      this.evtItem.marksList.push({
        text: ''
      });
      this.updataValue();
    },
    // 双击
    dblclick() {
      this.edit(this.evtItem);
    },
    // 编辑
    edit(e) {
      this.dia = e;
      this.dia.diaLogId = 'WriteTextDialogvue';
      this.$nextTick(() => {
        this.$refs.dialogCom.open(e);
      });
      this.diaShow = true;
    },
    delMark(idx) {
      this.evtItem.marksList.splice(idx, 1);
      this.updataValue();
    },
    // 编辑表格
    editTable() {
      this.evtItem.diaLogId = 'TableDialogVue';
      console.log(this.evtItem, '编辑D表格');
      this.dia = this.evtItem;
      this.$nextTick(() => {
        this.$refs.dialogCom.open(this.evtItem);
      });
      this.diaShow = true;
    },
    // 提交
    commitDialog() {
      this.$refs.dialogCom.commit();
      this.evtItem = this.dia;
      console.log(this.dia, '提交左侧', this.evtItem);
      if (!this.dia.table) {
        this.$emit('input', {
          ...this.dia,
        });
        this.diaShow = false;
        return;
      }
      if (this.dia.tableHeader.length == 0 || this.dia.table.length == 0) {
        this.$message.warning('尺寸/工序不能为空');
        return;
      }
      this.$emit('input', {
        ...this.dia,
      });
      this.diaShow = false;
    },
  },
};
</script>

<style lang="scss" scoped>
  .select-box{
    border-bottom:1px solid #ddd;
    padding:10px;
    .border{
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      // height: 18px;
    }
  }
</style>
