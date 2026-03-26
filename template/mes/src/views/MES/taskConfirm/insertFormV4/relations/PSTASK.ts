import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const PSTASKRelation: StdFormRelation<any> = {
  id: 'PSTASK',
  table: {
    tableName: 'PSTASK',
    columns: [
      {
        field: 'PSSEQ',
        type: ColumnType.NUMBER,
        notNull: true,
        key: KeyType.PRIMARY
      },
      {
        field: 'TSKSEQ',
        type: ColumnType.NUMBER,
        notNull: true
      },
      {
        field: 'STYSEQ',
        description: '款式序号',
        type: ColumnType.NUMBER,
        notNull: true
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
        field: 'FTYSEQ',
        description: '工厂序号',
        type: ColumnType.NUMBER
      },
      {
        field: 'FTYTY',
        description: '工厂类型 前整 后整 缝挑厂'
      },
      {
        field: 'FTYNO',
        description: '工厂序号'
      },
      {
        field: 'RMK',
        description: '插单备注'
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
  },
  relations: [
    {
      table: 'PSTASKORD',
      primaryKey: 'LSTSEQ',
      foreignKey: ['PSSEQ', 'TSKSEQ']
    },
    {
      table: 'PSTASKJOB',
      primaryKey: 'JOBSEQ',
      foreignKey: ['PSSEQ', 'TSKSEQ']
    },
    {
      table: 'PSTASKCL',
      primaryKey: 'CLSEQ',
      foreignKey: ['PSSEQ', 'TSKSEQ']
    }
  ]
}
