import { Component, EventEmitter, Input, Output } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { Slot, SlotsAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-slot-delete',
  templateUrl: './slot-delete.component.html',
  styleUrls: ['./slot-delete.component.scss']
})
export class SlotDeleteComponent {
  @Input() slot: Slot | undefined
  @Input() displayDialog = false
  @Output() slotDeleted = new EventEmitter<boolean>()

  constructor(
    private readonly slotApi: SlotsAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
  ) {}

  public onDialogHide(): void {
    this.slotDeleted.emit(false)
  }

  public onConfirmDeletion(): void {
    if (this.slot?.id) {
      this.slotApi.deleteSlot({ id: this.slot?.id }).subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.SLOT.OK' })
          this.slotDeleted.emit(true)
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.SLOT.NOK' })
      })
    }
  }
}
