import { inject } from '@angular/core'

import { SlotService } from '@onecx/angular-remote-components'

export function injectInitializedSlotService(): SlotService {
  const slotService = inject(SlotService)
  slotService.init().catch((err) => console.error(err))
  return slotService
}
