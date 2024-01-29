import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
//import { DatePipe } from '@angular/common'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { finalize } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { Action, ConfigurationService, MicroFrontend, PortalMessageService } from '@onecx/portal-integration-angular'
import { MicrofrontendsAPIService, GetMicrofrontendRequestParams, MicrofrontendAbstract } from 'src/app/generated'

type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT'
interface AppDetailForm {
  appId: FormControl<string | null>
}

@Component({
  selector: 'app-app-detail',
  templateUrl: './app-detail.component.html',
  styleUrls: ['./app-detail.component.scss'],
  providers: [ConfigurationService]
})
export class AppDetailComponent implements OnChanges {
  @Input() appAbstract: MicrofrontendAbstract | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDetailDialog = false
  @Output() public displayDetailDialogChange = new EventEmitter<boolean>()

  public app: MicroFrontend | undefined
  public formGroup: FormGroup
  public loading = false
  public actions: Action[] = []

  constructor(
    private appApi: MicrofrontendsAPIService,
    private config: ConfigurationService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.dateFormat = this.config.lang === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
    this.formGroup = new FormGroup<AppDetailForm>({
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)])
    })
  }

  ngOnChanges() {
    if (this.changeMode !== 'CREATE') {
      this.loadApp()
      this.changeMode = 'EDIT'
    } else if (this.changeMode === 'CREATE') {
      this.app = undefined
    }
  }

  private loadApp() {
    this.loading = true
    this.appApi
      .searchMicrofrontends({ microfrontendSearchCriteria: { appId: this.appAbstract?.appId } })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data.stream && data.stream.length > 0) {
            this.app = data.stream[0]
            console.info('search: ', data.stream[0])
            this.getApp()
          }
        },
        error: (err: any) => {
          console.error('search: ', err)
          this.msgService.error({
            summaryKey: 'ACTIONS.SEARCH.APP.LOAD_ERROR'
            // detailKey: err.error.indexOf('was not found') > 1 ? 'SEARCH.NOT_FOUND' : err.error
          })
          this.displayDetailDialogChange.emit(false)
        }
      })
  }
  public getApp() {
    this.loading = true
    this.appApi
      .getMicrofrontend({ id: this.app?.id } as GetMicrofrontendRequestParams)
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.app = data
            console.info('get: ', data)
          }
        }
      })
  }

  public onDialogHide() {
    this.displayDetailDialogChange.emit(false)
  }
  public onSave() {
    //this.onSubmit()
    // this.displayDetailDialogChange.emit(true)
  }
}
