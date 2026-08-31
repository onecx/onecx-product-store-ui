import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { AppAbstract } from '../app-search/app-search.component'
import { MicrofrontendsAPIService, MicroservicesAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-app-delete',
  standalone: true,
  imports: [ButtonModule, DialogModule, MessageModule, TooltipModule, TranslateModule],
  templateUrl: './app-delete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppDeleteComponent {
  private readonly msApi = inject(MicroservicesAPIService)
  private readonly mfeApi = inject(MicrofrontendsAPIService)
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)

  public readonly appAbstract = input<AppAbstract>()
  public readonly displayDialog = input(false)
  public readonly appDeleted = output<boolean>()

  public onDialogHide(): void {
    this.appDeleted.emit(false)
  }

  public onConfirmDeletion(): void {
    const appAbstract = this.appAbstract()
    if (appAbstract?.id) {
      if (appAbstract.appType === 'MFE') {
        this.mfeApi.deleteMicrofrontend({ id: appAbstract.id }).subscribe({
          next: () => {
            this.msgService.success({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
            this.appDeleted.emit(true)
          },
          error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
        })
      }
      if (appAbstract.appType === 'MS') {
        this.msApi.deleteMicroservice({ id: appAbstract.id }).subscribe({
          next: () => {
            this.msgService.success({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
            this.appDeleted.emit(true)
          },
          error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
        })
      }
    }
  }
}
