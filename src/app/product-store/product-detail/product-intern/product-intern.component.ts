import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { Product } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'

export interface ProductInternForm {
  operator: FormControl<boolean | null>
  undeployed: FormControl<boolean | null>
  multitenancy: FormControl<boolean | null>
}

@Component({
  selector: 'app-product-intern',
  standalone: true,
  imports: [
    DatePipe,
    CheckboxModule,
    FloatLabelModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './product-intern.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductInternComponent {
  public readonly product = input<Product>()
  public readonly editMode = input(false)
  public readonly dateFormat = input('medium')

  public formGroup: FormGroup<ProductInternForm>

  constructor() {
    this.formGroup = new FormGroup<ProductInternForm>({
      operator: new FormControl<boolean>({ value: false, disabled: true }),
      undeployed: new FormControl<boolean>({ value: false, disabled: true }),
      multitenancy: new FormControl<boolean>({ value: false, disabled: true })
    })

    // replaces ngOnChanges: signal inputs don't trigger it
    effect(() => {
      if (this.product()) {
        this.setFormData()
        this.editMode() ? this.formGroup.get('undeployed')?.enable() : this.formGroup.get('undeployed')?.disable()
      } else {
        this.formGroup.reset()
      }
    })
  }

  private setFormData(): void {
    Utils.setFormControlsValues(this.formGroup.controls, this.product(), false)
  }

  public onSave(): Partial<Product> {
    let props: Partial<Product> = {} // always valid, only optional values
    if (this.product() && this.formGroup.controls['undeployed'].value) {
      props = {
        undeployed: this.formGroup.controls['undeployed'].value
      }
    }
    return props
  }
}
