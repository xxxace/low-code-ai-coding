import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const recipeRelation: StdFormRelation<any> = {
  id: 'HOL_INFRASYS_ITEMLSTBOM',
  table: {
    tableName: 'HOL_INFRASYS_ITEMLSTBOM',
    columns: [
      {
        field: 'LSTSEQ',
        type: ColumnType.NUMBER,
        notNull: true,
        key: KeyType.FOREIGN
      },
      {
        field: 'BOMSEQ',
        notNull: true,
        type: ColumnType.NUMBER,
        key: KeyType.PRIMARY
      },
      {
        field: 'SORTBY',
        notNull: true,
        type: ColumnType.NUMBER,
        description: '顺序'
      },
      {
        field: 'SC_LSTSEQ',
        description: '子配方/原料LSTSEQ',
        type: ColumnType.NUMBER
      },
      {
        field: 'ITEMNO',
        description: '配方编码'
      },
      {
        field: 'ITEMNAME',
        description: '配方名称'
      },
      {
        field: 'QTY1',
        type: ColumnType.NUMBER,
        description: '净数量'
      },
      {
        field: 'QTY2',
        type: ColumnType.NUMBER,
        description: '数量'
      },
      {
        field: 'ISCOMPUTE',
        description: '计算'
      },
      {
        field: 'UNIT',
        description: '单位'
      },
      {
        field: 'UNIT2',
        description: '库存单位'
      },
      {
        field: 'RATE',
        type: ColumnType.NUMBER,
        description: '转换率'
      },
      {
        field: 'LOSSRATE',
        type: ColumnType.NUMBER,
        description: '损耗%'
      },
      {
        field: 'DESIGNCOSTPRC',
        type: ColumnType.NUMBER,
        description: '指定成本价'
      },
      {
        field: 'DESIGNRATE',
        type: ColumnType.NUMBER,
        description: '指定比例%'
      },
      {
        field: 'COSTUNITPRC',
        type: ColumnType.NUMBER,
        description: '单价'
      },
      {
        field: 'COSTPRC',
        type: ColumnType.NUMBER,
        description: '金额'
      },
      {
        field: 'COSTDATE',
        type: ColumnType.DATE,
        description: '系统成本计算时间'
      },
      {
        field: 'RMK',
        description: '其他'
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
