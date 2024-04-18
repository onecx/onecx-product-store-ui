import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs'
import { SelectItem } from 'primeng/api'

import { PortalMessageService, UserService } from '@onecx/portal-integration-angular'
import { IconService } from 'src/app/shared/iconservice'
import { dropDownSortItemsByLabel, convertToUniqueStringArray } from 'src/app/shared/utils'
import {
  CreateMicrofrontendRequest,
  CreateMicroserviceRequest,
  GetMicrofrontendRequestParams,
  GetMicroserviceRequestParams,
  MicrofrontendsAPIService,
  MicroservicesAPIService,
  Microfrontend,
  Microservice,
  UpdateMicrofrontendRequest,
  UpdateMicroserviceRequest
} from 'src/app/shared/generated'

import { AppAbstract, ChangeMode } from '../app-search/app-search.component'

export interface MfeForm {
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
export interface MsForm {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  appVersion: FormControl<string | null>
  productName: FormControl<string | null>
  description: FormControl<string | null>
}

@Component({
  selector: 'app-app-detail',
  templateUrl: './app-detail.component.html',
  styleUrls: ['./app-detail.component.scss']
})
export class AppDetailComponent implements OnChanges {
  @Input() appAbstract: AppAbstract | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDialog = false
  @Output() appChanged = new EventEmitter<boolean>()

  public mfe: Microfrontend | undefined
  public ms: Microservice | undefined
  public formGroupMfe: FormGroup
  public formGroupMs: FormGroup
  public loading = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public technologies: SelectItem[] = [
    { label: 'Angular', value: 'ANGULAR' },
    { label: 'WebComponent', value: 'WEBCOMPONENT' }
  ]
  public types: SelectItem[] = [
    { label: 'Module', value: 'MODULE' },
    { label: 'Component', value: 'COMPONENT' }
  ]
  public iconItems: SelectItem[] = [{ label: '', value: null }] // default value is empty
  public convertToUniqueStringArray = convertToUniqueStringArray

  constructor(
    private user: UserService,
    private icon: IconService,
    private msApi: MicroservicesAPIService,
    private mfeApi: MicrofrontendsAPIService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.hasCreatePermission = this.user.hasPermission('APP#CREATE')
    this.hasEditPermission = this.user.hasPermission('APP#EDIT')
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)

    this.formGroupMfe = new FormGroup<MfeForm>({
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
    this.formGroupMs = new FormGroup<MsForm>({
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appVersion: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      productName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  ngOnChanges() {
    this.enableForms()
    if (this.changeMode === 'CREATE') {
      this.ms = undefined
      this.mfe = undefined
      this.formGroupMs.reset()
      this.formGroupMfe.reset()
    }
    if (this.appAbstract?.id) {
      if (this.appAbstract.appType === 'MFE') this.getMfe()
      if (this.appAbstract.appType === 'MS') this.getMs()
    }
  }

  public allowEditing(): boolean {
    return (
      (this.hasEditPermission && this.changeMode === 'EDIT') ||
      (this.hasCreatePermission && this.changeMode === 'CREATE')
    )
  }
  private enableForms(): void {
    if (this.allowEditing()) {
      this.formGroupMs.enable()
      this.formGroupMfe.enable()
    } else {
      this.formGroupMs.disable()
      this.formGroupMfe.disable()
    }
  }

  public getMfe() {
    this.loading = true
    this.mfeApi
      .getMicrofrontend({ id: this.appAbstract?.id ?? '' } as GetMicrofrontendRequestParams)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.mfe = data
            if (this.mfe) this.viewFormMfe(this.mfe)
            if (this.changeMode === 'COPY') {
              if (this.mfe?.id) {
                this.mfe.id = undefined
                this.mfe.creationDate = undefined
                this.mfe.modificationDate = undefined
              }
              this.changeMode = 'CREATE'
            }
            this.enableForms()
          }
        }
      })
  }
  public getMs() {
    this.loading = true
    this.msApi
      .getMicroservice({ id: this.appAbstract?.id } as GetMicroserviceRequestParams)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.ms = data
            if (this.ms) this.viewFormMs(this.ms)
            if (this.changeMode === 'COPY') {
              if (this.ms?.id) {
                this.ms.id = undefined
                this.ms.creationDate = undefined
                this.ms.modificationDate = undefined
              }
              this.changeMode = 'CREATE'
            }
            this.enableForms()
          }
        }
      })
  }

  public viewFormMfe(mfe: Microfrontend): void {
    this.formGroupMfe.setValue({
      appId: mfe['appId'],
      appName: mfe['appName'],
      appVersion: mfe['appVersion'],
      productName: mfe['productName'],
      description: mfe['description'],
      technology: mfe['technology'],
      remoteBaseUrl: mfe['remoteBaseUrl'],
      remoteEntry: mfe['remoteEntry'],
      exposedModule: mfe['exposedModule'],
      classifications: mfe['classifications'],
      contact: mfe['contact'],
      iconName: mfe['iconName'],
      note: mfe['note']
    })
  }
  public viewFormMs(ms: Microservice): void {
    this.formGroupMs.setValue({
      appId: ms['appId'],
      appName: ms['appName'],
      appVersion: ms['appVersion'],
      productName: ms['productName'],
      description: ms['description']
    })
  }

  public onDialogHide() {
    this.appChanged.emit(false)
  }

  public onSave() {
    if (this.appAbstract?.appType === 'MFE') {
      if (!this.formGroupMfe.valid) {
        this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
        return
      }
      this.mfe = { ...this.formGroupMfe.value, id: this.mfe?.id }
      if (this.mfe)
        this.mfe.classifications = this.convertToUniqueStringArray(this.formGroupMfe.controls['classifications'].value)
      this.changeMode === 'CREATE' ? this.createMfe() : this.updateMfe()
    }
    if (this.appAbstract?.appType === 'MS') {
      if (!this.formGroupMs.valid) {
        this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
        return
      }
      this.ms = { ...this.formGroupMs.value, id: this.ms?.id }
      this.changeMode === 'CREATE' ? this.createMs() : this.updateMs()
    }
  }

  private createMfe() {
    this.mfeApi.createMicrofrontend({ createMicrofrontendRequest: this.mfe as CreateMicrofrontendRequest }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
        this.appChanged.emit(true)
      },
      error: (err) => {
        this.displaySaveError(err)
      }
    })
  }
  private createMs() {
    this.msApi.createMicroservice({ createMicroserviceRequest: this.ms as CreateMicroserviceRequest }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
        this.appChanged.emit(true)
      },
      error: (err) => {
        this.displaySaveError(err)
      }
    })
  }

  private updateMfe() {
    this.mfeApi
      .updateMicrofrontend({
        id: this.mfe?.id ?? '',
        updateMicrofrontendRequest: this.mfe as UpdateMicrofrontendRequest
      })
      .subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
          this.appChanged.emit(true)
        },
        error: (err) => {
          this.displaySaveError(err)
        }
      })
  }
  private updateMs() {
    this.msApi
      .updateMicroservice({
        id: this.ms?.id ?? '',
        updateMicroserviceRequest: this.ms as UpdateMicroserviceRequest
      })
      .subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
          this.appChanged.emit(true)
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
