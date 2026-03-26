---
name: std-form-generator
description: Generate Vue 3 form modules following the StdForm architecture pattern. Use when creating new form pages, CRUD modules, or when user asks to "generate form", "create form module", "new form page", or provides table/field definitions for form generation. Outputs include: form component, types, validation rules, relation config, list page, and router config.
---

# StdForm Generator

Generate standard form modules following the project's StdForm architecture.

## Quick Start

Provide the following information to generate a complete form module:

1. **Table name** (e.g., `ORDPLN@APSDB169_ERPDB`)
2. **Module name** (e.g., `inquiryOrder`)
3. **i18n key** (e.g., `VUE_INQUIRY`)
4. **Fields** with types and constraints

### Example Request

```
Generate form module:
- Table: ORDPLN@APSDB169_ERPDB
- Module: inquiryOrder
- i18n: VUE_INQUIRY
- Primary key: PLNSEQ
- Required fields: PLNNO, CLNT, CORPNO
- Date fields: BEGFR, ENDTO
- Number fields: QTY, AMT
```

## Output Structure

```
views/{moduleName}/
├── form/
│   ├── index.vue          # Form component
│   ├── types.ts           # TypeScript types
│   ├── validationRules.ts # Validation rules
│   └── relations/
│       └── form.ts        # Relation config
├── list.vue               # List page
├── components/
│   └── {ModuleName}Table.vue
└── router/
    └── index.js           # Router config
```

## Generation Rules

### 1. Types (types.ts)

```typescript
export type {ModuleName}VO = {
  {PRIMARY_KEY}: number
  {STRING_FIELDS}: string
  {NUMBER_FIELDS}: number
  {DATE_FIELDS}: string
  // Display fields with V_ prefix
  V_{FIELD}NAME: string
}
```

### 2. Validation Rules (validationRules.ts)

```typescript
import type { Rules } from 'async-validator'

export const formRules: Rules = {
  // Required fields get validation rules
  {REQUIRED_FIELD}: [{ required: true, message: '{字段名}不能为空' }]
}
```

### 3. Relation Config (relations/form.ts)

```typescript
import { ColumnType, KeyType, StdFormRelation } from '@/components/StdForm/types/stdForm'

export const formRelation: StdFormRelation<any> = {
  id: '{tableName}',
  table: {
    tableName: '{tableName}',
    columns: [
      { field: '{PK}', type: ColumnType.NUMBER, key: KeyType.PRIMARY },
      // ... other columns
    ]
  }
}
```

### 4. Form Component (form/index.vue)

Key elements:
- `defineOptions({ objectName: '{i18nKey}' })`
- `useStdForm()` for form instance
- `useRefManager()` for data management
- `useSetupStdFormMeta()` for permissions
- `useNsI18n()` for internationalization

### 5. List Page (list.vue)

Key elements:
- `useParamsRefManager()` for query params
- `useArrayRefManager()` for data list
- `AceFieldset` for grouping
- Table component for display

## Field Type Mapping

| SQL Type | TypeScript | ColumnType |
|----------|------------|------------|
| NUMBER, INT, DECIMAL | number | ColumnType.NUMBER |
| DATE, DATETIME | string | ColumnType.DATE |
| VARCHAR, CHAR, TEXT | string | - |

## Component Selection

| Field Type | Component |
|------------|-----------|
| Foreign key | `OptionInput` with dialog |
| Code/Select | `RemoteSelect` |
| Date | `el-date-picker` |
| Number | `el-input-number` |
| Text | `el-input` |
| Yes/No | `YesOrNoCheckbox` |
| Uppercase | `UppercaseInput` |

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Module folder | camelCase | `inquiryOrder` |
| Component file | PascalCase | `InquiryOrderTable.vue` |
| Type | PascalCase + VO | `InquiryOrderVO` |
| Function | camelCase + prefix | `fetchInquiryOrderList` |
| Event handler | handle + Action | `handleCLNTChange` |

## References

For detailed patterns and examples:
- **Form patterns**: See [references/form-patterns.md](references/form-patterns.md)
- **Table patterns**: See [references/table-patterns.md](references/table-patterns.md)
- **API patterns**: See [references/api-patterns.md](references/api-patterns.md)

## Assets

Code templates are available in `assets/templates/`:
- `form.vue.template` - Form component template
- `list.vue.template` - List page template
- `types.ts.template` - Type definition template
- `relations.ts.template` - Relation config template