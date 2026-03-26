import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const leaveListRelation: StdFormRelation<any> = {
  id: 'EXREQLST',
  table: {
    tableName: 'EXREQLST',
    columns: [
      {
        field: 'REQSEQ',
        type: ColumnType.NUMBER,
        notNull: true,
        key: KeyType.FOREIGN
      },
      {
        field: 'LSTSEQ',
        notNull: true,
        type: ColumnType.NUMBER,
        key: KeyType.PRIMARY
      },
      {
        field: 'WCSEQ',
        notNull: true,
        type: ColumnType.NUMBER,
        description: '产线序号'
      },
      {
        field: 'POSTNO',
        description: '职位编码'
      },
      {
        field: 'EMPNO',
        description: '工号'
      },
      {
        field: 'BEGDT',
        type: ColumnType.DATE,
        description: '开始日期'
      },
      {
        field: 'ENDDT',
        type: ColumnType.DATE,
        description: '结束日期'
      },
      {
        field: 'HRS',
        type: ColumnType.NUMBER,
        description: '时数'
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
