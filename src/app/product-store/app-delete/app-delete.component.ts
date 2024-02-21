import { Component, EventEmitter, Input, Output } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { AppAbstract } from '../app-search/app-search.component'
import { MicrofrontendsAPIService, MicroservicesAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-app-delete',
  templateUrl: './app-delete.component.html'
})
export class AppDeleteComponent {
  @Input() appAbstract: AppAbstract | undefined
  @Input() displayDialog = false
  @Output() appDeleted = new EventEmitter<boolean>()

  constructor(
    private msApi: MicroservicesAPIService,
    private mfeApi: MicrofrontendsAPIService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {}

  public onDialogHide(): void {
    this.appDeleted.emit(false)
  }

  public onConfirmDeletion(): void {
    if (this.appAbstract?.id) {
      if (this.appAbstract?.appType === 'MFE')
        this.mfeApi.deleteMicrofrontend({ id: this.appAbstract?.id }).subscribe({
          next: () => {
            this.msgService.success({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
            this.appDeleted.emit(true)
          },
          error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
        })
      if (this.appAbstract?.appType === 'MS')
        this.msApi.deleteMicroservice({ id: this.appAbstract?.id }).subscribe({
          next: () => {
            this.msgService.success({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
            this.appDeleted.emit(true)
          },
          error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
        })
    }
  }
}
