import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const formRelation: StdFormRelation<any> = {
  id: 'HOL_INFRASYS_ITEMLST',
  table: {
    tableName: 'HOL_INFRASYS_ITEMLST',
    columns: [
      {
        field: 'LSTSEQ',
        type: ColumnType.NUMBER,
        notNull: true,
        key: KeyType.PRIMARY
      },
      {
        field: 'MATCLASS',
        type: ColumnType.NUMBER,
        notNull: true
      },
      {
        field: 'ITEMTYPE',
        description: '物品类别'
      },
      {
        field: 'ITEMNO',
        description: '编号'
      },
      {
        field: 'ITEMNAME',
        description: '中文名称'
      },
      {
        field: 'ITEMENAME',
        description: '英文名'
      },
      {
        field: 'ITEMSNAME',
        description: '简称'
      },
      {
        field: 'SKU',
        description: '条码'
      },
      {
        field: 'RMK',
        description: '备注'
      },
      {
        field: 'RMK2',
        description: '制作流程'
      },
      {
        field: 'RMK3',
        description: '服务流程'
      },
      {
        field: 'COSTPRC',
        type: ColumnType.NUMBER,
        description: '成本价'
      },
      {
        field: 'COSTRATE',
        type: ColumnType.NUMBER,
        description: '成本率'
      },
      {
        field: 'COSTDATE',
        type: ColumnType.DATE,
        description: '成本计算时间'
      },
      {
        field: 'TAXPRC',
        type: ColumnType.NUMBER,
        description: '每份含税单价'
      },
      {
        field: 'TAX',
        type: ColumnType.NUMBER,
        description: '税率%'
      },
      {
        field: 'UNIT',
        description: '计量单位'
      },
      {
        field: 'UNIT2',
        description: '配方单位'
      },
      {
        field: 'DEPT',
        description: 'DEPT'
      },
      {
        field: 'PROTYPE10',
        description: '直接销售物品'
      },
      {
        field: 'PROTYPE11',
        description: '配方数量'
      },
      {
        field: 'PROTYPE12',
        description: '是否包含反向计算'
      },
      {
        field: 'PROTYPE13',
        description: '系数'
      },
      {
        field: 'IMGSEQ',
        description: '图片'
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
      table: 'HOL_INFRASYS_ITEMLSTBOM',
      primaryKey: 'BOMSEQ',
      foreignKey: 'LSTSEQ'
    }
  ]
}
