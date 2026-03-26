import { useStdForm } from '../composeble/useStdForm'
import { OrderStatus } from '../types/stdForm'
import { StdFormAction } from '../types/store'

export const resetRegister = () => {
  const stdForm = useStdForm()

  stdForm.registerReset(async () => {
    stdForm.actionType = StdFormAction.RESETTING

    const { relationRegister } = stdForm

    relationRegister.relations.forEach((relation) => {
      relation.manager?.empty()
    })

    stdForm.actionType = StdFormAction.RADEONLY
    stdForm.orderStatus = OrderStatus.Idle
  })
}
