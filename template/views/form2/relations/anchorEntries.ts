import {ColumnType, KeyType, StdFormRelation} from '@/nameson/components/StdForm/types/stdForm'

export const anchorEntriesRelation: StdFormRelation<any> = {
    id: 'TMPLDTL',
    table: {
        tableName: 'TMPLDTL',
        columns: [
            {
                field: 'TMPLTY',
                notNull: true,
                key: KeyType.FOREIGN,
                description:'达人分组类型'
            }, {
                field: 'TMPLNO',
                notNull: true,
                key: KeyType.FOREIGN,
                description:'达人分组编码'
            },
            {
                field: 'DTLNO',
                notNull: true,
                key: KeyType.PRIMARY,
                description:'达人ID'
            },
            {
                field: 'SORTBY',
                notNull: true,
                type: ColumnType.NUMBER,
                description: '序号'
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
                description: '更新人'
            },
            {
                field: 'UPDDTTM',
                notNull: true,
                type: ColumnType.DATE,
                description: '更新日期'
            }
        ]
    }
}
