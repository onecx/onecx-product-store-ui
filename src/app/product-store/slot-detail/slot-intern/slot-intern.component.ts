import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'

import { Slot } from 'src/app/shared/generated'
import { ChangeMode } from '../../product-detail/product-detail.component'

@Component({
  selector: 'app-slot-intern',
  templateUrl: './slot-intern.component.html'
})
export class SlotInternComponent implements OnChanges {
  @Input() slot: Slot | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Output() undeployed = new EventEmitter<boolean>()

  public slotForm: FormGroup

  constructor(private readonly translate: TranslateService) {
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
    for (const key of Object.keys(this.slotForm.controls))
      if (this.slot && (this.slot as any)[key] !== null) this.slotForm.controls[key].setValue((this.slot as any)[key])
  }

  public onChangeUndeployed(ev: any) {
    this.undeployed.emit(ev.checked)
  }
}
