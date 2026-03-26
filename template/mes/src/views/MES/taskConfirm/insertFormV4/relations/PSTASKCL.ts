import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const PSTASKCLRelation: StdFormRelation<any> = {
  id: 'PSTASKCL',
  table: {
    tableName: 'PSTASKCL',
    columns: [
      {
        field: 'PSSEQ',
        type: ColumnType.NUMBER,
        key: KeyType.FOREIGN,
        notNull: true
      },
      {
        field: 'TSKSEQ',
        type: ColumnType.NUMBER,
        key: KeyType.FOREIGN,
        notNull: true
      },
      {
        field: 'CLSEQ',
        type: ColumnType.NUMBER,
        key: KeyType.PRIMARY,
        notNull: true
      },
      {
        field: 'SORTBY',
        type: ColumnType.NUMBER
      },
      {
        field: 'QTY',
        description: '数量',
        type: ColumnType.NUMBER
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
