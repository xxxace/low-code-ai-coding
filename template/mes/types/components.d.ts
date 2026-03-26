declare module 'vue' {
  export interface GlobalComponents {
    Icon: (typeof import('../src/components/Icon/index'))['Icon']
    Permission: (typeof import('../src/components/Permission/index'))['Permission']
    BaseButton: (typeof import('../src/components/Button/index'))['BaseButton']
    EditableTable: (typeof import('../src/components/EditableTable/index.vue'))['default']
    FieldItem: (typeof import('../src/components/FieldItem/index.vue'))['default']
  }
}

export {}
