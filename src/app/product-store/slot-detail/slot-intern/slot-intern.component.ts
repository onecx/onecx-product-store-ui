import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { Slot } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
import { ChangeMode } from '../../product-detail/product-detail.component'

@Component({
  selector: 'app-slot-intern',
  standalone: true,
  imports: [
    DatePipe,
    ButtonModule,
    CheckboxModule,
    FloatLabelModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './slot-intern.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlotInternComponent implements OnChanges {
  @Input() slot: Slot | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Output() undeployed = new EventEmitter<boolean>()

  private readonly translate = inject(TranslateService)

  public slotForm: FormGroup

  constructor() {
    this.slotForm = new FormGroup({
      operator: new FormControl<boolean | null>(null),
      deprecated: new FormControl<boolean | null>(null),
      undeployed: new FormControl<boolean | null>(null)
    })
  }

  public ngOnChanges(): void {
    this.slotForm.reset()
    this.slotForm.disable()
    if (this.slot) {
      this.setFormData()
      this.changeMode === 'EDIT'
        ? this.slotForm.get('undeployed')?.enable()
        : this.slotForm.get('undeployed')?.disable()
    }
  }

  private setFormData(): void {
    Utils.setFormControlsValues(this.slotForm.controls, this.slot)
  }

  public onChangeUndeployed(ev: any) {
    this.undeployed.emit(ev.checked)
  }
}
