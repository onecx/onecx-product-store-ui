import { Component, EventEmitter, Input, Output } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { SlotsAPIService } from 'src/app/shared/generated'
import { SlotData } from '../slot-search/slot-search.component'

@Component({
  selector: 'app-slot-delete',
  standalone: true,
  imports: [ButtonModule, DialogModule, TooltipModule, TranslateModule],
  templateUrl: './slot-delete.component.html',
  styleUrls: ['./slot-delete.component.scss']
})
export class SlotDeleteComponent {
  @Input() slot: SlotData | undefined
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
