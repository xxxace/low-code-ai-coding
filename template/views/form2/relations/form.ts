import {ColumnType, KeyType, StdFormRelation} from '@/nameson/components/StdForm/types/stdForm'

export const formRelation: StdFormRelation<any> = {
    id: 'TMPL',
    table: {
        tableName: 'TMPL',
        columns: [{
                field: 'TSEQ',
                notNull: true,
                key: KeyType.PRIMARY
            },
            {
                field: 'TMPLNO',
                notNull: true,
                description: '分组编码'
            },
            {
                field: 'TMPLTY',
                description: '类型',
                notNull: true,
                defaultValue: 'ANCHOR_SUPERVISOR'
            },
            {
                field: 'CNAME',
                description: '分组名称',
                notNull: true
            },
            {
                field: 'REF1',
                description: '平台',
                notNull: true
            },
            {
                field: 'RMK',
                description: '备注'
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
    },
    relations: [
        {
            table: 'TMPLDTL',
            primaryKey: 'DTLNO',
            foreignKey: ['TMPLTY', 'TMPLNO']
        }
    ]
}
