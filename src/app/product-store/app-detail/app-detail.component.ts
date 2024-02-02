import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
//import { DatePipe } from '@angular/common'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { finalize } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService, UserService } from '@onecx/portal-integration-angular'
import {
  CreateMicrofrontendRequest,
  GetMicrofrontendByAppIdRequestParams,
  MicrofrontendsAPIService,
  MicrofrontendAbstract,
  Microfrontend,
  UpdateMicrofrontendRequest
} from 'src/app/shared/generated'

export type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT' | 'COPY'

interface AppDetailForm {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  appVersion: FormControl<string | null>
  productName: FormControl<string | null>
  description: FormControl<string | null>
  technology: FormControl<string | null>
  remoteBaseUrl: FormControl<string | null>
  remoteEntry: FormControl<string | null>
  classifications: FormControl<string | null>
  contact?: FormControl<string | null>
  iconName?: FormControl<string | null>
  note?: FormControl<string | null>
  exposedModule?: FormControl<string | null>
}

@Component({
  selector: 'app-app-detail',
  templateUrl: './app-detail.component.html',
  styleUrls: ['./app-detail.component.scss']
})
export class AppDetailComponent implements OnChanges {
  @Input() appAbstract: MicrofrontendAbstract | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDetailDialog = false
  @Output() displayDetailDialogChange = new EventEmitter<boolean>()

  public app: Microfrontend | undefined
  public formGroup: FormGroup
  public loading = false
  public hasCreatePermission = false
  public hasEditPermission = false

  constructor(
    private user: UserService,
    private appApi: MicrofrontendsAPIService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.hasCreatePermission = this.user.hasPermission('MICROFRONTEND#CREATE')
    this.hasEditPermission = this.user.hasPermission('MICROFRONTEND#EDIT')
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'

    this.formGroup = new FormGroup<AppDetailForm>({
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appVersion: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      productName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      technology: new FormControl(null, [Validators.maxLength(255)]),
      remoteBaseUrl: new FormControl(null, [Validators.maxLength(255)]),
      remoteEntry: new FormControl(null, [Validators.maxLength(255)]),
      exposedModule: new FormControl(null, [Validators.maxLength(255)]),
      classifications: new FormControl(null, [Validators.maxLength(255)]),
      contact: new FormControl(null, [Validators.maxLength(255)]),
      iconName: new FormControl(null, [Validators.maxLength(255)]),
      note: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  ngOnChanges() {
    if (this.appAbstract && this.displayDetailDialog) {
      if (this.changeMode !== 'CREATE') {
        this.getApp()
      } else if (this.changeMode === 'CREATE') {
        this.app = undefined
      }
    }
  }

  public getApp() {
    this.loading = true
    this.appApi
      .getMicrofrontendByAppId({ appId: this.appAbstract?.appId } as GetMicrofrontendByAppIdRequestParams)
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.app = data
            this.viewForm(this.app)
            if (this.changeMode === 'COPY') {
              if (this.app?.id) {
                this.app.id = undefined
                this.app.creationDate = undefined
                this.app.modificationDate = undefined
              }
              this.changeMode = 'CREATE'
            } else this.changeMode = 'EDIT'
          }
        }
      })
  }

  public viewForm(app?: Microfrontend): void {
    if (app)
      this.formGroup.setValue({
        appId: app['appId'],
        appName: app['appName'],
        appVersion: app['appVersion'],
        productName: app['productName'],
        description: app['description'],
        technology: app['technology'],
        remoteBaseUrl: app['remoteBaseUrl'],
        remoteEntry: app['remoteEntry'],
        exposedModule: app['exposedModule'],
        classifications: app['classifications'],
        contact: app['contact'],
        iconName: app['iconName'],
        note: app['note']
      })
  }

  public onDialogHide() {
    this.displayDetailDialogChange.emit(false)
  }
  public onSave() {
    if (!this.formGroup.valid) {
      this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
      return
    }
    this.app = { ...this.formGroup.value, id: this.app?.id }
    if (this.changeMode === 'CREATE') {
      this.createApp()
    } else if (this.changeMode === 'EDIT') {
      this.updateApp()
    }
  }

  private createApp() {
    this.appApi.createMicrofrontend({ createMicrofrontendRequest: this.app as CreateMicrofrontendRequest }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
        this.displayDetailDialogChange.emit(false)
      },
      error: (err) => {
        this.displaySaveError(err)
      }
    })
  }

  private updateApp() {
    this.appApi
      .updateMicrofrontend({
        id: this.app?.id ?? '',
        updateMicrofrontendRequest: this.app as UpdateMicrofrontendRequest
      })
      .subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
          this.displayDetailDialogChange.emit(false)
        },
        error: (err) => {
          this.displaySaveError(err)
        }
      })
  }

  private displaySaveError(err: any): void {
    let key = err?.error?.detail.indexOf('microfrontend_app_id') > 0 ? 'VALIDATION.APP.UNIQUE_CONSTRAINT.APP_ID' : ''
    key =
      err?.error?.detail.indexOf('microfrontend_remote_module') > 0
        ? 'VALIDATION.APP.UNIQUE_CONSTRAINT.REMOTE_MODULE'
        : key

    this.msgService.error({
      summaryKey: 'ACTIONS.' + this.changeMode + '.APP.NOK',
      detailKey:
        err?.error?.errorCode && err?.error?.errorCode === 'PERSIST_ENTITY_FAILED'
          ? key
          : 'VALIDATION.ERRORS.INTERNAL_ERROR'
    })
    console.error('err', err)
  }
}
