import type { App } from 'vue'
import { Icon } from './Icon'
import { Permission } from './Permission'
import { BaseButton } from './Button'
import AceFieldset from './AceFieldset/index.vue'
import FieldItem from './FieldItem/index.vue'
import FieldItemGroup from './FieldItemGroup/index.vue'
import EditableTable from './EditableTable/index.vue'
import YesOrNoCheckbox from './YesOrNoCheckbox/index.vue'
import RemoteSelect from './RemoteSelect/index.vue'
import BillStatusSelect from './BillStatusSelect/index.vue'

export const setupGlobCom = (app: App<Element>): void => {
  app.component('Icon', Icon)
  app.component('Permission', Permission)
  app.component('BaseButton', BaseButton)
  app.component('AceFieldset', AceFieldset)
  app.component('FieldItem', FieldItem)
  app.component('FieldItemGroup', FieldItemGroup)
  app.component('EditableTable', EditableTable)
  app.component('YesOrNoCheckbox', YesOrNoCheckbox)
  app.component('RemoteSelect', RemoteSelect)
  app.component('BillStatusSelect', BillStatusSelect)
}
