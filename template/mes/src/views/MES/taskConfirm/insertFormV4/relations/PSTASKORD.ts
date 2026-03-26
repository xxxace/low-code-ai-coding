import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const PSTASKORDRelation: StdFormRelation<any> = {
  id: 'PSTASKORD',
  table: {
    tableName: 'PSTASKORD',
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
        field: 'LSTSEQ',
        type: ColumnType.NUMBER,
        key: KeyType.PRIMARY,
        defaultValue: 1
      },
      {
        field: 'ORDTY',
        description: '单据类型 预单：PLORD 旬单：IQYORD 生产单：MO 合约：PM',
        defaultValue: 'PM'
      },
      {
        field: 'BILLID',
        description: '單號ID 存PM.PMSEQ'
      },
      {
        field: 'BILLNO',
        description: '單號 存PM.PMNO'
      },
      {
        field: 'PMSEQ',
        description: '存PM.PMSEQ',
        type: ColumnType.NUMBER
      },
      {
        field: 'CLNTDTTO',
        description: '交货日期',
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
