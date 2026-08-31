import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild
} from '@angular/core'
import { NgClass } from '@angular/common'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize, map } from 'rxjs'

import { SelectItem } from 'primeng/api'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { MultiSelectModule } from 'primeng/multiselect'
import { SelectModule } from 'primeng/select'
import { Table, TableModule } from 'primeng/table'
import { TabsModule } from 'primeng/tabs'
import { TextareaModule } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { IconService } from 'src/app/shared/iconservice'
import { Utils } from 'src/app/shared/utils'
import {
  CreateMicrofrontendRequest,
  CreateMicroserviceRequest,
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

import { ChangeMode } from '../product-detail/product-detail.component'
import { AppAbstract } from '../app-search/app-search.component'
import { AppInternComponent } from './app-intern/app-intern.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

export interface MfeForm {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  appVersion: FormControl<string | null>
  productName: FormControl<string | null>
  description: FormControl<string | null>
  shareScope: FormControl<string | null>
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
  standalone: true,
  imports: [
    NgClass,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    FormsModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    ReactiveFormsModule,
    SelectModule,
    TableModule,
    TabsModule,
    TextareaModule,
    TooltipModule,
    TranslateModule,
    // components
    AppInternComponent
  ],
  templateUrl: './app-detail.component.html',
  styleUrls: ['./app-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef)
  private readonly cd = inject(ChangeDetectorRef)
  private readonly user = inject(UserService)
  private readonly icon = inject(IconService)
  private readonly msApi = inject(MicroservicesAPIService)
  private readonly mfeApi = inject(MicrofrontendsAPIService)
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)

  public readonly appAbstract = input<AppAbstract>()
  public readonly dateFormat = input('medium')
  public readonly changeModeInput = input<ChangeMode>('VIEW', { alias: 'changeMode' })
  public readonly displayDialog = input(false)
  public readonly appChanged = output<boolean>()

  public readonly endpointTable = viewChild<Table>('endpointTable')
  public readonly appInternComponent = viewChild(AppInternComponent)

  // local state derived from changeModeInput, owned by the component once the dialog is open
  public readonly changeMode = signal<ChangeMode>('VIEW')

  public mfe: Microfrontend | undefined
  public ms: Microservice | undefined
  public formGroupMfe: FormGroup
  public formGroupMs: FormGroup
  public selectedTabIndex = '0' // have to be a string, number does not work
  public dialogTitleKey: string | undefined = undefined
  public loading = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public mfeTypes: SelectItem[] = [
    { label: 'Module', value: 'MODULE' },
    { label: 'Component', value: 'COMPONENT' }
  ]
  public technologies: SelectItem[] = []
  public iconItems: SelectItem[] = []
  public endpoints: UIEndpoint[] = []
  public MicrofrontendType = MicrofrontendType
  public appUndeployedValue: boolean | undefined = undefined

  constructor() {
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(Utils.dropDownSortItemsByLabel)

    this.formGroupMfe = new FormGroup<MfeForm>({
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appVersion: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      productName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      shareScope: new FormControl(null, [Validators.maxLength(255)]),
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

    // replaces ngOnChanges: signal inputs don't trigger it, so reset/reload state whenever the dialog (re)opens
    effect(() => {
      if (this.displayDialog()) {
        this.changeMode.set(this.changeModeInput())
        this.selectedTabIndex = '0'
        this.dialogTitleKey = undefined
        this.ms = undefined
        this.mfe = undefined
        this.formGroupMs.reset()
        this.formGroupMfe.reset()
        this.formGroupMs.disable()
        this.formGroupMfe.disable()
        this.prepareCreate()
        const appAbstract = this.appAbstract()
        if (appAbstract?.id) {
          if (appAbstract.appType === 'MFE') this.getMfe()
          if (appAbstract.appType === 'MS') this.getMs()
        }
      }
    })
  }

  ngOnInit() {
    void this.initPermissions()
    if (this.hasEditPermission && this.changeMode() === 'VIEW') this.changeMode.set('EDIT')
    this.getDropdownTranslations()
  }

  private async initPermissions(): Promise<void> {
    this.hasCreatePermission = await this.user.hasPermission('APP#CREATE')
    this.hasEditPermission = await this.user.hasPermission('APP#EDIT')
    if (this.hasEditPermission && this.changeMode() === 'VIEW') this.changeMode.set('EDIT')
  }

  private prepareCreate() {
    if (this.changeMode() === 'CREATE') {
      this.enableForms()
      if (this.appAbstract()?.appType === 'MFE') {
        this.formGroupMfe.controls['type'].setValue('MODULE')
        this.formGroupMfe.controls['technology'].setValue('ANGULAR')
      }
      this.dialogTitleKey = 'ACTIONS.CREATE.' + this.appAbstract()?.appType + '.HEADER'
    }
  }

  public allowEditing(): boolean {
    return (
      (this.hasEditPermission && this.changeMode() === 'EDIT') ||
      (this.hasCreatePermission && this.changeMode() === 'CREATE')
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
    const appAbstract = this.appAbstract()
    if (appAbstract?.id)
      this.mfeApi
        .getMicrofrontend({ id: appAbstract.id })
        .pipe(
          map((data: Microfrontend) => this.getMfeData(data)),
          // OnPush: subscribe() mutates plain fields (dialogTitleKey, mfe, ...), so mark the view dirty once the async fetch settles
          finalize(() => {
            this.loading = false
            this.cd.markForCheck()
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe()
  }
  private getMfeData(data: Microfrontend) {
    if (data) {
      this.mfe = data
      if (this.mfe) this.fillFormMfe(this.mfe)
      this.endpoints = this.mfe?.endpoints ?? []
      if (this.endpoints.length === 0) this.onAddEndpointRow()
      if (this.changeMode() === 'CREATE') {
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
      .getMicroservice({ id: this.appAbstract()?.id } as GetMicroserviceRequestParams)
      .pipe(
        // OnPush: subscribe() mutates plain fields (dialogTitleKey, ms, ...), so mark the view dirty once the async fetch settles
        finalize(() => {
          this.loading = false
          this.cd.markForCheck()
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.ms = data
            if (this.ms) this.fillFormMs(this.ms)
            if (this.changeMode() === 'CREATE') {
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

  public fillFormMfe(mfe: Microfrontend): void {
    // build form mfe by excluding not used fields
    const formMfe = (({
      id,
      creationDate,
      creationUser,
      modificationDate,
      modificationUser,
      modificationCount,
      operator,
      undeployed,
      deprecated,
      endpoints,
      ...o
    }) => o)(mfe)
    this.formGroupMfe.patchValue(formMfe) // assign
  }
  public fillFormMs(ms: Microservice): void {
    this.formGroupMs.patchValue({
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
    // displayDialog is owned by the parent; it will be reset to false via the appChanged callback
    this.mfe = undefined
    this.ms = undefined
    this.appChanged.emit(false)
  }

  public onAddEndpointRow() {
    this.endpoints.push({ name: '', path: '' })
  }

  public onDeleteEndpointRow(row: number) {
    if (this.endpoints.length > 1) this.endpoints.splice(row, 1)
  }

  public onChangeUndeployedValue(val: boolean) {
    if (this.mfe) this.mfe.undeployed = val
    if (this.ms) this.ms.undeployed = val
  }

  public onTabChange(tabValue: string | number) {
    this.selectedTabIndex = typeof tabValue === 'number' ? tabValue.toString() : tabValue
  }

  public onSave() {
    if (this.appAbstract()?.appType === 'MFE') {
      if (!this.formGroupMfe.valid) {
        this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
        return
      }
      this.saveMfe()
    }
    if (this.appAbstract()?.appType === 'MS') {
      if (!this.formGroupMs.valid) {
        this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
        return
      }
      this.saveMs()
    }
  }

  /**
   * DATA
   */
  private saveMfe() {
    this.mfe = {
      ...this.formGroupMfe.value,
      id: this.mfe?.id,
      undeployed: this.changeMode() === 'EDIT' ? this.mfe?.undeployed : undefined
    }
    if (this.mfe) {
      this.mfe.classifications = Utils.convertToUniqueStringArray(this.formGroupMfe.controls['classifications'].value)
      this.mfe.endpoints = this.endpoints.filter((endpoint) => !(endpoint.name === '' && endpoint.path === ''))
    }
    this.changeMode() === 'CREATE' ? this.createMfe() : this.updateMfe()
  }
  private saveMs() {
    this.ms = {
      ...this.formGroupMs.value,
      id: this.ms?.id,
      undeployed: this.changeMode() === 'EDIT' ? this.ms?.undeployed : undefined
    }
    this.changeMode() === 'CREATE' ? this.createMs() : this.updateMs()
  }
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
      summaryKey: 'ACTIONS.' + this.changeMode() + '.APP.NOK',
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
