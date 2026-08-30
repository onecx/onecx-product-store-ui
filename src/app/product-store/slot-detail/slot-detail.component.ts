import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize, map } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { Table } from 'primeng/table'
import { TabsModule } from 'primeng/tabs'
import { TooltipModule } from 'primeng/tooltip'

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
  standalone: true,
  imports: [
    SlotInternComponent,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TabsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './slot-detail.component.html',
  styleUrls: ['./slot-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlotDetailComponent implements OnInit, OnChanges {
  private readonly user = inject(UserService)
  private readonly slotApi = inject(SlotsAPIService)
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)

  @Input() slot: Slot | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDialog = false
  @Output() changed = new EventEmitter<boolean>()

  @ViewChild('endpointTable') endpointTable: Table | undefined
  @ViewChild(SlotInternComponent, { static: false }) appInternComponent!: SlotInternComponent

  public selectedTabIndex = '0'
  public dialogTitleKey: string | undefined = undefined
  public loading = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public hasViewPermission = false
  public undeployedValue: boolean | undefined = undefined
  public slotForm = new FormGroup<SlotForm>({
    name: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
    appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
    productName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
    description: new FormControl(null, [Validators.maxLength(255)])
  })

  ngOnInit() {
    void this.initPermissions()
  }
  private async initPermissions(): Promise<void> {
    this.hasCreatePermission = await this.user.hasPermission('SLOT#CREATE')
    this.hasEditPermission = await this.user.hasPermission('SLOT#EDIT')
    this.hasViewPermission = await this.user.hasPermission('SLOT#VIEW')
  }

  ngOnChanges() {
    // check and fix changeMode
    if (!this.hasViewPermission && this.changeMode === 'VIEW') return
    if (!this.hasEditPermission && this.changeMode === 'EDIT') return
    if (!this.hasCreatePermission && this.changeMode === 'CREATE') return
    this.dialogTitleKey = 'ACTIONS.' + this.changeMode + '.SLOT.HEADER'

    if (this.displayDialog && this.slot) {
      this.selectedTabIndex = '0'
      this.slotForm.reset()
      this.slotForm.disable()
      this.getSlot()
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
      this.fillFormSlot(this.slot)
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
      }
      if (['EDIT', 'CREATE'].includes(this.changeMode)) this.slotForm.enable()
    }
  }

  // fill form with slot data, excluding fields not used in the form
  public fillFormSlot(slot: Slot): void {
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
    this.slotForm.setValue(formSlot)
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

  public onTabChange(tabValue: string | number) {
    this.selectedTabIndex = typeof tabValue === 'number' ? tabValue.toString() : tabValue
  }

  public onSave() {
    if (!this.slotForm.valid) {
      this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
      return
    }
    this.slot = {
      id: this.slot?.id,
      ...this.slotForm.value,
      undeployed: this.changeMode === 'EDIT' ? this.slot?.undeployed : undefined
    } as Slot
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
