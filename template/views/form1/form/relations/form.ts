import {ColumnType, KeyType, StdFormRelation} from '@/components/StdForm/types/stdForm'

export const formRelation: StdFormRelation<any> = {
    id: 'ORDPLN@APSDB169_ERPDB',
    table: {
        tableName: 'ORDPLN@APSDB169_ERPDB',
        columns: [
            {
                field: 'PLNSEQ',
                type: ColumnType.NUMBER,
                notNull: true,
                key: KeyType.PRIMARY
            },
            {
                field: 'PLNNO',
                description: '单号',
                notNull: true
            },
            {
                field: 'PLNMTH',
                type: ColumnType.NUMBER,
                description: '年月'
            },
            {
                field: 'BLTY',
                description: '单类',
                notNull: true,
                defaultValue: 'IQYORD'
            },
            {
                field: 'CORPNO',
                description: '公司'
            },
            {
                field: 'CLNT',
                description: '客户'
            },
            {
                field: 'JOBNO',
                description: '工序'
            },
            {
                field: 'CLNTSTYNO',
                description: '客款号'
            },
            {
                field: 'STYNO',
                description: '款号'
            },
            {
                field: 'WKHRS',
                type: ColumnType.NUMBER,
                description: '织工'
            },
            {
                field: 'WKHRS_FP',
                type: ColumnType.NUMBER,
                description: '缝工'
            },
            {
                field: 'WKHRS_TZ',
                type: ColumnType.NUMBER,
                description: '挑工'
            },
            {
                field: 'REPLYDT',
                type: ColumnType.DATE,
                description: '复单期限'
            },
            {
                field: 'BEGFR',
                type: ColumnType.DATE,
                description: '预计开机'
            },
            {
                field: 'ENDTO',
                type: ColumnType.DATE,
                description: '预计货期'
            },
            {
                field: 'EQMCAT',
                description: '针种'
            },
            {
                field: 'EQMMODEL',
                description: '电脑机'
            },
            {
                field: 'FTYNO',
                description: '工厂'
            },
            {
                field: 'QTY',
                type: ColumnType.NUMBER,
                description: '数量'
            },
            {
                field: 'STAFF',
                description: '营业'
            },
            {
                field: 'TEAM',
                description: '队伍'
            },
            {
                field: 'RMK',
                description: '备注'
            },
            {
                field: 'ISLOCK',
                description: '是否锁单'
            },
            {
                field: 'EXSTFG',
                description: '排产状态'
            },
            {
                field: 'STFG',
                notNull: true,
                description: '状态'
            },
            {
                field: 'STDT',
                notNull: true,
                type: ColumnType.DATE,
                description: '状态日期'
            },
            {
                field: 'STREASON',
                description: '状态原因'
            },
            {
                field: 'ADDUSER',
                notNull: true,
                description: '创建人'
            },
            {
                field: 'ADDDTTM',
                notNull: true,
                type: ColumnType.DATE,
                description: '创建日期'
            },
            {
                field: 'UPDUSER',
                notNull: true,
                description: '修改人'
            },
            {
                field: 'UPDDTTM',
                notNull: true,
                type: ColumnType.DATE,
                description: '修改时间'
            }
        ]
    }
}
