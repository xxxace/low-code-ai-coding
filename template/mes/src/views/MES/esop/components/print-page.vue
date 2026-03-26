<template>
    <div id="myViewport" style="width: 100%; height: 100%">
        <div id="myContent" :style="{ zoom: `${scaleVal}` }" name="myContent">
            <!-- 操作 -->
            <!-- <div class="btnList no-print">
        <el-button class="flex1" type="primary" icon="el-icon-copy-document" @click="copy(id)">{{ $t('copy') }}</el-button>
        <el-button class="flex1" type="warning" icon="el-icon-delete" @click="delect(id)">{{ $t('delete') }}</el-button>
        <el-button class="flex1" type="success" icon="el-icon-printer" @click="print">{{ $t('print') }}</el-button>
      </div> -->
            <!-- 显示页 -->
            <div ref="printPage" class="flex-column print-content" @click="seleIndex(id)">
                <div style="" class="no-print c-red pageTop">
                    <!-- <h2>{{ id + 1 }}/{{ allPage }}页</h2> -->
                </div>
                <!-- 头 -->
                <div class="flex">
                    <div class="flex1 flex-column overflow box-1">
                        <span class="print-t text-overflow">{{ $t("pageLeftTitle") }}</span>
                        <div class="flex1 border mt10 flex-column" style="border-right: 0">
                            <div class="line flex">
                                <h4>{{ $t("orderNo") }}：</h4>
                                <span class="flex1">WY2308439A</span>
                            </div>
                            <div class="line flex-between">
                                <div class="flex">
                                    <h4>{{ $t("styleNumber") }}：</h4>
                                    <span>WY2308439A</span>
                                </div>
                                <div class="flex">
                                    <h4>{{ $t("needle") }}：</h4>
                                    <span class="flex1">14G</span>
                                </div>
                            </div>
                            <div class="line flex1 flex">
                                <h4>{{ $t("shape") }}：</h4>
                                <span class="flex1">{{ msg.shape }}</span>
                            </div>
                            <div class="line flex">
                                <h4>{{ $t("rawMaterial") }}：</h4>
                                <span class="flex1">{{ msg.raw }}</span>
                            </div>
                        </div>
                    </div>
                    <!-- 图片 -->
                    <div class="flex1 flex-column overflow box-1 border">
                        <h4 class="tips" style="top: 5px; left: 5px">{{ $t("diagram") }}</h4>
                        <h4 class="tips" style="bottom: 5px; left: 5px">{{ msg.dia }}</h4>
                        <el-upload
                            class="avatar-uploader"
                            action="https://jsonplaceholder.typicode.com/posts/"
                            :show-file-list="false"
                            :on-success="handleAvatarSuccess"
                            :before-upload="beforeAvatarUpload"
                        >
                            <img
                                v-if="imageUrl"
                                :src="imageUrl"
                                class="avatar"
                                style="width: 99%; height: 190px"
                            />
                            <el-image
                                v-else
                                style="width: 99%; height: 190px"
                                fit="contain"
                                :src="'https://img0.baidu.com/it/u=3342535577,218413182&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500'"
                            ></el-image>
                        </el-upload>
                        <!-- <el-image style="width: 100%; height: 200px" fit="contain" :src="'https://img0.baidu.com/it/u=3342535577,218413182&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500'"></el-image> -->
                    </div>
                </div>
                <!-- 左侧文本 -->
                <div class="flex1 flex mt10 border overflow" style="border-bottom: 0">
                    <div class="dragBox flex-column" style="padding: 10px 0">
                        <h4 class="text-center" style="padding-bottom: 5px">
                            A:{{ $t("seamRequirements") }}
                        </h4>
                        <div
                            v-for="(item, index) in listValue.left"
                            :key="index"
                            class="dragSBox"
                            @click="postion(0, item.name)"
                            @eidtTable="eidtTable"
                        >
                            <component :is="item.comId" :evt-item="item" :index="index"></component>
                        </div>
                    </div>
                    <!-- 右侧拖拽 -->
                    <div
                        class="dragBox flex-column"
                        style="border-left: 1px solid #9b9b9b; padding: 10px 0"
                    >
                        <h4 class="text-center" style="padding-bottom: 5px">
                            B:{{ $t("challengingRequirements") }}
                        </h4>
                        <el-empty
                            v-if="listValue.list3.length == 0"
                            description="左側添加组件"
                        ></el-empty>
                        <div v-for="(item, index) in listValue.list3" :key="index">
                            <component :is="item.comId" :evt-item="item"></component>
                        </div>
                    </div>
                </div>
                <!-- 底部 -->
                <div class="print-footer">
                    <div class="flex footer-table">
                        <div class="f-tb-t">{{ $t("specialAttention") }}</div>
                        <div class="flex1 flex-column">
                            <div
                                v-for="(item, index) in listValue.bottom"
                                :key="index"
                                class="line text-overflow"
                            >
                                {{ item }}
                            </div>
                        </div>
                    </div>
                    <div class="flex-between">
                        <div class="">{{ $t("approved") }}：</div>
                        <div class="">{{ $t("scareMaster") }}：周（6255）</div>
                        <div class="">{{ $t("seamMaster") }}：燕（6962）</div>
                        <div class="">{{ $t("date") }}：{{ evtDate }}</div>
                    </div>
                </div>
                <!-- 弹窗 -->
                <el-dialog
                    :title="dialog.title"
                    :visible.sync="dialog.show"
                    :before-close="handleClose"
                    append-to-body
                >
                    <component
                        :is="dialog.evt.diaLogId"
                        ref="dialogCom"
                        v-model="dialog.evt"
                    ></component>
                    <span slot="footer" class="dialog-footer">
                        <el-button @click="dialog.show = false">{{ msg.qx }}</el-button>
                        <el-button type="primary" @click="commitDialog">{{ msg.qd }}</el-button>
                    </span>
                </el-dialog>
            </div>
        </div>
    </div>
</template>

<script>
import draggable from "vuedraggable";
// 组件模块
// import { translateArr } from '@/lang/translate';
import TextVue from "./leftPlanA/text.vue";
import TextBVue from "./rightPlanB/text.vue";
import TableVue from "./rightPlanB/table.vue";
// 窗口模块
import TextDialogVue from "./dragDialog/textDialog.vue";
import TableDialogVue from "./dragDialog/tableDialog.vue";
import WriteTextDialogvue from "./dragDialog/writetextDialog.vue";
import EidtTableVue from "./dragDialog/eidtTable.vue";
import EiTableVue from "./dragDialog/Table.vue";

export default {
    components: {
        draggable,
        TableVue,
        TextVue,
        TextBVue,
        TableDialogVue,
        EidtTableVue,
        WriteTextDialogvue,
        EiTableVue,
        TextDialogVue,
    },
    props: {
        value: {
            type: Object,
            default: () => {},
        },
        id: {
            type: Number,
            default: 0,
        },
        allPage: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            evtDate: "",
            imageUrl: "", // 图片
            scaleVal: 0.66,
            msg: {
                shape: "男裝企領后博收花彎夾長袖開胸",
                raw: "2/30NM 100%積極西美弱羊毛",
                dia: "2023/3/24 修改前中對埋尺寸",
                qx: "取 消",
                qd: "确 定",
            },
            dialog: {
                show: false,
                title: "",
                evt: {},
            },
            listValue:{}
        };
    },
    computed: {
        showList() {
            const left = this.value.left.filter((item) => item.show);
            const { right } = this.value;
            return {
                left,
                right,
            };
        },
    },
    watch: {
        value: {
            handler() {
                this.listValue = this.value;
                console.log("监听");
            },
            deep: true,
        }
    },
    mounted() {
        this.evtDate = new Date().Format("yyyy/MM/dd");
        this.listValue = this.value;
    },
    updated() {
        this.listValue = this.value;
        console.log(this.listValue, "页面更新");
    },
    methods: {
        // 右侧
        changeItem(evt) {
            const { added } = evt;
            console.log(evt);
            if (added) {
                const { element } = added;
                this.edit(element);
            }
        },
        // 左侧
        changeItemLeft(evt) {
            const { added } = evt;
            console.log(evt, "左");
            if (added) {
                const { element } = added;
                this.editleft(element);
            }
        },
        add(evt) {
            console.log("add", evt);
        },
        end(evt, list) {
            console.log("end", evt, list);
        },
        // 删除右侧
        del(itm) {
            this.listValue.list3.forEach((item, index) => {
                if (item.id == itm.id) {
                    this.listValue.list3.splice(index, 1);
                }
            });
        },
        // 删除左侧
        delleft(itm) {
            this.listValue.listleft.forEach((item, index) => {
                if (item.id == itm.id) {
                    this.listValue.listleft.splice(index, 1);
                }
            });
        },
        // 编辑右侧
        edit(itm) {
            console.log(itm, "编辑", this.listValue.list3);
            this.dialog.evt = itm;
            this.dialog.title = itm.name;
            this.dialog.show = true;
            this.$nextTick(() => {
                this.$refs.dialogCom.open(itm);
            });
        },
        // 编辑左侧
        editleft(itm) {
            console.log(itm, "编辑", this.listValue.listleft);
            this.dialog.evt = itm;
            this.dialog.title = itm.name;
            this.dialog.show = true;
            this.$nextTick(() => {
                this.$refs.dialogCom.open(itm);
            });
        },
        // 退出弹窗
        handleClose(done) {
            this.$confirm("确认关闭？")
                .then((_) => {
                    done();
                })
                .catch((_) => {});
        },
        // 提交数据
        commitDialog() {
            this.$refs.dialogCom.commit();
            console.log(this.listValue, "提交", this.dialog);
            if (this.dialog.evt.tableShow) {
                if (this.dialog.evt.tableHeader.length == 0) {
                    this.$message.warning("尺寸为空");
                    return;
                }
            }
            const { evt } = this.dialog;
            const sList = this.value;
            sList.left.forEach((item, index) => {
                if (item.name == evt.name) {
                    sList.left[index] = evt;
                    console.log(sList);
                    this.$emit("input", sList);
                }
            });
            this.listValue.list3.forEach((item, index) => {
                if (item.id == evt.id) {
                    this.listValue.list3[index] = evt;
                }
            });
            this.dialog.show = false;
            // }
        },
        seleIndex(id) {
            this.$emit("seleIndex", id);
        },
        // 编辑表格
        eidtTable(e) {
            console.log(e, "biaog");
        },
        // 打印
        print() {
            console.log("打印");
            this.$refs.printPage.style.border = "";
            this.$print(this.$refs.printPage);
            this.$refs.printPage.style.border = "2px solid #66b1ff";
        },
        copy(id) {
            this.$emit("copy", id);
        },
        delect(id) {
            this.$emit("delect", id);
        },
        handleAvatarSuccess(res, file) {
            this.imageUrl = URL.createObjectURL(file.raw);
        },
        // 上传图片
        beforeAvatarUpload(file) {
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                this.$message.error("上传头像图片大小不能超过 2MB!");
            }
            return isLt2M;
        },
        postion(pageIdx, name) {
            const contentHeight = document.querySelector(".el-tabs__content").offsetHeight;
            console.log(contentHeight, "gaodu", pageIdx, name);
            const pageNameList = ["pane-first", "pane-second", "pane-third"];
            const tabList = ["tab-first", "tab-second", "tad-third"];
            const evtPane = document.getElementById(pageNameList[pageIdx]);
            console.log(tabList[pageIdx]);
            document.getElementById(tabList[pageIdx]).click();
            setTimeout(() => {
                evtPane.querySelectorAll(".select-box").forEach((item, index) => {
                    if (item.querySelector(".c-blue").innerText == `${name}：`) {
                        document.querySelector(".el-tabs__content").scrollTop =
                            item.offsetHeight * (index + 2) - contentHeight;
                        item.style.background = "#e8f3ff";
                        setTimeout(() => {
                            item.style.background = "#fff";
                        }, 500);
                    }
                });
            }, 100);
        },
    },
};
</script>

<style lang="scss" scoped>
.print-content {
    justify-content: space-between;
    height: 100%;
    padding: 25px;
    box-sizing: border-box;
}

.print-t {
    font-size: 28px;
    font-weight: bold;
    text-align: center;
}
.border {
    border: 1px solid #9b9b9b;
}
.box-1 {
    height: 200px;
    position: relative;
    box-sizing: border-box;
    .tips {
        position: absolute;
        z-index: 2;
    }
    .line {
        padding: 5px;
        border-bottom: 1px solid #9b9b9b;

        &:last-child {
            border-bottom: 0;
        }
    }
}
.dragSBox {
    position: relative;
    .el-button-group {
        position: absolute;
        z-index: 2;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: none;
    }
    &:hover {
        background: rgba(0, 0, 0, 0.1);
        .el-button-group {
            display: block;
        }
    }
}
.dragBox {
    position: relative;
    width: 50%;
    .el-empty {
        position: absolute;
        z-index: 1;
        width: 100%;
    }
}
.dragArea {
    flex: 1;
    position: relative;
    z-index: 2;
}

.footer-table {
    border: 1px solid #9b9b9b;
    padding-bottom: 10px;

    .f-tb-t {
        border-right: 1px solid #9b9b9b;
        writing-mode: tb-rl;
        display: flex;
        padding: 0 20px;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
    }
    .line {
        border-bottom: 1px solid #9b9b9b;
        padding: 4px 5px;
        height: 25px;
        box-sizing: border-box;
        width: 100%;
        &:last-child {
            border-bottom: 0;
        }
    }
}
#myViewport {
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    // overflow-y: scroll;
}

#myContent {
    background: #fff;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    height: 297mm;
    width: 210mm;
    box-sizing: border-box;
    position: relative;
    .pageTop {
        position: absolute;
        bottom: 97.5%;
        left: 50%;
    }
    .btnList {
        position: absolute;
        left: 100%;
        el-button {
            font-weight: 700;
        }
        :deep() {
            .el-button {
                margin: 0;
                width: 60px;
                padding: 12px 3px;
            }
        }
    }
}
</style>
