import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { finalize, map } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { TabView } from 'primeng/tabview'
import { Table } from 'primeng/table'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { IconService } from 'src/app/shared/iconservice'
import { dropDownSortItemsByLabel, convertToUniqueStringArray } from 'src/app/shared/utils'
import {
  CreateMicrofrontendRequest,
  CreateMicroserviceRequest,
  GetMicrofrontendRequestParams,
  GetMicroserviceRequestParams,
  MicrofrontendsAPIService,
  MicroservicesAPIService,
  MicrofrontendType,
  Microfrontend,
  Microservice,
  UpdateMicrofrontendRequest,
  UpdateMicroserviceRequest,
  UIEndpoint
} from 'src/app/shared/generated'

import { AppAbstract, ChangeMode } from '../app-search/app-search.component'

export interface MfeForm {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  appVersion: FormControl<string | null>
  productName: FormControl<string | null>
  description: FormControl<string | null>
  technology: FormControl<string | null>
  type: FormControl<string | null>
  remoteBaseUrl: FormControl<string | null>
  remoteName: FormControl<string | null>
  remoteEntry: FormControl<string | null>
  tagName: FormControl<string | null>
  classifications: FormControl<string[] | null>
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
export class AppDetailComponent implements OnInit, OnChanges {
  @Input() appAbstract: AppAbstract | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDialog = false
  @Output() appChanged = new EventEmitter<boolean>()

  @ViewChild('panelDetail') panelDetail: TabView | undefined
  @ViewChild('endpointTable') endpointTable: Table | undefined
  public mfe: Microfrontend | undefined
  public ms: Microservice | undefined
  public formGroupMfe: FormGroup
  public formGroupMs: FormGroup
  public selectedTabIndex = 0
  public dialogTitleKey: string | undefined = undefined
  public loading = false
  public operator = false
  public undeployed = false
  public deprecated = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public technologies: SelectItem[] = []
  public types: SelectItem[] = [
    { label: 'Module', value: 'MODULE' },
    { label: 'Component', value: 'COMPONENT' }
  ]
  public iconItems: SelectItem[] = []
  public endpoints: UIEndpoint[] = []
  public MicrofrontendType = MicrofrontendType

  constructor(
    private readonly user: UserService,
    private readonly icon: IconService,
    private readonly msApi: MicroservicesAPIService,
    private readonly mfeApi: MicrofrontendsAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
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
      technology: new FormControl(null),
      type: new FormControl(null),
      remoteBaseUrl: new FormControl(null, [Validators.maxLength(255)]),
      remoteEntry: new FormControl(null, [Validators.maxLength(255)]),
      remoteName: new FormControl(null, [Validators.maxLength(255)]),
      tagName: new FormControl(null, [Validators.maxLength(255)]),
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

  ngOnInit() {
    if (this.hasEditPermission && this.changeMode === 'VIEW') this.changeMode = 'EDIT'
    this.getDropdownTranslations()
  }

  ngOnChanges() {
    if (this.displayDialog) {
      this.enableForms()
      this.selectedTabIndex = 0
      this.dialogTitleKey = undefined
      this.ms = undefined
      this.mfe = undefined
      if (this.changeMode === 'CREATE') {
        this.formGroupMs.reset()
        this.formGroupMfe.reset()
        this.formGroupMfe.controls['type'].setValue('MODULE')
        this.formGroupMfe.controls['technology'].setValue('ANGULAR')
        this.dialogTitleKey = 'ACTIONS.CREATE.' + this.appAbstract?.appType + '.HEADER'
      }
      if (this.appAbstract?.id) {
        if (this.appAbstract.appType === 'MFE') this.getMfe()
        if (this.appAbstract.appType === 'MS') this.getMs()
      }
    }
  }

  public allowEditing(): boolean {
    return (
      (this.hasEditPermission && this.changeMode === 'EDIT') ||
      (this.hasCreatePermission && ['COPY', 'CREATE'].includes(this.changeMode))
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
    if (this.appAbstract?.id)
      this.mfeApi
        .getMicrofrontend({ id: this.appAbstract.id } as GetMicrofrontendRequestParams)
        .pipe(
          map((data: Microfrontend) => this.getMfeData(data)),
          finalize(() => (this.loading = false))
        )
        .subscribe()
  }
  private getMfeData(data: Microfrontend) {
    if (data) {
      this.mfe = data
      if (this.mfe) this.viewFormMfe(this.mfe)
      this.operator = this.mfe?.operator ?? false
      this.undeployed = this.mfe?.undeployed ?? false
      this.deprecated = this.mfe?.deprecated ?? false
      this.endpoints = this.mfe?.endpoints ?? []
      if (this.endpoints.length === 0) this.onAddEndpointRow()
      if (this.changeMode === 'COPY') {
        if (this.mfe?.id) {
          this.mfe.id = undefined
          this.mfe.operator = false
          this.mfe.undeployed = false
          this.mfe.deprecated = false
          this.mfe.creationDate = undefined
          this.mfe.creationUser = undefined
          this.mfe.modificationDate = undefined
          this.mfe.modificationUser = undefined
        }
        this.dialogTitleKey = 'ACTIONS.CREATE.MFE.HEADER'
      } else {
        this.dialogTitleKey = 'ACTIONS.' + (this.hasEditPermission ? 'EDIT' : 'VIEW') + '.MFE.HEADER'
      }
      this.enableForms()
    }
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
            this.operator = this.ms?.operator ?? false
            this.undeployed = this.ms?.undeployed ?? false
            if (this.changeMode === 'COPY') {
              if (this.ms?.id) {
                this.ms.id = undefined
                this.ms.operator = false
                this.ms.undeployed = false
                this.ms.creationDate = undefined
                this.ms.creationUser = undefined
                this.ms.modificationDate = undefined
                this.ms.modificationUser = undefined
              }
              this.dialogTitleKey = 'ACTIONS.CREATE.MS.HEADER'
            } else {
              this.dialogTitleKey = 'ACTIONS.' + (this.hasEditPermission ? 'EDIT' : 'VIEW') + '.MS.HEADER'
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
      type: mfe['type'],
      remoteBaseUrl: mfe['remoteBaseUrl'],
      remoteEntry: mfe['remoteEntry'],
      remoteName: mfe['remoteName'],
      tagName: mfe['tagName'],
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

  /**
   * UI Actions
   */
  public onDialogHide() {
    this.appChanged.emit(false)
  }

  public onAddEndpointRow() {
    this.endpoints.push({ name: '', path: '' })
  }

  public onDeleteEndpointRow(row: number) {
    if (this.endpoints.length > 1) this.endpoints.splice(row, 1)
  }

  public onSave() {
    if (this.appAbstract?.appType === 'MFE') {
      if (!this.formGroupMfe.valid) {
        this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
        return
      }
      this.mfe = { ...this.formGroupMfe.value, id: this.mfe?.id }
      if (this.mfe) {
        this.mfe.classifications = convertToUniqueStringArray(this.formGroupMfe.controls['classifications'].value)
        this.mfe.endpoints = this.endpoints.filter((endpoint) => !(endpoint.name === '' && endpoint.path === ''))
      }
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

  /**
   * DATA
   */
  private createMfe() {
    this.mfeApi.createMicrofrontend({ createMicrofrontendRequest: this.mfe as CreateMicrofrontendRequest }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
        this.appChanged.emit(true)
      },
      error: (err) => {
        this.displaySaveError('createMicrofrontend', err)
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
        this.displaySaveError('createMicroservice', err)
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
          this.displaySaveError('updateMicrofrontend', err)
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
          this.displaySaveError('updateMicroservice', err)
        }
      })
  }

  private displaySaveError(funcName: string, err: any): void {
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
    console.error(funcName, err)
  }

  private getDropdownTranslations() {
    this.translate.get(['APP.WEBCOMPONENT.MODULE', 'APP.WEBCOMPONENT.SCRIPT']).subscribe((data) => {
      this.technologies = [
        { label: 'Angular', value: 'ANGULAR' },
        { label: data['APP.WEBCOMPONENT.MODULE'], value: 'WEBCOMPONENTMODULE' },
        { label: data['APP.WEBCOMPONENT.SCRIPT'], value: 'WEBCOMPONENTSCRIPT' }
      ]
    })
  }
}
