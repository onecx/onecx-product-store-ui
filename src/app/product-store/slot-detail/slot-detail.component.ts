import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { finalize, map } from 'rxjs'
import { TabView } from 'primeng/tabview'
import { Table } from 'primeng/table'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { CreateSlotRequest, SlotsAPIService, Slot, UpdateSlotRequest } from 'src/app/shared/generated'

import { ChangeMode } from '../product-detail/product-detail.component'
import { SlotInternComponent } from './slot-intern/slot-intern.component'

export interface SlotForm {
  name: FormControl<string | null>
  appId: FormControl<string | null>
  productName: FormControl<string | null>
  description?: FormControl<string | null>
  deprecated?: FormControl<string | null>
  undeployed?: FormControl<string | null>
}

@Component({
  selector: 'app-slot-detail',
  templateUrl: './slot-detail.component.html',
  styleUrls: ['./slot-detail.component.scss']
})
export class SlotDetailComponent implements OnInit, OnChanges {
  @Input() slot: Slot | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDialog = false
  @Output() changed = new EventEmitter<boolean>()

  @ViewChild('panelDetail') panelDetail: TabView | undefined
  @ViewChild('endpointTable') endpointTable: Table | undefined
  @ViewChild(SlotInternComponent, { static: false }) appInternComponent!: SlotInternComponent

  public formGroupSlot: FormGroup
  public selectedTabIndex = 0
  public dialogTitleKey: string | undefined = undefined
  public loading = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public undeployedValue: boolean | undefined = undefined

  constructor(
    private readonly user: UserService,
    private readonly slotApi: SlotsAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
  ) {
    this.hasCreatePermission = this.user.hasPermission('SLOT#CREATE')
    this.hasEditPermission = this.user.hasPermission('SLOT#EDIT')

    this.formGroupSlot = new FormGroup<SlotForm>({
      name: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      productName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  ngOnInit() {
    if (this.hasEditPermission && this.changeMode !== 'CREATE') this.changeMode = 'EDIT'
  }

  ngOnChanges() {
    if (this.displayDialog) {
      this.selectedTabIndex = 0
      this.dialogTitleKey = undefined
      this.formGroupSlot.reset()
      this.formGroupSlot.disable()
      this.prepareCreate()
      this.getSlot()
    }
  }

  private prepareCreate() {
    if (this.changeMode === 'CREATE') {
      this.slot = undefined
      this.enableForms()
      this.dialogTitleKey = 'ACTIONS.CREATE.SLOT.HEADER'
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
      this.formGroupSlot.enable()
    } else {
      this.formGroupSlot.disable()
    }
  }

  public getSlot() {
    this.loading = true
    if (this.slot?.id)
      this.slotApi
        .getSlot({ id: this.slot.id })
        .pipe(
          map((data: Slot) => this.getSlotData(data)),
          finalize(() => (this.loading = false))
        )
        .subscribe()
  }
  private getSlotData(data: Slot) {
    if (data) {
      this.slot = data
      if (this.slot) this.fillFormSlot(this.slot)
      if (this.changeMode === 'CREATE') {
        if (this.slot?.id) {
          this.slot.id = undefined
          this.slot.operator = false
          this.slot.undeployed = false
          this.slot.deprecated = false
          this.slot.creationDate = undefined
          this.slot.creationUser = undefined
          this.slot.modificationDate = undefined
          this.slot.modificationUser = undefined
        }
        this.dialogTitleKey = 'ACTIONS.CREATE.SLOT.HEADER'
      } else {
        this.dialogTitleKey = 'ACTIONS.' + (this.hasEditPermission ? 'EDIT' : 'VIEW') + '.SLOT.HEADER'
      }
      this.enableForms()
    }
  }

  public fillFormSlot(slot: Slot): void {
    // build form mfe by excluding not used fields
    const formSlot = (({
      id,
      creationDate,
      creationUser,
      modificationDate,
      modificationUser,
      modificationCount,
      operator,
      undeployed,
      deprecated,
      ...o
    }) => o)(slot)
    this.formGroupSlot.setValue(formSlot) // assign
  }

  /**
   * UI Actions
   */
  public onDialogHide() {
    this.slot = undefined
    this.changed.emit(false)
  }

  public onChangeUndeployedValue(val: boolean) {
    if (this.slot) this.slot.undeployed = val
  }

  public onSave() {
    if (!this.formGroupSlot.valid) {
      this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
      return
    }
    this.slot = {
      ...this.formGroupSlot.value,
      id: this.slot?.id,
      undeployed: this.changeMode === 'EDIT' ? this.slot?.undeployed : undefined
    }
    this.changeMode === 'CREATE' ? this.createSlot() : this.updateSlot()
  }

  /**
   * DATA
   */
  private createSlot() {
    this.slotApi.createSlot({ createSlotRequest: this.slot as CreateSlotRequest }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.SLOT.OK' })
        this.changed.emit(true)
      },
      error: (err) => {
        this.displaySaveError('createSlot', err)
      }
    })
  }
  private updateSlot() {
    this.slotApi
      .updateSlot({
        id: this.slot?.id ?? '',
        updateSlotRequest: this.slot as UpdateSlotRequest
      })
      .subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.SLOT.OK' })
          this.changed.emit(true)
        },
        error: (err) => {
          this.displaySaveError('updateSlot', err)
        }
      })
  }

  private displaySaveError(funcName: string, err: any): void {
    const key = err?.error?.detail.indexOf('slot_name') > 0 ? 'VALIDATION.SLOT.UNIQUE_CONSTRAINT.SLOT_NAME' : ''

    this.msgService.error({
      summaryKey: 'ACTIONS.' + this.changeMode + '.SLOT.NOK',
      detailKey:
        err?.error?.errorCode && err?.error?.errorCode === 'PERSIST_ENTITY_FAILED'
          ? key
          : 'VALIDATION.ERRORS.INTERNAL_ERROR'
    })
    console.error(funcName, err)
  }
}
