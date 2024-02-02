import { Component, EventEmitter, Input, Output } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { MicrofrontendsAPIService, MicrofrontendAbstract } from 'src/app/shared/generated'

@Component({
  selector: 'app-app-delete',
  templateUrl: './app-delete.component.html'
})
export class AppDeleteComponent {
  @Input() appAbstract: MicrofrontendAbstract | undefined
  @Input() displayDialog = false
  @Output() displayDialogChange = new EventEmitter<boolean>()

  public deleteMessage = ''

  constructor(
    private appApi: MicrofrontendsAPIService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {}

  public onDialogHide() {
    this.displayDialogChange.emit(false)
  }
  public confirmDeletion() {
    console.log('confirmDeletion')
  }
}
