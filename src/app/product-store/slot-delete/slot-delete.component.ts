import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core'
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
  styleUrls: ['./slot-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlotDeleteComponent {
  private readonly slotApi = inject(SlotsAPIService)
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)

  public readonly slot = input<SlotData>()
  public readonly displayDialog = input(false)
  public readonly slotDeleted = output<boolean>()

  public onDialogHide(): void {
    this.slotDeleted.emit(false)
  }

  public onConfirmDeletion(): void {
    const id = this.slot()?.id
    if (id) {
      this.slotApi.deleteSlot({ id }).subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.SLOT.OK' })
          this.slotDeleted.emit(true)
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.SLOT.NOK' })
      })
    }
  }
}
