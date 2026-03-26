# Form Patterns

Detailed patterns for generating StdForm components.

## Complete Form Component Template

```vue
<template>
  <StdFormWrapper :toolbar="showToolbar">
    <div class="!min-w-[700px] relative">
      <!-- Header Fields -->
      <div class="whitespace-nowrap mt-1">
        <FieldItem :label="t('lb{FIELD}', '{字段名}')" :width="56" {required}>
          <el-input class="!w-[120px]" v-model="form.{FIELD}" {readonly}/>
        </FieldItem>
        
        <FieldItem :label="t('lb{FK_FIELD}', '{外键字段名}')" :width="56" required>
          <OptionInput
            v-model="form.{FK_FIELD}"
            v-model:labelValue="form.V_{FK_FIELD}NAME"
            :dialog-compoent="{FkDialog}"
            @change="handle{FkField}Change"
          />
        </FieldItem>
        
        <FieldItem :label="t('lb{SELECT_FIELD}', '{下拉字段名}')" :width="56">
          <RemoteSelect
            v-model="form.{SELECT_FIELD}"
            v-model:content-value="form.V_{SELECT_FIELD}NAME"
            value-key="CODE"
            label-key="CNAME"
            :data-loader="fetch{SelectField}Options"
            :params="{ args: [form.{PARENT_FIELD}] }"
            default-first
          />
        </FieldItem>
      </div>
      
      <!-- Date Range -->
      <div class="whitespace-nowrap mt-1">
        <FieldItem :label="t('lbBEGFR', '开始日期')" :width="56">
          <el-date-picker
            v-model="form.BEGFR"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="!w-[140px]"
          />
        </FieldItem>
        <FieldItem :label="t('lbENDTO', '结束日期')" :width="56">
          <el-date-picker
            v-model="form.ENDTO"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="!w-[140px]"
          />
        </FieldItem>
      </div>
      
      <!-- Detail Table -->
      <AceFieldset legend="明细" class="mt-2">
        <template #legend>
          <div class="flex gap-2 items-center">
            <span>明细</span>
            <el-button size="small" @click="handleAddDetail">添加</el-button>
          </div>
        </template>
        <{DetailTable}
          ref="detailTableRef"
          :data="detailList"
          @currentRowChange="handleDetailRowChange"
        />
      </AceFieldset>
    </div>
  </StdFormWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import StdFormWrapper from '@/components/StdForm/index.vue'
import FieldItem from '@/components/FieldItem/index.vue'
import OptionInput from '@/components/OptionInput.vue'
import RemoteSelect from '@/components/RemoteSelectV2/index.vue'
import AceFieldset from '@/components/AceFieldset/index.vue'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'
import { useRefManager, useArrayRefManager } from '@/hooks/useRefManager'
import { useSetupStdFormMeta } from '@/hooks/useSetupStdFormMeta'
import { useNsI18n } from '@/hooks/useNsI18n'
import { formRelation } from './relations/form'
import { formRules } from './validationRules'
import type { {ModuleName}VO, {Detail}VO } from './types'
import { fetch{ModuleName} } from '../api'
import {FkDialog} from '../dialogs/{fkDialog}.vue'
import {DetailTable} from '../components/{DetailTable}.vue'

// ==================== Configuration ====================
defineOptions({
  objectName: '{I18N_KEY}'
})

// ==================== Hooks ====================
const stdForm = useStdForm()
stdForm.toolbar.print = false

useSetupStdFormMeta(stdForm)
const { t, c } = useNsI18n('{I18N_KEY}')

// ==================== Data Management ====================
const [form, formManager] = useRefManager<{ModuleName}VO>(() => ({
  BLTY: '{BUSINESS_TYPE}',
  STFG: 'BL_D',
  STDT: dayjs().format('YYYY-MM-DD')
}))
formManager.setRules(formRules)

const [detailList, detailListManager] = useArrayRefManager<{Detail}VO>([])
const detailTableRef = ref()

// ==================== Relation Configuration ====================
formRelation.manager = formManager
formRelation.sqlQuery = (params) => ({
  loader: {moduleName}Loader,
  params: Object.keys(params).reduce((pre, key) => {
    pre[`A.${key}`] = params[key]
    return pre
  }, {})
})
stdForm.relationRegister.register(formRelation)

// Detail relation (if applicable)
detailRelation.manager = detailListManager
detailRelation.sqlQuery = (params) => ({
  sql: `{DETAIL_QUERY_SQL}`,
  params: { {PK}: params.{PK} }
})
stdForm.relationRegister.register(detailRelation)

// ==================== Data Loader ====================
const {moduleName}Loader = async (params) => {
  const item = await fetch{ModuleName}({ where: params })
  // Data transformation if needed
  return item
}

// ==================== Lifecycle Hooks ====================
stdForm.onInitDone(async () => {
  // Post-initialization logic
})

stdForm.onBeforeSubmit(async () => {
  // Pre-submit validation
  return true
})

stdForm.onCollectSubmitData(async (relations) => {
  // Custom data collection
  const result = await stdForm.emits.collectSubmitData(relations)
  // Additional processing
  return result
})

// ==================== Event Handlers ====================
const handle{FkField}Change = (item) => {
  // Clear dependent fields
  form.value.{DEPENDENT_FIELD} = ''
  form.value.V_{DEPENDENT_FIELD}NAME = ''
}

const handleAddDetail = () => {
  detailTableRef.value?.addRow({
    {PK}: form.value.{PK},
    SEQ: detailListManager.records.length + 1
  })
}

const handleDetailRowChange = (row) => {
  // Handle detail row selection
}
</script>
```

## Field Component Patterns

### Text Input
```vue
<FieldItem :label="t('lb{FIELD}', '{标签}')" :width="56">
  <el-input class="!w-[120px]" v-model="form.{FIELD}"/>
</FieldItem>
```

### Readonly Text
```vue
<FieldItem :label="t('lb{FIELD}', '{标签}')" :width="56">
  <el-input class="!w-[120px]" v-model="form.{FIELD}" readonly/>
</FieldItem>
```

### Required Field
```vue
<FieldItem :label="t('lb{FIELD}', '{标签}')" :width="56" required>
  <el-input class="!w-[120px]" v-model="form.{FIELD}"/>
</FieldItem>
```

### Foreign Key with Dialog
```vue
<FieldItem :label="t('lb{FK}', '{标签}')" :width="56" required>
  <OptionInput
    v-model="form.{FK}"
    v-model:labelValue="form.V_{FK}NAME"
    :dialog-compoent="{Fk}Dialog"
    :label-width="100"
    :value-width="200"
    @change="handle{Fk}Change"
  />
</FieldItem>
```

### Remote Select
```vue
<FieldItem :label="t('lb{SELECT}', '{标签}')" :width="56">
  <RemoteSelect
    v-model="form.{SELECT}"
    v-model:content-value="form.V_{SELECT}NAME"
    value-key="CODE"
    label-key="CNAME"
    :data-loader="fetch{Select}Options"
    :params="{ args: [form.{PARENT}] }"
    default-first
  />
</FieldItem>
```

### Date Picker
```vue
<FieldItem :label="t('lb{DATE}', '{标签}')" :width="56">
  <el-date-picker
    v-model="form.{DATE}"
    type="date"
    format="YYYY-MM-DD"
    value-format="YYYY-MM-DD"
    class="!w-[140px]"
  />
</FieldItem>
```

### Number Input
```vue
<FieldItem :label="t('lb{NUM}', '{标签}')" :width="56">
  <el-input-number
    v-model="form.{NUM}"
    :min="0"
    :precision="2"
    controls-position="right"
    class="!w-[120px]"
  />
</FieldItem>
```

### Yes/No Checkbox
```vue
<FieldItem :label="t('lb{FLAG}', '{标签}')" :width="56">
  <YesOrNoCheckbox v-model="form.{FLAG}"/>
</FieldItem>
```

### Uppercase Input
```vue
<FieldItem :label="t('lb{CODE}', '{标签}')" :width="56">
  <UppercaseInput v-model="form.{CODE}" class="!w-[120px]"/>
</FieldItem>
```

## Common Lifecycle Patterns

### Auto-generate Field Value
```typescript
stdForm.onInitDone(async () => {
  if (stdForm.actionType === StdFormAction.ADD) {
    form.value.{FIELD} = await generate{Field}Value()
  }
})
```

### Conditional Validation
```typescript
stdForm.onBeforeSubmit(async () => {
  if (form.value.BEGFR && form.value.ENDTO) {
    const diff = dayjs(form.value.ENDTO).diff(dayjs(form.value.BEGFR), 'day')
    if (diff < 0) {
      ElMessageBox.alert('结束日期不能早于开始日期！')
      return false
    }
  }
  return true
})
```

### Cascade Field Update
```typescript
const handle{Parent}Change = (item) => {
  // Clear child fields
  form.value.{CHILD} = ''
  form.value.V_{CHILD}NAME = ''
  
  // Set derived values
  if (item) {
    form.value.{DERIVED} = item.{PROPERTY}
  }
}
```

### Calculate Field Value
```typescript
const handle{Source}Change = () => {
  if (form.value.QTY && form.value.PRICE) {
    form.value.AMT = (form.value.QTY * form.value.PRICE).toFixed(2)
  }
}
```