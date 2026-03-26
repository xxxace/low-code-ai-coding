import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const formRelation: StdFormRelation<any> = {
  id: 'EXREQ',
  table: {
    tableName: 'EXREQ',
    columns: [
      {
        field: 'REQSEQ',
        type: ColumnType.NUMBER,
        notNull: true,
        key: KeyType.PRIMARY
      },
      {
        field: 'REQNO',
        description: '单号',
        notNull: true
      },
      {
        field: 'REQDATE',
        type: ColumnType.DATE,
        description: '单据日期'
      },
      {
        field: 'REQSTAFF',
        description: '申请人'
      },
      {
        field: 'FTYNO',
        description: '工厂编码'
      },
      {
        field: 'DEPTNO',
        description: '部门编码'
      },
      {
        field: 'JOBNO',
        description: '职位编码'
      },
      {
        field: 'RMK',
        description: '停工原因'
      },
      {
        field: 'STFG',
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
  },
  relations: [
    {
      table: 'EXREQLST',
      primaryKey: 'LSTSEQ',
      foreignKey: 'REQSEQ'
    }
  ]
}
