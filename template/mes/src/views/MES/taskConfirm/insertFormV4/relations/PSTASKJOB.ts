import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const PSTASKJOBRelation: StdFormRelation<any> = {
  id: 'PSTASKJOB',
  table: {
    tableName: 'PSTASKJOB',
    columns: [
      {
        field: 'PSSEQ',
        type: ColumnType.NUMBER,
        notNull: true,
        key: KeyType.FOREIGN
      },
      {
        field: 'TSKSEQ',
        type: ColumnType.NUMBER,
        key: KeyType.FOREIGN,
        notNull: true
      },
      {
        field: 'JOBSEQ',
        type: ColumnType.NUMBER,
        key: KeyType.PRIMARY,
        notNull: true
      },
      {
        field: 'JOBNO',
        description: '工序编码'
      },
      {
        field: 'WCSEQ',
        type: ColumnType.NUMBER
      },
      {
        field: 'BEGDT',
        description: '開始日期',
        type: ColumnType.DATE
      },
      {
        field: 'ENDDT',
        description: '完成日期',
        type: ColumnType.DATE
      },
      {
        field: 'QTY',
        description: '插单数量',
        type: ColumnType.NUMBER
      },
      {
        field: 'UNIT',
        description: '数量单位',
        defaultValue: 'PCS'
      },
      {
        field: 'STFG',
        description: '状态',
        defaultValue: 'EX_S'
      },
      {
        field: 'STDT',
        description: '状态日期',
        type: ColumnType.DATE
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
