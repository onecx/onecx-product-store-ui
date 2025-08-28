import { Component, Input, OnChanges } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

import { Product } from 'src/app/shared/generated'

export interface ProductInternForm {
  operator: FormControl<boolean | null>
  undeployed: FormControl<boolean | null>
  multitenancy: FormControl<boolean | null>
}

@Component({
  selector: 'app-product-intern',
  templateUrl: './product-intern.component.html'
})
export class ProductInternComponent implements OnChanges {
  @Input() product: Product | undefined
  @Input() editMode = false
  @Input() dateFormat = 'medium'

  public formGroup: FormGroup<ProductInternForm>

  constructor() {
    this.formGroup = new FormGroup<ProductInternForm>({
      operator: new FormControl<boolean>({ value: false, disabled: true }),
      undeployed: new FormControl<boolean>({ value: false, disabled: true }),
      multitenancy: new FormControl<boolean>({ value: false, disabled: true })
    })
  }

  public ngOnChanges(): void {
    if (this.product) {
      this.setFormData()
      this.editMode ? this.formGroup.get('undeployed')?.enable() : this.formGroup.get('undeployed')?.disable()
    } else {
      this.formGroup.reset()
    }
  }

  private setFormData(): void {
    Object.keys(this.formGroup.controls).forEach((element) => {
      this.formGroup.controls[element as keyof ProductInternForm].setValue((this.product as any)[element])
    })
  }

  public onSave(): Partial<Product> {
    let props: Partial<Product> = {} // always valid, only optional values
    if (this.product && this.formGroup.controls['undeployed'].value) {
      props = {
        undeployed: this.formGroup.controls['undeployed'].value
      }
    }
    return props
  }
}
