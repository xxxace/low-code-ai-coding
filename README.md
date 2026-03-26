/tempalte: 是用于放置各种模板示例代码的,并不是全部代码，所以可能出现一些找不到的文件夹和工具函数
/aiSpace： 是提供给用户或Agent生成或管理知识、记忆、总结、skill等一系列的ai援助,agent也可以自己创建新的文件夹服务自己，另外注意不管做什么你都需要生成文档或者记录

agent也可以在此文件更新内容

---

## AI知识库结构

```
aiSpace/
├── knowledgeBase/                    # 知识库
│   ├── StdForm核心架构.md           # StdForm组件架构详解
│   ├── 核心组件使用指南.md          # 各组件使用方法
│   ├── API封装模式.md               # API层设计模式
│   └── 表单开发最佳实践.md          # 开发规范和模板
├── skills/                           # Skills
│   ├── Skill开发建议.md             # 建议创建的Skills
│   └── std-form-generator/          # StdForm代码生成器
│       ├── SKILL.md                 # Skill主文档
│       ├── references/              # 参考文档
│       │   ├── form-patterns.md     # 表单模式
│       │   ├── table-patterns.md    # 表格模式
│       │   └── api-patterns.md      # API模式
│       └── assets/templates/        # 代码模板
├── 编码风格总结.md                   # 项目编码规范
└── 优化建议.md                       # 代码优化建议
```

## 核心概念速查

### StdForm 关键类型
- `StdFormRelation` - 表单与数据库的映射关系
- `RefManager` - 对象类型数据管理器
- `RefManagerArray` - 数组类型数据管理器
- `OrderStatus` - 单据状态枚举

### 核心 Hooks
- `useStdForm()` - 创建表单实例
- `useRefManager()` - 创建对象数据管理
- `useArrayRefManager()` - 创建数组数据管理
- `useNsI18n()` - 国际化
- `useSetupStdFormMeta()` - 设置表单元数据

### 核心组件
- `StdFormWrapper` - 表单容器
- `FieldItem` - 字段布局
- `RemoteSelect` - 远程下拉
- `OptionInput` - 弹窗选择输入
- `EditableTable` - 可编辑表格
- `ReportTable` - 报表表格
