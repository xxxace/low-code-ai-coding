import { register } from '@nameson/sqlutils'

register.operator('__in', { operator: 'IN', value: (key, val) => `${key} IN (${val})` })
